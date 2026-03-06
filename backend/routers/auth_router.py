from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from auth import verify_password, create_access_token, get_password_hash
from database import get_db
from models import User, UserRole, UserStatus
from siem_logger import log_audit_event

router = APIRouter(prefix="/auth", tags=["Auth"])


class LoginPayload(BaseModel):
    username: str
    password: str


class AuthResponse(BaseModel):
    token: str
    role: str
    user_id: int
    username: str


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginPayload, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == payload.username).first()

    # Auto-register demo users if they don't exist
    if user is None and payload.username in ("admin1", "john_doe"):
        role = UserRole.Admin if payload.username == "admin1" else UserRole.Standard
        email = f"{payload.username}@securedata.com"
        user = User(
            username=payload.username,
            email=email,
            password_hash=get_password_hash(payload.password),
            role=role,
            status=UserStatus.Active,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect username or password")

    # Update last login
    user.lastLogin = datetime.now(timezone.utc)
    db.commit()

    token = create_access_token(data={"sub": user.username, "role": user.role.value, "user_id": user.id})

    client_ip = request.client.host if request.client else "0.0.0.0"
    log_audit_event(
        db,
        user=user.username,
        action="User Login",
        details="Successful login",
        ip_address=client_ip,
        user_id=user.id,
    )

    return AuthResponse(
        token=token,
        role=user.role.value,
        user_id=user.id,
        username=user.username,
    )
