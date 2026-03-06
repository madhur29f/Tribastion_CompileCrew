from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

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
