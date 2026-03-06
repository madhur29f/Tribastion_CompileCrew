from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import FileRecord, User, UserStatus, AuditLog

router = APIRouter(prefix="/stats", tags=["Dashboard"])


class DashboardStats(BaseModel):
    totalFiles: int
    piiDetected: int
    activeUsers: int
    sanitizedDownloads: int


@router.get("", response_model=DashboardStats)
def get_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    total_files = db.query(FileRecord).count()
    pii_detected = sum(f.piiDetected for f in db.query(FileRecord).all())
    active_users = db.query(User).filter(User.status == UserStatus.Active).count()

    # Count sanitized download events from audit logs
    sanitized_downloads = db.query(AuditLog).filter(
        AuditLog.action == "File Download"
    ).count()

    return DashboardStats(
        totalFiles=total_files,
        piiDetected=pii_detected,
        activeUsers=active_users,
        sanitizedDownloads=sanitized_downloads,
    )
