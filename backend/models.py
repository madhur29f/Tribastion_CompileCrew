from sqlalchemy import Column, Integer, String, DateTime, Enum as SAEnum, JSON, ForeignKey
from sqlalchemy.sql import func
from database import Base
import enum


class UserRole(str, enum.Enum):
    Admin = "Admin"
    Standard = "Standard"


class UserStatus(str, enum.Enum):
    Active = "Active"
    Inactive = "Inactive"


class FileStatus(str, enum.Enum):
    Completed = "Completed"
    Processing = "Processing"
    Failed = "Failed"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(SAEnum(UserRole), default=UserRole.Standard, nullable=False)
    status = Column(SAEnum(UserStatus), default=UserStatus.Active, nullable=False)
    lastLogin = Column(DateTime(timezone=True), nullable=True)

    # DPDP Act: Granular consent preferences
    consent_preferences = Column(JSON, default={
        "analytics_consent": False,
        "security_scanning_consent": True,
        "pii_processing_consent": False,
        "third_party_sharing_consent": False,
    })


class FileRecord(Base):
    __tablename__ = "files"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False)
    uploadedBy = Column(String, nullable=False)
    uploadDate = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(SAEnum(FileStatus), default=FileStatus.Processing, nullable=False)
    piiDetected = Column(Integer, default=0)
    rawFilePath = Column(String, nullable=False)
    sanitizationMethod = Column(String, default="masking")
    # VirusTotal / CDR metadata
    fileHash = Column(String, nullable=True)  # SHA-256 hash
    vtScanResult = Column(String, nullable=True)  # "clean" | "skipped" | "malicious"
    cdrApplied = Column(String, nullable=True)  # "none" | "pdf_sanitized" | "docx_sanitized"


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    user = Column(String, nullable=False)
    action = Column(String, nullable=False)
    file = Column(String, nullable=True)
    details = Column(String, nullable=False)
    ipAddress = Column(String, nullable=False, default="0.0.0.0")


class ConsentAuditLog(Base):
    """DPDP Act: Tamper-proof consent audit trail with cryptographic hashes."""
    __tablename__ = "consent_audit_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    consent_snapshot = Column(JSON, nullable=False)
    consent_hash = Column(String, nullable=False)  # SHA-256(snapshot + user_id + timestamp)
