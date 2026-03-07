import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
SUPABASE_DB_URL = os.getenv("SUPABASE_DB_URL", "")
SUPABASE_STORAGE_BUCKET = os.getenv("SUPABASE_STORAGE_BUCKET", "securedata-files")

SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-jwt-key-change-me")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

LOCAL_UPLOAD_DIR = os.getenv("LOCAL_UPLOAD_DIR", "uploads")

# VirusTotal API configuration (privacy-first hash check only)
VIRUSTOTAL_API_KEY = os.getenv("VIRUSTOTAL_API_KEY", "")

# Zero-Trust quarantine workflow directories
QUARANTINE_DIR = os.getenv("QUARANTINE_DIR", "uploads/quarantine")
CLEAN_DIR = os.getenv("CLEAN_DIR", "uploads/clean")
