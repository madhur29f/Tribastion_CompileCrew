"""Quick migration: add piiRiskScore and dataClassificationTier columns to files table."""
from database import engine
from sqlalchemy import text

with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE files ADD COLUMN piiRiskScore INTEGER DEFAULT 0"))
        print("Added piiRiskScore column")
    except Exception as e:
        print(f"piiRiskScore column may already exist: {e}")

    try:
        conn.execute(text("ALTER TABLE files ADD COLUMN dataClassificationTier VARCHAR DEFAULT 'Public'"))
        print("Added dataClassificationTier column")
    except Exception as e:
        print(f"dataClassificationTier column may already exist: {e}")

    conn.commit()
    print("Migration complete!")
