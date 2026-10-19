import json

from openai import OpenAI

from backend.config import OPENAI_API_KEY, OPENAI_MODEL
from backend.models import Interview, InterviewTurn
from backend.schemas import InterviewFeedback


def get_openai_client() -> OpenAI:
    """Create an OpenAI client using the configured API key."""
    if not OPENAI_API_KEY:
        raise RuntimeError(
            "OPENAI_API_KEY is missing from the application configuration."
        )

    return OpenAI(api_key=OPENAI_API_KEY)


def call_model(prompt: str, max_output_tokens: int = 500) -> str:
    """Send a prompt to OpenAI and return the generated text."""
    client = get_openai_client()

    response = client.responses.create(
        model=OPENAI_MODEL,
        input=prompt,
        max_output_tokens=max_output_tokens,
    )

    result = (response.output_text or "").strip()

    if not result:
        raise RuntimeError("The AI model returned an empty response.")

    return result


def generate_first_question(interview: Interview) -> str:
    """Generate the first interview question for the selected role."""
    prompt = f"""
You are a professional job interviewer.

Prepare the first question of a realistic job interview.

Target role: {interview.role}
Seniority: {interview.seniority}
Interview type: {interview.interview_type}
Company: {interview.company or "Not specified"}

Job description:
{(interview.job_description or "Not provided")[:6000]}

Requirements:
- Ask exactly ONE interview question.
- Tailor it to the target role and seniority.
- Keep it clear, natural and specific.
- Do not include an answer, introduction, evaluation or multiple questions.
- Return only the question.
"""

    return call_model(prompt, max_output_tokens=180)


def generate_next_question(
    interview: Interview,
    turns: list[InterviewTurn],
) -> str:
    """Generate the next question using the previous answers as context."""
    conversation = "\n\n".join(
        f"Question {turn.question_number}: {turn.question}\n"
        f"Candidate answer: {turn.answer or '[No answer]'}"
        for turn in turns
    )

    next_number = len(turns) + 1

    prompt = f"""
You are a professional interviewer conducting an adaptive job interview.

Target role: {interview.role}
Seniority: {interview.seniority}
Interview type: {interview.interview_type}
Company: {interview.company or "Not specified"}
Question being generated: {next_number} of {interview.total_questions}

Job description:
{(interview.job_description or "Not provided")[:6000]}

Interview so far:
{conversation}

Requirements:
- Ask exactly ONE new question.
- Use the candidate's previous answers to decide what to ask next.
- If an answer is vague or incomplete, ask a relevant follow-up.
- Otherwise, explore a different competency relevant to the role.
- Avoid repeating questions already asked.
- Do not evaluate the candidate yet.
- Return only the next question.
"""

    return call_model(prompt, max_output_tokens=220)


def generate_final_feedback(
    interview: Interview,
    turns: list[InterviewTurn],
) -> InterviewFeedback:
    """Evaluate the completed interview and return structured feedback."""
    conversation = "\n\n".join(
        f"Question {turn.question_number}: {turn.question}\n"
        f"Candidate answer: {turn.answer or '[No answer]'}"
        for turn in turns
    )

    prompt = f"""
You are an evidence-based interview coach.

Evaluate the candidate's answers for this role:
{interview.role}

Seniority: {interview.seniority}
Interview type: {interview.interview_type}
Company: {interview.company or "Not specified"}

Job description:
{(interview.job_description or "Not provided")[:6000]}

Interview transcript:
{conversation}

Return ONLY one valid JSON object with these keys:
- overall_score: integer from 0 to 100
- summary: concise overall assessment
- strengths: array of strings
- areas_for_improvement: array of strings
- question_feedback: array of objects, one per interview question, each containing:
  - question: original question
  - answer_summary: concise summary of the candidate's answer
  - strengths: array of strings
  - improvements: array of strings
  - suggested_answer: a better example answer, or null
- next_steps: array of actionable recommendations

Evaluation rules:
- Score only the evidence in the supplied answers.
- Consider relevance to the role, clarity, specificity and reasoning.
- Do not invent experience, qualifications or achievements.
- Explain weaknesses constructively.
- Suggested answers must not add unsupported personal facts.
- Do not use Markdown fences around the JSON.
"""

    raw = call_model(prompt, max_output_tokens=1800)

    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise RuntimeError(
            "The AI evaluator did not return valid JSON. Please retry."
        ) from exc

    # Validate the model output against our existing Pydantic schema.
    return InterviewFeedback.model_validate(data)