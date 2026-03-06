import os
import io
import json
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from auth import get_current_user, get_admin_user
from config import LOCAL_UPLOAD_DIR
from database import get_db
from models import FileRecord, FileStatus, User
from siem_logger import log_audit_event
from services.pii_engine import (
    count_pii,
    anonymize_text,
    anonymize_sql,
    anonymize_pdf,
    anonymize_docx,
    count_pii_in_sql,
    extract_pdf_text_with_positions,
)

router = APIRouter(prefix="/files", tags=["Files"])

# Ensure local upload directory exists
os.makedirs(LOCAL_UPLOAD_DIR, exist_ok=True)


class FileInfoOut(BaseModel):
    id: int
    name: str
    uploadDate: str
    uploadedBy: str
    status: str
    piiDetected: int

    class Config:
        from_attributes = True


class FileUploadResponse(BaseModel):
    file_id: int
    status: str
    message: str


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _get_file_ext(filename: str) -> str:
    return Path(filename).suffix.lower()


def _read_raw_file(file_record: FileRecord) -> bytes:
    """Read raw file bytes from local storage."""
    if not os.path.exists(file_record.rawFilePath):
        raise HTTPException(status_code=404, detail="Raw file not found on disk")
    with open(file_record.rawFilePath, "rb") as f:
        return f.read()


def _get_content_type(ext: str) -> str:
    mapping = {
        ".pdf": "application/pdf",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".csv": "text/csv",
        ".json": "application/json",
        ".sql": "text/plain",
        ".txt": "text/plain",
    }
    return mapping.get(ext, "application/octet-stream")


def _sanitize_file_content(raw_bytes: bytes, filename: str, method: str) -> tuple[bytes, str]:
    """
    Sanitize file content dynamically based on file extension.
    Returns (sanitized_bytes, content_type).
    """
    ext = _get_file_ext(filename)
    content_type = _get_content_type(ext)

    if ext == ".pdf":
        sanitized = anonymize_pdf(raw_bytes, method)
        return sanitized, "application/pdf"

    elif ext == ".docx":
        sanitized = anonymize_docx(raw_bytes, method)
        return sanitized, "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

    elif ext == ".sql":
        text = raw_bytes.decode("utf-8", errors="replace")
        sanitized_text = anonymize_sql(text, method)
        return sanitized_text.encode("utf-8"), "text/plain"

    elif ext == ".json":
        text = raw_bytes.decode("utf-8", errors="replace")
        sanitized_text = anonymize_text(text, method)
        return sanitized_text.encode("utf-8"), "application/json"

    else:
        # TXT, CSV, and everything else treated as plain text
        text = raw_bytes.decode("utf-8", errors="replace")
        sanitized_text = anonymize_text(text, method)
        return sanitized_text.encode("utf-8"), content_type


