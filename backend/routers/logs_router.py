from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
import io

from auth import get_admin_user
from database import get_db
from models import AuditLog, User

router = APIRouter(prefix="/logs", tags=["Audit Logs"])


class AuditLogOut(BaseModel):
    timestamp: str
    user: str
    action: str
    file: Optional[str] = None
    details: str
    ipAddress: str

    class Config:
        from_attributes = True


@router.get("", response_model=list[AuditLogOut])
def get_logs(
    user: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    dateFrom: Optional[str] = Query(None),
    dateTo: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    query = db.query(AuditLog).order_by(AuditLog.timestamp.desc())

    if user:
        query = query.filter(AuditLog.user == user)
    if action:
        query = query.filter(AuditLog.action == action)
    if dateFrom:
        try:
            dt_from = datetime.fromisoformat(dateFrom)
            query = query.filter(AuditLog.timestamp >= dt_from)
        except ValueError:
            pass
    if dateTo:
        try:
            dt_to = datetime.fromisoformat(dateTo)
            query = query.filter(AuditLog.timestamp <= dt_to)
        except ValueError:
            pass

    logs = query.limit(200).all()
    result = []
    for log in logs:
        result.append(AuditLogOut(
            timestamp=log.timestamp.isoformat() if log.timestamp else "",
            user=log.user,
            action=log.action,
            file=log.file,
            details=log.details,
            ipAddress=log.ipAddress,
        ))
    return result


@router.get("/export/siem")
def export_siem_logs(
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    """Export all audit logs in CEF (Common Event Format) for SIEM ingestion."""
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).all()

    severity_map = {
        "User Login": 1,
        "File Upload": 3,
        "File Download": 3,
        "PII Detection": 6,
        "DPDP_High_Risk_Alert": 9,
        "Consent_Update": 2,
        "Data_Erasure": 8,
    }

    lines = []
    for log in logs:
        ts = log.timestamp.strftime("%b %d %Y %H:%M:%S") if log.timestamp else ""
        severity = severity_map.get(log.action, 5)
        file_ext = f" fname={log.file}" if log.file else ""
        cef_line = (
            f"CEF:0|SecureData|SanitizationEngine|2.4.1|{log.action}|"
            f"{log.details}|{severity}|"
            f"src={log.ipAddress} suser={log.user} rt={ts}{file_ext}"
        )
        lines.append(cef_line)

    content = "\n".join(lines)
    return StreamingResponse(
        io.BytesIO(content.encode("utf-8")),
        media_type="text/plain",
        headers={"Content-Disposition": "attachment; filename=securedata_siem_audit.log"},
    )
