import os
import logging
from contextlib import asynccontextmanager
from uuid import uuid4

from fastapi import Depends, FastAPI, Header, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import JobSearchRecord
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import SQLAlchemyError
from backend.schemas import SalaryEstimatorRequest, SalaryEstimatorResponse
from backend.services.salary_estimator import estimate_salary

from typing import Any
from uuid import UUID

from backend.schemas import (
    JobSearchRequest,
    JobSearchResponse,
    CompanyInterviewPrepRequest,
    CompanyInterviewPrepResponse,
    LLMJudgeRequest,
    LLMJudgeResponse,
)

from backend.services.cv_review import review_cv
from backend.schemas import LearningRoadmapRequest, LearningRoadmapResponse
from backend.services.learning_roadmap import generate_learning_roadmap
from backend.schemas import CVReviewRequest, CVReviewResponse
from backend.schemas import JobFitRequest, JobFitResponse
from backend.services.job_fit import analyze_job_fit
from backend.database import get_db, init_db
from backend.models import Interview, InterviewTurn
from backend.schemas import (
    InterviewStartRequest,
    InterviewStartResponse,
    InterviewAnswerRequest,
    InterviewTurnResponse,
)
from backend.services.interview import (
    generate_first_question,
    generate_next_question,
    generate_final_feedback,
)

