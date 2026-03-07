import logging
import sys
from datetime import datetime, timezone, timedelta

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


# ---------------------------------------------------------------------------
# DPDP Act: Redact a user's identity from audit logs
# ---------------------------------------------------------------------------
REDACTED_MARKER = "[REDACTED_DPDP_COMPLIANCE]"


def redact_user_from_logs(
    db: Session,
    *,
    username: str,
    email: str,
    days: int = 30,
):
    """
    DPDP Act — Right to be Forgotten.

    Scans audit_logs from the last `days` days, replaces any occurrence of
    the user's username or email with [REDACTED_DPDP_COMPLIANCE].

    This ensures the user's digital footprint is scrubbed from SIEM records
    without breaking database integrity (rows are updated, not deleted).
    """
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)

    # Find all audit log entries mentioning this user (by username or in details)
    logs = (
        db.query(AuditLog)
        .filter(AuditLog.timestamp >= cutoff)
        .filter(
            (AuditLog.user == username)
            | (AuditLog.details.contains(username))
            | (AuditLog.details.contains(email))
        )
        .all()
    )

    redacted_count = 0
    for log in logs:
        if log.user == username:
            log.user = REDACTED_MARKER
        if username in log.details:
            log.details = log.details.replace(username, REDACTED_MARKER)
        if email in log.details:
            log.details = log.details.replace(email, REDACTED_MARKER)
        redacted_count += 1

    if redacted_count > 0:
        db.commit()

    siem_logger.info(
        f"DPDP: Redacted {redacted_count} audit log entries for user erasure",
        extra={
            "event_type": "DPDP_Log_Redaction",
            "entries_redacted": redacted_count,
            "lookback_days": days,
        },
    )

    return redacted_count
