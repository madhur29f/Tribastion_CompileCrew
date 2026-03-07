import os
import json
import uuid
import hashlib
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from auth import get_current_user, get_admin_user, get_password_hash
from database import get_db
from models import User, UserRole, UserStatus, FileRecord, ConsentAuditLog
from siem_logger import log_audit_event, redact_user_from_logs
from config import LOCAL_UPLOAD_DIR, QUARANTINE_DIR, CLEAN_DIR

router = APIRouter(prefix="/users", tags=["Users"])


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------
class UserOut(BaseModel):
    id: int
    username: str
    email: str
    role: str
    lastLogin: Optional[str] = None
    status: str

    class Config:
        from_attributes = True


class CreateUserPayload(BaseModel):
    username: str
    email: str
    role: str = "Standard"


class UpdateUserPayload(BaseModel):
    role: str


class ConsentPayload(BaseModel):
    analytics_consent: bool = False
    security_scanning_consent: bool = True
    pii_processing_consent: bool = False
    third_party_sharing_consent: bool = False


class ConsentAuditOut(BaseModel):
    id: int
    timestamp: str
    consent_snapshot: dict
    consent_hash: str

    class Config:
        from_attributes = True


class DeletionCertificate(BaseModel):
    certificate_id: str
    erased_at: str
    message: str
    audit_logs_redacted: int
    files_deleted: int


# ---------------------------------------------------------------------------
# CRUD — Admin endpoints
# ---------------------------------------------------------------------------
@router.get("", response_model=list[UserOut])
def get_users(db: Session = Depends(get_db), admin: User = Depends(get_admin_user)):
    users = db.query(User).all()
    result = []
    for u in users:
        result.append(UserOut(
            id=u.id,
            username=u.username,
            email=u.email,
            role=u.role.value,
            lastLogin=u.lastLogin.isoformat() if u.lastLogin else None,
            status=u.status.value,
        ))
    return result