from backend.services.cv_review import review_cv

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database tables when the application starts."""
    init_db()
    yield


app = FastAPI(
    title="CareerPilot API",
    description="AI-powered career coaching application",
    version="0.1.0",
    lifespan=lifespan,
)

@app.get("/")
def root():
    return {
        "message": "AI-Powered Career Coach API is running",
        "status": "ok",
        "docs": "/docs",
        "health": "/health"
    }


# CORS configuration for local frontend development.
raw_origins = os.getenv("FRONTEND_ORIGINS") or (
    "http://localhost:5500,"
    "http://127.0.0.1:5500"
)

allowed_origins = [
    origin.strip().rstrip("/")
    for origin in raw_origins.split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=[
    "Content-Type",
    "Authorization",
    "X-Visitor-ID",
],
)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.post(
    "/api/v1/interviews",
    response_model=InterviewStartResponse,
    status_code=201,
)
def start_interview(
    payload: InterviewStartRequest,
    db: Session = Depends(get_db),
):
    """Create a new interview and generate its first AI question."""

    interview = Interview(
        id=f"int_{uuid4().hex}",
        role=payload.role,
        seniority=payload.seniority,
        interview_type=payload.interview_type,
        company=payload.company,
        job_description=payload.job_description,
        total_questions=payload.number_of_questions,
        status="in_progress",
    )

    try:
        first_question = generate_first_question(interview)

        interview.turns.append(
            InterviewTurn(
                question_number=1,
                question=first_question,
            )
        )

        db.add(interview)
        db.commit()

        return InterviewStartResponse(
            session_id=interview.id,
            status="in_progress",
            question=first_question,
            question_number=1,
            total_questions=interview.total_questions,
        )

    except SQLAlchemyError as exc:
        db.rollback()
        logger.exception("Could not save the new interview")
        raise HTTPException(
            status_code=500,
            detail="Could not save the interview session.",
        ) from exc

    except Exception as exc:
        db.rollback()
        logger.exception("Could not generate the first interview question")
        raise HTTPException(
            status_code=502,
            detail="The AI service could not generate the first question.",
        ) from exc

@app.post(
    "/api/v1/interviews/{session_id}/answers",
    response_model=InterviewTurnResponse,
)
def submit_answer(
    session_id: str,
    payload: InterviewAnswerRequest,
    db: Session = Depends(get_db),
):
    """Save an answer and generate the next question or final feedback."""

    interview = db.get(Interview, session_id)

    if interview is None:
        raise HTTPException(
            status_code=404,
            detail="Interview session not found.",
        )

    if interview.status != "in_progress":
        raise HTTPException(
            status_code=409,
            detail="This interview is already completed.",
        )

    turns = list(interview.turns)

    if not turns:
        raise HTTPException(
            status_code=409,
            detail="This interview has no questions yet.",
        )

    current_turn = turns[-1]

    if current_turn.answer is not None:
        raise HTTPException(
            status_code=409,
            detail="This question has already been answered.",
        )

    current_turn.answer = payload.answer

    try:
        # Is this the final question?
        if current_turn.question_number >= interview.total_questions:
            feedback = generate_final_feedback(interview, turns)

            interview.final_feedback = feedback.model_dump(mode="json")
            interview.status = "completed"

            db.commit()

            return InterviewTurnResponse(
                session_id=interview.id,
                status="completed",
                next_question=None,
                question_number=current_turn.question_number,
                total_questions=interview.total_questions,
                feedback=feedback,
            )

        # Otherwise, generate and store the next question.
        next_question = generate_next_question(interview, turns)

        next_turn = InterviewTurn(
            question_number=current_turn.question_number + 1,
            question=next_question,
        )

        interview.turns.append(next_turn)
        db.commit()

        return InterviewTurnResponse(
            session_id=interview.id,
            status="in_progress",
            next_question=next_question,
            question_number=next_turn.question_number,
            total_questions=interview.total_questions,
        )

    except SQLAlchemyError as exc:
        db.rollback()
        logger.exception("Could not save the interview answer")
        raise HTTPException(
            status_code=500,
            detail="Could not save the interview answer.",
        ) from exc

    except Exception as exc:
        db.rollback()
        logger.exception("Could not generate the next interview response")
        raise HTTPException(
            status_code=502,
            detail="The AI service could not process this answer. Please retry.",
        ) from exc

@app.post(
    "/api/v1/cv/review",
    response_model=CVReviewResponse,
)
def cv_review_endpoint(
    payload: CVReviewRequest,
) -> CVReviewResponse:
    """Analyze a CV for a specific target role."""

    try:
        return review_cv(payload)

    except Exception as exc:
        logger.exception("CV review failed")
        raise HTTPException(
            status_code=502,
            detail="The CV review service could not complete the request. Please retry.",
        ) from exc

@app.post("/api/v1/job-fit/analyze", response_model=JobFitResponse)
def job_fit_endpoint(payload: JobFitRequest) -> JobFitResponse:
    try:
        return analyze_job_fit(payload)
    except Exception as exc:
        logger.exception("Job-fit analysis failed")
        raise HTTPException(
            status_code=502,
            detail="The job-fit analysis service could not complete the request. Please retry."
        ) from exc

@app.post(
    "/api/v1/learning-roadmap/generate",
    response_model=LearningRoadmapResponse,
)
def learning_roadmap_endpoint(
    payload: LearningRoadmapRequest,
) -> LearningRoadmapResponse:
    try:
        return generate_learning_roadmap(payload)
    except Exception as exc:
        logger.exception("Learning roadmap generation failed")
        raise HTTPException(
            status_code=502,
            detail=(
                "The learning roadmap service could not complete "
                "the request. Please retry."
            ),
        ) from exc

# ============================================================
# SALARY ESTIMATOR
# ============================================================

@app.post(
    "/api/v1/salary-estimator/estimate",
    response_model=SalaryEstimatorResponse,
)
def salary_estimator_endpoint(
    payload: SalaryEstimatorRequest,
) -> SalaryEstimatorResponse:
    """Estimate annual gross salary using current web research."""
    try:
        return estimate_salary(payload)
    except Exception as exc:
        logger.exception("Salary estimation failed")
        raise HTTPException(
            status_code=502,
            detail=(
                "The salary estimate could not be completed. "
                "Please retry."
            ),
        ) from exc

# ============================================================
# JOB SEARCH & DISCOVERY
# ============================================================

@app.post(
    "/api/v1/jobs/search",
    response_model=JobSearchResponse,
)
def job_search_endpoint(
    payload: JobSearchRequest,
    db: Session = Depends(get_db),
    visitor_id: UUID | None = Header(
        default=None,
        alias="X-Visitor-ID",
    ),
) -> JobSearchResponse:
    try:
        from backend.services.job_search import search_jobs

        # 1. Run the job search
        result = search_jobs(payload)

        # 2. Create a database record
        record = JobSearchRecord(
            target_role=payload.target_role,
            location=payload.location,
            visitor_id=str(visitor_id) if visitor_id is not None else None,
            request_data=payload.model_dump(mode="json"),
            result_data=result.model_dump(mode="json"),
        )

        # 3. Save the search and its results
        db.add(record)
        db.commit()

        # 4. Return the results to the caller
        return result

    except Exception as exc:
        db.rollback()
        logger.exception("Job search failed or could not be saved")
        raise HTTPException(
            status_code=502,
            detail=(
                "The job search could not be completed or saved. "
                "Please retry."
            ),
        ) from exc

@app.get("/api/v1/jobs/history")
def job_search_history_endpoint(
    visitor_id: UUID = Header(..., alias="X-Visitor-ID"),
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    try:
        records = (
            db.query(JobSearchRecord)
            .filter(JobSearchRecord.visitor_id == str(visitor_id))
            .order_by(JobSearchRecord.created_at.desc())
            .limit(10)
            .all()
        )

        return [
            {
                "id": record.id,
                "target_role": record.target_role,
                "location": record.location,
                "created_at": record.created_at,
                "request_data": record.request_data,
                "result_data": record.result_data,
            }
            for record in records
        ]

    except SQLAlchemyError as exc:
        logger.exception("Failed to load job search history")
        raise HTTPException(
            status_code=500,
            detail="The search history could not be loaded.",
        ) from exc


# ============================================================
# COMPANY-SPECIFIC INTERVIEW PREPARATION
# ============================================================

@app.post(
    "/api/v1/company-interview/prepare",
    response_model=CompanyInterviewPrepResponse,
)
def company_interview_prep_endpoint(
    payload: CompanyInterviewPrepRequest,
) -> CompanyInterviewPrepResponse:
    try:
        from backend.services.company_interview_prep import (
            prepare_company_interview,
        )

        return prepare_company_interview(payload)

    except Exception as exc:
        logger.exception("Company interview preparation failed")
        raise HTTPException(
            status_code=502,
            detail=(
                "The company interview preparation service "
                "could not complete the request. Please retry."
            ),
        ) from exc


# ============================================================
# LLM-AS-A-JUDGE
# ============================================================

@app.post(
    "/api/v1/llm-judge/evaluate",
    response_model=LLMJudgeResponse,
)
def llm_judge_endpoint(
    payload: LLMJudgeRequest,
) -> LLMJudgeResponse:
    try:
        from backend.services.llm_judge import evaluate_output

        return evaluate_output(payload)

    except Exception as exc:
        logger.exception("LLM-as-a-Judge evaluation failed")
        raise HTTPException(
            status_code=502,
            detail=(
                "The evaluation service could not complete "
                "the request. Please retry."
            ),
        ) from exc
