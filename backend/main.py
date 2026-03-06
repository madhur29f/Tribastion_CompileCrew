import os
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
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
    """Create tables on startup — fail gracefully if DB not configured."""
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created/verified successfully.")
    except Exception as e:
        logger.error(f"Failed to create database tables: {e}")
        logger.error("Please check your SUPABASE_DB_URL in .env")


@app.get("/")
def root():
    return {"message": "SecureData Backend is running"}


@app.get("/api/ping")
def ping():
    return {"message": "pong"}
