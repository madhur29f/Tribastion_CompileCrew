import os
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from config import SUPABASE_DB_URL

logger = logging.getLogger("securedata")
Base = declarative_base()

# ---------------------------------------------------------------------------
# Try Supabase PostgreSQL first, fall back to local SQLite if it fails
# ---------------------------------------------------------------------------
_db_url = SUPABASE_DB_URL.strip() if SUPABASE_DB_URL else ""
_using_sqlite = False

if _db_url and _db_url.startswith("postgresql"):
    try:
        _engine = create_engine(_db_url, pool_pre_ping=True)
        # Test the connection immediately
        with _engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        engine = _engine
        logger.info("Connected to Supabase PostgreSQL successfully.")
    except Exception as e:
        logger.warning(f"Could not connect to Supabase PostgreSQL: {e}")
        logger.warning("Falling back to local SQLite database.")
        os.makedirs("data", exist_ok=True)
        engine = create_engine("sqlite:///data/securedata.db", connect_args={"check_same_thread": False})
        _using_sqlite = True
else:
    os.makedirs("data", exist_ok=True)
    engine = create_engine("sqlite:///data/securedata.db", connect_args={"check_same_thread": False})
    _using_sqlite = True

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """FastAPI dependency that yields a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
