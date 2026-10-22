
from typing import Literal

from pydantic import BaseModel, Field, ConfigDict


class InterviewStartRequest(BaseModel):
    """Input required to start a mock interview."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    role: str = Field(
        min_length=2,
        max_length=120,
        description="Target job role",
    )
    seniority: Literal["junior", "mid", "senior"] = "junior"
    interview_type: Literal[
        "behavioral", "technical", "mixed"
    ] = "mixed"
    company: str | None = Field(default=None, max_length=160)
    job_description: str | None = Field(default=None, max_length=10000)
    number_of_questions: int = Field(default=6, ge=3, le=10)


class InterviewStartResponse(BaseModel):
    """First question returned when an interview starts."""

    session_id: str
    status: Literal["in_progress"]
    question: str
    question_number: int = 1
    total_questions: int


class InterviewAnswerRequest(BaseModel):
    """Candidate's answer to the current interview question."""

    model_config = ConfigDict(
        extra="forbid",
        str_strip_whitespace=True,
    )

    answer: str = Field(
        min_length=2,
        max_length=8000,
        description="The candidate's answer",
    )


class QuestionFeedback(BaseModel):
    """Feedback on an individual interview answer."""

    question: str
    answer_summary: str
    strengths: list[str]
    improvements: list[str]
    suggested_answer: str | None = None


class InterviewFeedback(BaseModel):
    """Final evaluation of the interview."""

    overall_score: int = Field(ge=0, le=100)
    summary: str
    strengths: list[str]
    areas_for_improvement: list[str]
    question_feedback: list[QuestionFeedback]
    next_steps: list[str]


class InterviewTurnResponse(BaseModel):
    """Next question or final feedback after an answer."""

    session_id: str
    status: Literal["in_progress", "completed"]
    next_question: str | None = None
    question_number: int
    total_questions: int
    feedback: InterviewFeedback | None = None


class CVReviewRequest(BaseModel):
    """Input for reviewing a CV against a target role."""

    model_config = ConfigDict(
        extra="forbid",
        str_strip_whitespace=True,
    )

    target_role: str = Field(
        min_length=2,
        max_length=160,
        description="Role the candidate wants to apply for",
    )
    cv_text: str = Field(
        min_length=100,
        max_length=30000,
        description="Plain text extracted from or copied from the CV",
    )
    job_description: str | None = Field(
        default=None,
        max_length=12000,
        description="Optional job advertisement",
    )
    language: Literal["English", "Italian", "German", "Turkish"] = "English"


class CVReviewIssue(BaseModel):
    """One actionable issue found during the CV review."""

    category: Literal[
        "content",
        "clarity",
        "relevance",
        "grammar",
        "formatting",
        "evidence",
    ]
    priority: Literal["high", "medium", "low"]
    finding: str
    recommendation: str
    suggested_rewrite: str | None = None


class CVReviewStrength(BaseModel):
    """A CV strength supported by evidence from the document."""

    model_config = ConfigDict(extra="allow")

    finding: str
    evidence: str | None = None


class CVRelevantSkill(BaseModel):
    """A relevant skill identified in the CV."""

    model_config = ConfigDict(extra="allow")

    skill: str
    evidence: str | None = None


class CVRequirementToVerify(BaseModel):
    """A requirement that needs confirmation or further evidence."""

    model_config = ConfigDict(extra="allow")

    requirement: str
    reason: str | None = None
    evidence: str | None = None


class CVReviewResponse(BaseModel):
    """Structured CV review report."""

    target_role: str
    overall_assessment: str
    strengths: list[CVReviewStrength]
    issues: list[CVReviewIssue]
    relevant_skills: list[CVRelevantSkill]
    requirements_to_verify: list[CVRequirementToVerify]
    suggested_summary: str | None = None
    next_steps: list[str]
    limitations: str

class JobFitRequest(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        str_strip_whitespace=True
    )

    target_role: str = Field(min_length=2, max_length=160)
    cv_text: str = Field(min_length=100, max_length=30000)
    job_description: str = Field(min_length=100, max_length=12000)
    language: Literal["English", "Italian", "German", "Turkish"] = "English"


