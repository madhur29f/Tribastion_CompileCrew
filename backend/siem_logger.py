import logging
import sys
from datetime import datetime, timezone

from pythonjsonlogger import jsonlogger
from sqlalchemy.orm import Session

from models import AuditLog

# ---------------------------------------------------------------------------
# Configure the SIEM-compatible JSON logger
# ---------------------------------------------------------------------------
siem_logger = logging.getLogger("securedata-siem")
siem_logger.setLevel(logging.INFO)
siem_logger.propagate = False

if not siem_logger.handlers:
    handler = logging.StreamHandler(sys.stdout)

    class SIEMFormatter(jsonlogger.JsonFormatter):
        def add_fields(self, log_record, record, message_dict):
            super().add_fields(log_record, record, message_dict)
            log_record["timestamp"] = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
            log_record["severity"] = record.levelname
            log_record["app_name"] = "securedata-siem"

    formatter = SIEMFormatter()
    handler.setFormatter(formatter)
    siem_logger.addHandler(handler)


# ---------------------------------------------------------------------------
# Helper: log to DB + stdout in one call
# ---------------------------------------------------------------------------
def log_audit_event(
    db: Session,
    *,
    user: str,
    action: str,
    details: str,
    ip_address: str = "0.0.0.0",
    file: str | None = None,
    user_id: int | None = None,
    status: str = "success",
):
    """Insert into AuditLogs table AND emit a SIEM JSON log line."""

    # 1. Database insert
    log_entry = AuditLog(
        user=user,
        action=action,
        file=file,
        details=details,
        ipAddress=ip_address,
    )
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)

    # 2. Structured SIEM log to stdout
    siem_logger.info(
        details,
        extra={
            "event_type": action,
            "user_id": user_id,
            "username": user,
            "source_ip": ip_address,
            "resource": file or "",
            "status": status,
        },
    )

    return log_entry
