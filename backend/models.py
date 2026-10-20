
from datetime import datetime, timezone

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Interview(Base):
    """One independently stored interview session."""

    __tablename__ = "interviews"

    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    role: Mapped[str] = mapped_column(String(120), nullable=False)
    seniority: Mapped[str] = mapped_column(String(20), nullable=False)
    interview_type: Mapped[str] = mapped_column(String(20), nullable=False)

    company: Mapped[str | None] = mapped_column(
        String(160),
        nullable=True,
    )
    job_description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    total_questions: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="in_progress",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
        onupdate=utc_now,
    )

    final_feedback: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
    )

    turns: Mapped[list["InterviewTurn"]] = relationship(
        back_populates="interview",
        cascade="all, delete-orphan",
        order_by="InterviewTurn.question_number",
    )

class InterviewTurn(Base):
    """One question and the candidate's corresponding answer."""

    __tablename__ = "interview_turns"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    interview_id: Mapped[str] = mapped_column(
        ForeignKey("interviews.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    question_number: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    question: Mapped[str] = mapped_column(Text, nullable=False)
    answer: Mapped[str | None] = mapped_column(Text, nullable=True)
    feedback: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
    )

    interview: Mapped["Interview"] = relationship(
        back_populates="turns",
    )

class JobSearchRecord(Base):
    """A saved job search and its results."""

    __tablename__ = "job_searches"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    target_role: Mapped[str] = mapped_column(
        String(160),
        nullable=False,
    )

    location: Mapped[str | None] = mapped_column(
        String(160),
        nullable=True,
    )

    visitor_id: Mapped[str | None] = mapped_column(
        String(36),
        nullable=True,
    )

    request_data: Mapped[dict] = mapped_column(
        JSON,
        nullable=False,
    )

    result_data: Mapped[dict] = mapped_column(
        JSON,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
    )