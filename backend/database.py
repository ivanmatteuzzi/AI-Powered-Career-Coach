
import os
from pathlib import Path
from collections.abc import Generator

from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker


# Project root: the parent folder of "backend"
PROJECT_ROOT = Path(__file__).resolve().parent.parent

# Local development uses SQLite.
# Production can use PostgreSQL through DATABASE_URL.
DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    # Normalize common PostgreSQL URLs to use the psycopg driver.
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace(
            "postgres://",
            "postgresql+psycopg://",
            1,
        )
    elif DATABASE_URL.startswith("postgresql://"):
        DATABASE_URL = DATABASE_URL.replace(
            "postgresql://",
            "postgresql+psycopg://",
            1,
        )
else:
    database_path = PROJECT_ROOT / "career_pilot.db"
    DATABASE_URL = f"sqlite:///{database_path.as_posix()}"


# SQLite needs a setting for use with FastAPI.
connect_args = (
    {"check_same_thread": False}
    if DATABASE_URL.startswith("sqlite")
    else {}
)

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Base class for all database models."""


def get_db() -> Generator[Session, None, None]:
    """Provide a database session and close it after use."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create tables and apply small, backward-compatible migrations."""
    from backend import models  # Register the models with SQLAlchemy

    Base.metadata.create_all(bind=engine)

    # Add visitor_id to existing job-search tables, if needed.
    inspector = inspect(engine)

    if "job_searches" in inspector.get_table_names():
        columns = {
            column["name"]
            for column in inspector.get_columns("job_searches")
        }

        if "visitor_id" not in columns:
            with engine.begin() as connection:
                connection.exec_driver_sql(
                    "ALTER TABLE job_searches "
                    "ADD COLUMN visitor_id VARCHAR(36)"
                )