class JobFitFinding(BaseModel):
    requirement: str
    status: Literal[
        "strong_match",
        "partial_match",
        "gap",
        "unclear"
    ]
    evidence_from_cv: str | None = None
    analysis: str
    recommendation: str | None = None


class JobFitResponse(BaseModel):
    target_role: str
    fit_score: int = Field(ge=0, le=100)
    fit_level: Literal[
        "strong",
        "moderate",
        "partial",
        "low"
    ]
    overall_assessment: str
    matching_requirements: list[JobFitFinding]
    skill_gaps: list[JobFitFinding]
    transferable_skills: list[JobFitFinding]
    priority_actions: list[str]
    requirements_to_verify: list[str]
    limitations: str


class LearningRoadmapRequest(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        str_strip_whitespace=True
    )

    target_role: str = Field(min_length=2, max_length=160)
    current_skills: list[str] = Field(min_length=1, max_length=30)
    skill_gaps: list[str] = Field(min_length=1, max_length=20)
    weekly_hours: int = Field(default=5, ge=1, le=40)
    duration_weeks: int = Field(default=8, ge=2, le=24)
    learning_preferences: Literal[
        "mixed",
        "reading",
        "videos",
        "hands_on"
    ] = "mixed"
    language: Literal["English", "Italian", "German", "Turkish"] = "English"


class LearningActivity(BaseModel):
    title: str
    description: str
    activity_type: Literal[
        "course",
        "reading",
        "practice",
        "project",
        "networking",
        "assessment"
    ]
    estimated_hours: float = Field(gt=0, le=40)


class RoadmapWeek(BaseModel):
    week: int = Field(ge=1, le=24)
    focus: str
    learning_objectives: list[str]
    activities: list[LearningActivity]
    deliverable: str
    estimated_hours: float = Field(gt=0, le=40)


class RoadmapPriority(BaseModel):
    skill: str
    priority: Literal["high", "medium", "low"]
    rationale: str
    target_outcome: str


class LearningRoadmapResponse(BaseModel):
    target_role: str
    duration_weeks: int
    weekly_hours: int
    overall_goal: str
    priorities: list[RoadmapPriority]
    weeks: list[RoadmapWeek]
    progress_indicators: list[str]
    final_project: str
    limitations: str


# ============================================================
# JOB SEARCH & DISCOVERY
# ============================================================

class JobSearchRequest(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        str_strip_whitespace=True,
    )

    target_role: str = Field(min_length=2, max_length=160)
    location: str | None = Field(default=None, max_length=160)
    remote_preference: Literal[
        "any",
        "remote",
        "hybrid",
        "onsite",
    ] = "any"
    seniority: Literal[
        "any",
        "intern",
        "junior",
        "mid",
        "senior",
        "lead",
    ] = "any"
    employment_type: Literal[
        "any",
        "full_time",
        "part_time",
        "contract",
        "internship",
    ] = "any"
    skills: list[str] = Field(default_factory=list, max_length=30)
    keywords: list[str] = Field(default_factory=list, max_length=20)
    max_results: int = Field(default=10, ge=1, le=25)
    language: Literal["English", "Italian", "German", "Turkish"] = "English"


class JobPosting(BaseModel):
    model_config = ConfigDict(extra="allow")

    title: str
    company: str
    location: str | None = None
    remote_policy: Literal[
        "remote",
        "hybrid",
        "onsite",
        "unknown",
    ] = "unknown"
    employment_type: str | None = None
    seniority: str | None = None
    summary: str
    requirements: list[str] = Field(default_factory=list)
    skills: list[str] = Field(default_factory=list)
    source_name: str
    source_url: str
    posted_date: str | None = None
    salary_information: str | None = None
    fit_score: int | None = Field(default=None, ge=0, le=100)


class JobSearchResponse(BaseModel):
    target_role: str
    search_summary: str
    jobs: list[JobPosting]
    search_notes: list[str] = Field(default_factory=list)
    limitations: str

# ============================================================
# COMPANY-SPECIFIC INTERVIEW PREPARATION
# ============================================================

