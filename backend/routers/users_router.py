from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from auth import get_admin_user, get_password_hash
from database import get_db
from models import User, UserRole, UserStatus

router = APIRouter(prefix="/users", tags=["Users"])


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
    # Check uniqueness
    existing = db.query(User).filter(
        (User.username == payload.username) | (User.email == payload.email)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already exists")

    # Default password for new users
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