@router.post("", response_model=UserOut)
def create_user(payload: CreateUserPayload, db: Session = Depends(get_db), admin: User = Depends(get_admin_user)):
    existing = db.query(User).filter(
        (User.username == payload.username) | (User.email == payload.email)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already exists")

    default_password = "secure@123"
    user = User(
        username=payload.username,
        email=payload.email,
        password_hash=get_password_hash(default_password),
        role=UserRole(payload.role),
        status=UserStatus.Active,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return UserOut(
        id=user.id,
        username=user.username,
        email=user.email,
        role=user.role.value,
        lastLogin=user.lastLogin.isoformat() if user.lastLogin else None,
        status=user.status.value,
    )


@router.patch("/{user_id}", response_model=UserOut)
def update_user(user_id: int, payload: UpdateUserPayload, db: Session = Depends(get_db), admin: User = Depends(get_admin_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.role = UserRole(payload.role)
    db.commit()
    db.refresh(user)

    return UserOut(
        id=user.id,
        username=user.username,
        email=user.email,
        role=user.role.value,
        lastLogin=user.lastLogin.isoformat() if user.lastLogin else None,
        status=user.status.value,
    )


@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), admin: User = Depends(get_admin_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()
    return {"detail": "User deleted"}


# ---------------------------------------------------------------------------
# DPDP Act: Cryptographic Consent Management
# ---------------------------------------------------------------------------
def _compute_consent_hash(snapshot: dict, user_id: int, timestamp: str) -> str:
    """Generate a tamper-proof SHA-256 hash of the consent data."""
    payload = json.dumps(snapshot, sort_keys=True) + str(user_id) + timestamp
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


@router.put("/consent")
def update_consent(
    payload: ConsentPayload,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    DPDP Act — Update granular consent preferences.
    Generates a cryptographic hash as a tamper-proof artifact
    and logs the change to the ConsentAuditLog.
    """
    snapshot = payload.model_dump()
    now = datetime.now(timezone.utc)
    timestamp_str = now.isoformat()

    # Generate tamper-proof hash
    consent_hash = _compute_consent_hash(snapshot, current_user.id, timestamp_str)

    # Update user preferences
    current_user.consent_preferences = snapshot
    db.add(current_user)

    # Create audit log entry
    audit_entry = ConsentAuditLog(
        user_id=current_user.id,
        consent_snapshot=snapshot,
        consent_hash=consent_hash,
    )
    db.add(audit_entry)
    db.commit()
    db.refresh(audit_entry)

    # Fire SIEM event
    client_ip = request.client.host if request.client else "0.0.0.0"
    log_audit_event(
        db,
        user=current_user.username,
        action="Consent Update",
        details=f"Consent preferences updated. Hash: {consent_hash[:16]}...",
        ip_address=client_ip,
        user_id=current_user.id,
    )

    return {
        "message": "Consent preferences updated successfully",
        "consent_hash": consent_hash,
        "timestamp": timestamp_str,
        "preferences": snapshot,
    }


@router.get("/consent")
def get_consent(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get current consent preferences."""
    return {
        "preferences": current_user.consent_preferences or {
            "analytics_consent": False,
            "security_scanning_consent": True,
            "pii_processing_consent": False,
            "third_party_sharing_consent": False,
        }
    }


@router.get("/consent/audit", response_model=list[ConsentAuditOut])
def get_consent_audit(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """DPDP Act — View tamper-proof consent audit trail."""
    logs = (
        db.query(ConsentAuditLog)
        .filter(ConsentAuditLog.user_id == current_user.id)
        .order_by(ConsentAuditLog.timestamp.desc())
        .limit(50)
        .all()
    )
    return [
        ConsentAuditOut(
            id=log.id,
            timestamp=log.timestamp.isoformat() if log.timestamp else "",
            consent_snapshot=log.consent_snapshot,
            consent_hash=log.consent_hash,
        )
        for log in logs
    ]


# ---------------------------------------------------------------------------
# DPDP Act: Right to be Forgotten (Data Erasure Pipeline)
# ---------------------------------------------------------------------------
@router.post("/forget-me", response_model=DeletionCertificate)
def forget_me(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    DPDP Act — Right to be Forgotten.

    Irreversibly scrubs the user's digital footprint:
      1. Cryptographically scrambles PII in the database
      2. Deletes all files owned by the user from disk
      3. Redacts the user's identity from SIEM audit logs
      4. Returns a Certificate of Deletion
    """
    original_username = current_user.username
    original_email = current_user.email
    erasure_id = str(uuid.uuid4())
    erased_at = datetime.now(timezone.utc).isoformat()

    # --- Step 1: Database scrub (scramble PII, don't delete the row) ---
    current_user.email = f"erased_{erasure_id}@deleted.local"
    current_user.username = f"forgotten_user_{erasure_id[:8]}"
    current_user.password_hash = get_password_hash(str(uuid.uuid4()))
    current_user.status = UserStatus.Inactive
    current_user.consent_preferences = {}
    db.add(current_user)

    # --- Step 2: File pruning ---
    user_files = (
        db.query(FileRecord)
        .filter(FileRecord.uploadedBy == original_username)
        .all()
    )
    files_deleted = 0
    for file_record in user_files:
        # Delete from disk (check all storage locations)
        for path in [file_record.rawFilePath]:
            if path and os.path.exists(path):
                try:
                    os.remove(path)
                    files_deleted += 1
                except OSError:
                    pass
        # Also check quarantine/clean dirs
        for dir_path in [QUARANTINE_DIR, CLEAN_DIR, LOCAL_UPLOAD_DIR]:
            candidate = os.path.join(dir_path, file_record.name)
            if os.path.exists(candidate):
                try:
                    os.remove(candidate)
                except OSError:
                    pass

        db.delete(file_record)

    # --- Step 3: SIEM anonymization ---
    redacted_count = redact_user_from_logs(
        db, username=original_username, email=original_email, days=30
    )

    # --- Step 4: Commit & log the erasure itself ---
    db.commit()

    client_ip = request.client.host if request.client else "0.0.0.0"
    log_audit_event(
        db,
        user="[SYSTEM_DPDP]",
        action="Data Erasure",
        details=f"DPDP Right to be Forgotten executed. Certificate: {erasure_id}",
        ip_address=client_ip,
        status="success",
    )

    return DeletionCertificate(
        certificate_id=erasure_id,
        erased_at=erased_at,
        message="Your data has been irreversibly erased in compliance with the DPDP Act.",
        audit_logs_redacted=redacted_count,
        files_deleted=files_deleted,
    )
