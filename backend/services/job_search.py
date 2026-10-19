
import json
import logging
from urllib.parse import urlsplit

from openai import OpenAI
from pydantic import ValidationError

from backend.config import OPENAI_API_KEY, OPENAI_MODEL
from backend.schemas import JobSearchRequest, JobSearchResponse

logger = logging.getLogger(__name__)


def _normalize_url(url: str) -> str:
    """Normalize a URL for source verification."""
    parsed = urlsplit(url.strip())

    hostname = (parsed.hostname or "").lower()
    if hostname.startswith("www."):
        hostname = hostname[4:]

    return f"{hostname}{parsed.path.rstrip('/')}"


def _extract_verified_urls(response) -> set[str]:
    """Extract URLs returned by OpenAI's web-search tool."""
    verified_urls = set()

    try:
        response_data = response.model_dump()
    except AttributeError:
        return verified_urls

    for item in response_data.get("output", []):
        if item.get("type") != "web_search_call":
            continue

        action = item.get("action") or {}
        sources = action.get("sources") or item.get("sources") or []

        for source in sources:
            url = source.get("url") if isinstance(source, dict) else None
            if url:
                verified_urls.add(_normalize_url(url))

    return verified_urls


def _parse_json(raw_output: str) -> dict:
    """Parse JSON while tolerating Markdown code fences."""
    raw_output = raw_output.strip()

    if raw_output.startswith("```"):
        lines = raw_output.splitlines()

        if lines and lines[0].startswith("```"):
            lines = lines[1:]

        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]

        raw_output = "\n".join(lines).strip()

    return json.loads(raw_output)


def search_jobs(payload: JobSearchRequest) -> JobSearchResponse:
    """Search the web for real job postings matching the candidate's criteria."""

    if not OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY is missing.")

    client = OpenAI(api_key=OPENAI_API_KEY)

    search_criteria = {
        "target_role": payload.target_role,
        "location": payload.location,
        "remote_preference": payload.remote_preference,
        "seniority": payload.seniority,
        "employment_type": payload.employment_type,
        "skills": payload.skills,
        "keywords": payload.keywords,
        "max_results": payload.max_results,
    }

    prompt = f"""
You are a careful job-search assistant.

Search the live web for real, currently accessible job postings
matching these criteria:

{json.dumps(search_criteria, ensure_ascii=False, indent=2)}

OUTPUT LANGUAGE: {payload.language}

Requirements:
- Actually use web search to find job postings.
- Prefer direct employer career pages and reputable job boards.
- Return only postings you found on the web, not hypothetical vacancies.
- Do not invent companies, job titles, salaries, posting dates, or URLs.
- Use a direct URL to the actual vacancy whenever available.
- Use the exact URL of a page you actually consulted.
- Do not claim a position is still open unless the page supports that.
- Apply the location, seniority, employment type and remote filters.
- If a filter is unclear from the listing, state that uncertainty.
- Include up to {payload.max_results} relevant postings.
- If you cannot find suitable verified listings, return an empty jobs array.
- fit_score is an approximate 0-100 relevance estimate, not a hiring
  probability. Use null if the evidence is insufficient.
- remote_policy must be remote, hybrid, onsite, or unknown.
- source_name must identify the actual website or employer website.
- source_url must be the exact URL of the listing.
- Do not treat search-result snippets alone as confirmed job details.
- Return valid JSON only, with no Markdown or code fences.

The JSON object must contain:
- target_role: string
- search_summary: string
- jobs: an array of objects, each with title, company, location,
  remote_policy, employment_type, seniority, summary, requirements,
  skills, source_name, source_url, posted_date, salary_information,
  fit_score
- search_notes: an array of strings
- limitations: string

Each job must use:
- requirements: array of strings
- skills: array of strings
- posted_date: string or null
- salary_information: string or null
- fit_score: integer from 0 to 100 or null

Do not add extra top-level fields.
"""

    try:
        response = client.responses.create(
            model=OPENAI_MODEL,
            tools=[{"type": "web_search"}],
            tool_choice="required",
            include=["web_search_call.action.sources"],
            input=prompt,
            max_output_tokens=6500,
        )

        raw_output = (response.output_text or "").strip()

        if not raw_output:
            raise RuntimeError("The job search returned an empty response.")

        data = _parse_json(raw_output)

        # Keep only listings whose exact URLs are present in the
        # web-search source metadata.
        verified_urls = _extract_verified_urls(response)
        original_jobs = data.get("jobs", [])
        verified_jobs = []

        if verified_urls:
            for job in original_jobs:
                url = job.get("source_url", "")
                if url and _normalize_url(url) in verified_urls:
                    verified_jobs.append(job)

        data["jobs"] = verified_jobs[:payload.max_results]

        if not data["jobs"]:
            data.setdefault("search_notes", []).append(
                "No job posting with a source URL verifiable against "
                "the web-search metadata was returned. Try broader "
                "search criteria or rerun the search."
            )

            data["search_summary"] = (
                "The search was attempted, but no job postings could "
                "be returned with verifiable source URLs."
            )

        return JobSearchResponse.model_validate(data)

    except json.JSONDecodeError as exc:
        logger.exception("Job search returned invalid JSON")
        raise RuntimeError(
            "The job search service returned an invalid response."
        ) from exc

    except ValidationError as exc:
        logger.exception("Job search response failed schema validation")
        raise RuntimeError(
            "The job search response has an invalid structure."
        ) from exc