class CompanyInterviewPrepRequest(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        str_strip_whitespace=True,
    )

    company_name: str = Field(min_length=2, max_length=160)
    target_role: str = Field(min_length=2, max_length=160)
    job_description: str | None = Field(default=None, max_length=12000)
    company_context: str | None = Field(default=None, max_length=12000)
    cv_text: str | None = Field(default=None, max_length=30000)
    interview_type: Literal[
        "behavioral",
        "technical",
        "mixed",
    ] = "mixed"
    seniority: Literal[
        "junior",
        "mid",
        "senior",
    ] = "junior"
    number_of_questions: int = Field(default=8, ge=3, le=15)
    language: Literal["English", "Italian", "German", "Turkish"] = "English"


class CompanyResearchSource(BaseModel):
    model_config = ConfigDict(extra="allow")

    title: str
    url: str
    relevance: str


class CompanyInterviewQuestion(BaseModel):
    model_config = ConfigDict(extra="allow")

    question: str
    category: Literal[
        "behavioral",
        "technical",
        "role_specific",
        "company_specific",
        "situational",
    ]
    rationale: str
    what_interviewer_assesses: list[str] = Field(default_factory=list)
    suggested_answer_framework: str
    preparation_tips: list[str] = Field(default_factory=list)
    difficulty: Literal["easy", "medium", "hard"] = "medium"


class CompanyInterviewPrepResponse(BaseModel):
    company_name: str
    target_role: str
    company_overview: str
    role_alignment: list[str] = Field(default_factory=list)
    likely_questions: list[CompanyInterviewQuestion]
    questions_to_ask_interviewer: list[str] = Field(default_factory=list)
    preparation_plan: list[str] = Field(default_factory=list)
    sources: list[CompanyResearchSource] = Field(default_factory=list)
    limitations: str


# ============================================================
# LLM-AS-A-JUDGE
# ============================================================

class LLMJudgeRequest(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        str_strip_whitespace=True,
    )

    artifact_type: Literal[
        "mock_interview",
        "cv_review",
        "job_fit_analysis",
        "learning_roadmap",
        "job_search",
        "company_interview_prep",
    ]
    task_description: str = Field(min_length=10, max_length=5000)
    input_context: str = Field(min_length=2, max_length=30000)
    model_output: str = Field(min_length=2, max_length=50000)
    expected_format: str | None = Field(default=None, max_length=5000)
    evaluation_criteria: list[str] = Field(
        default_factory=list,
        max_length=20,
    )
    language: Literal["English", "Italian", "German", "Turkish"] = "English"


class JudgeDimensionScore(BaseModel):
    model_config = ConfigDict(extra="allow")

    dimension: Literal[
        "accuracy",
        "relevance",
        "completeness",
        "grounding",
        "clarity",
        "actionability",
        "safety",
        "format_compliance",
    ]
    score: int = Field(ge=0, le=5)
    rationale: str
    evidence: str | None = None


class JudgeIssue(BaseModel):
    model_config = ConfigDict(extra="allow")

    category: str
    severity: Literal["high", "medium", "low"]
    description: str
    evidence: str | None = None
    recommendation: str


class LLMJudgeResponse(BaseModel):
    artifact_type: str
    overall_score: int = Field(ge=0, le=100)
    verdict: Literal["pass", "review", "fail"]
    summary: str
    dimension_scores: list[JudgeDimensionScore]
    strengths: list[str] = Field(default_factory=list)
    issues: list[JudgeIssue] = Field(default_factory=list)
    revision_instructions: list[str] = Field(default_factory=list)
    limitations: str

class SalaryEstimatorRequest(BaseModel):
    """Input for estimating annual gross salary in Germany."""

    model_config = ConfigDict(
        extra="forbid",
        str_strip_whitespace=True,
    )

    target_role: str = Field(min_length=2, max_length=160)
    location: str = Field(min_length=2, max_length=160)
    seniority: Literal["junior", "mid", "senior", "lead"] = "junior"
    cv_text: str | None = Field(default=None, max_length=30000)
    language: Literal["English", "Italian", "German", "Turkish"] = "English"


class SalaryEstimatorResponse(BaseModel):
    """Estimated annual gross salary and supporting evidence."""

    target_role: str
    location: str
    currency: str = "EUR"
    salary_min_annual: int = Field(ge=0)
    salary_max_annual: int = Field(ge=0)
    summary: str
    factors: list[str]
    sources: list[dict[str, str]]
    confidence: Literal["low", "medium", "high"]
    limitations: str