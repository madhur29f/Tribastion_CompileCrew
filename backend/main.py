import os
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
from config import LOCAL_UPLOAD_DIR, QUARANTINE_DIR, CLEAN_DIR
from routers import auth_router, users_router, files_router, logs_router, stats_router

logger = logging.getLogger("securedata")

app = FastAPI(
    title="SecureData Backend",
    description="PII Detection & Sanitization REST API",
    version="1.0.0",
)

# CORS configuration — allow the Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all routers under /api prefix
app.include_router(auth_router.router, prefix="/api")
app.include_router(users_router.router, prefix="/api")
app.include_router(files_router.router, prefix="/api")
app.include_router(logs_router.router, prefix="/api")
app.include_router(stats_router.router, prefix="/api")


@app.on_event("startup")
def on_startup():
    """Create tables and storage directories on startup."""
    # Database tables
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created/verified successfully.")

        # Auto-migrate: add any missing columns to existing tables (SQLite safe)
        from sqlalchemy import inspect, text as sa_text
        import json as _json
        inspector = inspect(engine)
        for table_name, table_obj in Base.metadata.tables.items():
            if table_name in inspector.get_table_names():
                existing_cols = {c["name"] for c in inspector.get_columns(table_name)}
                for col in table_obj.columns:
                    if col.name not in existing_cols:
                        col_type = col.type.compile(engine.dialect)
                        default = " DEFAULT NULL" if col.nullable else ""
                        if col.default is not None:
                            dval = col.default.arg
                            if isinstance(dval, str):
                                default = f" DEFAULT '{dval}'"
                            elif isinstance(dval, (int, float)):
                                default = f" DEFAULT {dval}"
                            elif isinstance(dval, dict):
                                default = f" DEFAULT '{_json.dumps(dval)}'"
                            else:
                                default = " DEFAULT NULL"
                        stmt = f'ALTER TABLE "{table_name}" ADD COLUMN "{col.name}" {col_type}{default}'
                        with engine.begin() as conn:
                            conn.execute(sa_text(stmt))
                        logger.info(f"Migration: added column '{col.name}' to table '{table_name}'")

    except Exception as e:
        logger.error(f"Failed to create/migrate database tables: {e}")
        logger.error("Please check your SUPABASE_DB_URL in .env")

    # Storage directories (uploads, quarantine, clean)
    for dir_path in [LOCAL_UPLOAD_DIR, QUARANTINE_DIR, CLEAN_DIR]:
        os.makedirs(dir_path, exist_ok=True)
        logger.info(f"Storage directory ensured: {dir_path}")


@app.get("/")
def root():
    return {"message": "SecureData Backend is running"}


@app.get("/api/ping")
def ping():
    return {"message": "pong"}
