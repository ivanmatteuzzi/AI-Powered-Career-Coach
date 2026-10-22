
import json
import logging
from urllib.parse import urlsplit

from openai import OpenAI
from pydantic import ValidationError

from backend.config import OPENAI_API_KEY, OPENAI_MODEL
from backend.schemas import SalaryEstimatorRequest, SalaryEstimatorResponse

logger = logging.getLogger(__name__)


def _normalize_url(url: str) -> str:
    """Normalize a URL to compare it with web-search source metadata."""
    parsed = urlsplit(url.strip())
    hostname = (parsed.hostname or "").lower()

    if hostname.startswith("www."):
        hostname = hostname[4:]

    return f"{hostname}{parsed.path.rstrip('/')}"


def _extract_verified_urls(response) -> set[str]:
    """Extract URLs actually returned by the web-search tool."""
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
    """Parse JSON, tolerating Markdown code fences."""
    raw_output = raw_output.strip()

    if raw_output.startswith("```"):
        lines = raw_output.splitlines()

        if lines and lines[0].startswith("```"):
            lines = lines[1:]

        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]

        raw_output = "\n".join(lines).strip()

    return json.loads(raw_output)


def estimate_salary(
    payload: SalaryEstimatorRequest,
) -> SalaryEstimatorResponse:
    """Estimate annual gross salary using live web research."""

    if not OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY is missing.")

    client = OpenAI(api_key=OPENAI_API_KEY)

    criteria = {
        "target_role": payload.target_role,
        "location": payload.location,
        "seniority": payload.seniority,
        "cv_text": payload.cv_text,
    }

    prompt = f"""
You are a careful salary research assistant.

Research current salary information on the live web for jobs in Germany.

CANDIDATE CRITERIA:
{json.dumps(criteria, ensure_ascii=False, indent=2)}

OUTPUT LANGUAGE: {payload.language}

Requirements:
- Use web search to research current salary data.
- Prefer reputable salary surveys, official statistics, collective
  agreements, and established salary platforms.
- Prioritize data relevant to Germany, the specified location, role,
  and seniority.
- Return annual gross salary in euros (EUR), for a full-time role.
- salary_min_annual and salary_max_annual must be integer amounts.
- Explain that the result is an estimate, not a guaranteed offer.
- Consider CV skills only as supporting context, not proof of salary.
- Never invent statistics, source names, or URLs.
- Each source URL must be an exact URL from a page actually consulted.
- Include source title, URL, and a short explanation of its relevance.
- Clearly state when sources disagree, are outdated, or are not
  specific to the requested location or seniority.
- If evidence is weak, provide a cautious estimate and low confidence.
- Do not claim that a source supports a figure unless it does.
- Return valid JSON only, without Markdown or code fences.

Return exactly these fields:
- target_role: string
- location: string
- currency: "EUR"
- salary_min_annual: integer
- salary_max_annual: integer
- summary: string
- factors: array of strings
- sources: array of objects with title, url, description (all strings)
- confidence: "low", "medium", or "high"
- limitations: string

Do not add other top-level fields.
"""

    try:
        response = client.responses.create(
            model=OPENAI_MODEL,
            tools=[{"type": "web_search"}],
            tool_choice="required",
            include=["web_search_call.action.sources"],
            input=prompt,
            max_output_tokens=3500,
        )

        raw_output = (response.output_text or "").strip()

        if not raw_output:
            raise RuntimeError("The salary research returned an empty response.")

        data = _parse_json(raw_output)

        # Keep only sources whose URLs match web-search metadata.
        verified_urls = _extract_verified_urls(response)
        verified_sources = []

        for source in data.get("sources", []):
            url = source.get("url", "")

            if url and _normalize_url(url) in verified_urls:
                verified_sources.append(source)

        data["sources"] = verified_sources

        if not verified_sources:
            data["confidence"] = "low"
            data["limitations"] = (
                str(data.get("limitations", "")).strip()
                + " No source URL could be verified against the web-search "
                "metadata, so the figures should be treated with particular "
                "caution and independently checked."
            ).strip()

        result = SalaryEstimatorResponse.model_validate(data)

        if result.salary_max_annual < result.salary_min_annual:
            raise RuntimeError("The returned salary range is invalid.")

        return result

    except json.JSONDecodeError as exc:
        logger.exception("Salary estimator returned invalid JSON")
        raise RuntimeError(
            "The salary research returned an invalid response."
        ) from exc

    except ValidationError as exc:
        logger.exception("Salary estimator response failed schema validation")
        raise RuntimeError(
            "The salary research response has an invalid structure."
        ) from exc