# ---------------------------------------------------------------------------
# POST /files/upload
# ---------------------------------------------------------------------------
@router.post("/upload", response_model=FileUploadResponse)
async def upload_file(
    request: Request,
    file: UploadFile = File(...),
    sanitization_method: str = Form("masking"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contents = await file.read()

    # Save raw file to local disk
    safe_filename = file.filename.replace(" ", "_")
    file_path = os.path.join(LOCAL_UPLOAD_DIR, f"{safe_filename}")
    with open(file_path, "wb") as f:
        f.write(contents)

    # Quick PII scan for count
    ext = _get_file_ext(safe_filename)
    pii_count = 0
    try:
        if ext == ".sql":
            text = contents.decode("utf-8", errors="replace")
            pii_count = count_pii_in_sql(text)
        elif ext in (".txt", ".csv", ".json"):
            text = contents.decode("utf-8", errors="replace")
            pii_count = count_pii(text)
        elif ext == ".pdf":
            spans = extract_pdf_text_with_positions(contents)
            all_text = " ".join(s["text"] for s in spans)
            pii_count = count_pii(all_text)
        elif ext == ".docx":
            from docx import Document
            doc = Document(io.BytesIO(contents))
            all_text = " ".join(p.text for p in doc.paragraphs)
            pii_count = count_pii(all_text)
    except Exception:
        pii_count = 0

    # Create DB record
    file_record = FileRecord(
        name=safe_filename,
        uploadedBy=current_user.username,
        status=FileStatus.Completed,
        piiDetected=pii_count,
        rawFilePath=file_path,
        sanitizationMethod=sanitization_method,
    )
    db.add(file_record)
    db.commit()
    db.refresh(file_record)

    # Audit log
    client_ip = request.client.host if request.client else "0.0.0.0"
    log_audit_event(
        db,
        user=current_user.username,
        action="File Upload",
        details=f"Uploaded {safe_filename}, {pii_count} PII instances detected",
        ip_address=client_ip,
        file=safe_filename,
        user_id=current_user.id,
    )

    if pii_count > 0:
        log_audit_event(
            db,
            user="System",
            action="PII Detection",
            details=f"Detected {pii_count} PII instances in {safe_filename}",
            ip_address="N/A",
            file=safe_filename,
        )

    return FileUploadResponse(
        file_id=file_record.id,
        status="completed",
        message=f"File uploaded and processed successfully. {pii_count} PII instances detected.",
    )


# ---------------------------------------------------------------------------
# GET /files
# ---------------------------------------------------------------------------
@router.get("", response_model=list[FileInfoOut])
def get_files(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    files = db.query(FileRecord).order_by(FileRecord.uploadDate.desc()).all()
    result = []
    for f in files:
        result.append(FileInfoOut(
            id=f.id,
            name=f.name,
            uploadDate=f.uploadDate.isoformat() if f.uploadDate else "",
            uploadedBy=f.uploadedBy,
            status=f.status.value,
            piiDetected=f.piiDetected,
        ))
    return result


# ---------------------------------------------------------------------------
# GET /files/{file_id}/raw  (Admin Only)
# ---------------------------------------------------------------------------
@router.get("/{file_id}/raw")
def get_raw_file(file_id: int, db: Session = Depends(get_db), admin: User = Depends(get_admin_user)):
    file_record = db.query(FileRecord).filter(FileRecord.id == file_id).first()
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")

    raw_bytes = _read_raw_file(file_record)
    ext = _get_file_ext(file_record.name)

    # For text-based formats, return as text/JSON
    if ext in (".txt", ".csv", ".json", ".sql"):
        text = raw_bytes.decode("utf-8", errors="replace")
        if ext == ".json":
            try:
                return JSONResponse(content=json.loads(text))
            except json.JSONDecodeError:
                return {"content": text}
        return {"content": text}

    # For binary formats, stream the file
    content_type = _get_content_type(ext)
    return StreamingResponse(
        io.BytesIO(raw_bytes),
        media_type=content_type,
        headers={"Content-Disposition": f"inline; filename={file_record.name}"},
    )


# ---------------------------------------------------------------------------
# GET /files/{file_id}/sanitized
# ---------------------------------------------------------------------------
@router.get("/{file_id}/sanitized")
def get_sanitized_file(
    file_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    file_record = db.query(FileRecord).filter(FileRecord.id == file_id).first()
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")

    raw_bytes = _read_raw_file(file_record)
    method = file_record.sanitizationMethod or "masking"
    ext = _get_file_ext(file_record.name)

    sanitized_bytes, content_type = _sanitize_file_content(raw_bytes, file_record.name, method)

    # For text-based formats, return as text/JSON
    if ext in (".txt", ".csv", ".json", ".sql"):
        text = sanitized_bytes.decode("utf-8", errors="replace")
        if ext == ".json":
            try:
                return JSONResponse(content=json.loads(text))
            except json.JSONDecodeError:
                return {"content": text}
        return {"content": text}

    # For binary formats, stream
    return StreamingResponse(
        io.BytesIO(sanitized_bytes),
        media_type=content_type,
        headers={"Content-Disposition": f"inline; filename=sanitized_{file_record.name}"},
    )


# ---------------------------------------------------------------------------
# GET /files/{file_id}/download  (Role-based streaming)
# ---------------------------------------------------------------------------
@router.get("/{file_id}/download")
def download_file(
    file_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    file_record = db.query(FileRecord).filter(FileRecord.id == file_id).first()
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")

    raw_bytes = _read_raw_file(file_record)
    ext = _get_file_ext(file_record.name)

    is_admin = current_user.role.value == "Admin"

    if is_admin:
        # Admin gets raw file
        output_bytes = raw_bytes
        download_name = file_record.name
    else:
        # Standard user gets dynamically sanitized file
        method = file_record.sanitizationMethod or "masking"
        output_bytes, _ = _sanitize_file_content(raw_bytes, file_record.name, method)
        download_name = f"sanitized_{file_record.name}"

    content_type = _get_content_type(ext)

    # Audit log the download
    client_ip = request.client.host if request.client else "0.0.0.0"
    log_audit_event(
        db,
        user=current_user.username,
        action="File Download",
        details=f"Downloaded {'raw' if is_admin else 'sanitized'} file: {file_record.name}",
        ip_address=client_ip,
        file=file_record.name,
        user_id=current_user.id,
    )

    return StreamingResponse(
        io.BytesIO(output_bytes),
        media_type=content_type,
        headers={"Content-Disposition": f"attachment; filename={download_name}"},
    )


# ---------------------------------------------------------------------------
# GET /files/{file_id}/search
# ---------------------------------------------------------------------------
@router.get("/{file_id}/search")
def search_file(
    file_id: int,
    q: str = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    file_record = db.query(FileRecord).filter(FileRecord.id == file_id).first()
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")

    raw_bytes = _read_raw_file(file_record)
    ext = _get_file_ext(file_record.name)

    if ext not in (".txt", ".csv", ".json", ".sql"):
        return {"results": [], "message": "Search only supported for text-based files"}

    text = raw_bytes.decode("utf-8", errors="replace")
    lines = text.split("\n")
    results = []
    for i, line in enumerate(lines):
        if q.lower() in line.lower():
            results.append({"line": i + 1, "content": line.strip()})

    return {"results": results, "total": len(results)}


# ---------------------------------------------------------------------------
# DELETE /files/{file_id}  (Admin Only)
# ---------------------------------------------------------------------------
@router.delete("/{file_id}")
def delete_file(file_id: int, request: Request, db: Session = Depends(get_db), admin: User = Depends(get_admin_user)):
    file_record = db.query(FileRecord).filter(FileRecord.id == file_id).first()
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")

    # Delete raw file from disk
    if os.path.exists(file_record.rawFilePath):
        os.remove(file_record.rawFilePath)

    filename = file_record.name
    db.delete(file_record)
    db.commit()

    client_ip = request.client.host if request.client else "0.0.0.0"
    log_audit_event(
        db,
        user=admin.username,
        action="File Upload",
        details=f"Deleted file: {filename}",
        ip_address=client_ip,
        file=filename,
        user_id=admin.id,
    )

    return {"detail": "File deleted"}
