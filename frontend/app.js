
"use strict";

/* =========================================================
   AI CAREER COACH — FRONTEND CONTROLLER
   Frontend: Vercel
   Backend: Render
   ========================================================= */

const API_BASE = "https://ai-powered-career-coach-n2kh.onrender.com";

/* =========================================================
   MODULE DEFINITIONS
   Field names match backend/schemas.py.
   ========================================================= */

const MODULES = {
  "cv-review": {
    title: "CV Review",
    eyebrow: "CV ANALYSIS",
    description: "Identify your strengths, weaknesses and opportunities to improve your CV.",
    endpoint: "/api/v1/cv/review",
    button: "Review my CV",
    fields: [
      { name: "target_role", label: "Target role", type: "text", required: true, placeholder: "e.g. Junior Python Backend Developer" },
      { name: "cv_text", label: "CV text", type: "textarea", required: true, rows: 9, help: "Paste the text of your CV. Avoid including unnecessary sensitive information." },
      { name: "job_description", label: "Job description (optional)", type: "textarea", required: false, rows: 5 },
      { name: "language", label: "Output language", type: "select", value: "English", options: languageOptions() }
    ]
  },

  "job-fit": {
    title: "Job Fit Analysis",
    eyebrow: "SKILLS AND REQUIREMENTS",
    description: "Compare your experience with a specific job description and identify skill gaps.",
    endpoint: "/api/v1/job-fit/analyze",
    button: "Analyse job fit",
    fields: [
      { name: "target_role", label: "Target role", type: "text", required: true, placeholder: "e.g. Junior Python Backend Developer" },
      { name: "cv_text", label: "CV text", type: "textarea", required: true, rows: 8 },
      { name: "job_description", label: "Job description", type: "textarea", required: true, rows: 8 },
      { name: "language", label: "Output language", type: "select", value: "English", options: languageOptions() }
    ]
  },

  "job-search": {
    title: "Job Search",
    eyebrow: "DISCOVER OPPORTUNITIES",
    description: "Search for relevant job postings and compare the available opportunities.",
    endpoint: "/api/v1/jobs/search",
    button: "Search for jobs",
    fields: [
      { name: "target_role", label: "Target role", type: "text", required: true, placeholder: "e.g. Junior Python Developer" },
      { name: "location", label: "Location", type: "text", placeholder: "e.g. Frankfurt am Main, Germany" },
      { name: "remote_preference", label: "Work arrangement", type: "select", value: "any", options: [
        ["any", "Any arrangement"],
        ["remote", "Remote"],
        ["hybrid", "Hybrid"],
        ["onsite", "On-site"]
      ]},
      { name: "seniority", label: "Seniority", type: "select", value: "any", options: [
        ["any", "Any level"],
        ["intern", "Internship / Student"],
        ["junior", "Junior"],
        ["mid", "Mid-level"],
        ["senior", "Senior"],
        ["lead", "Lead"]
      ]},
      { name: "employment_type", label: "Employment type", type: "select", value: "any", options: [
        ["any", "Any type"],
        ["full_time", "Full-time"],
        ["part_time", "Part-time"],
        ["contract", "Contract"],
        ["internship", "Internship"]
      ]},
      { name: "skills", label: "Skills", type: "textarea", rows: 3, help: "Separate skills with commas or new lines.", placeholder: "Python, FastAPI, SQL, Git" },
      { name: "keywords", label: "Search keywords", type: "textarea", rows: 2, help: "Separate keywords with commas or new lines.", placeholder: "Entry level, backend development" },
      { name: "max_results", label: "Maximum results", type: "number", value: "5", min: 1, max: 25, required: true },
      { name: "language", label: "Output language", type: "select", value: "English", options: languageOptions() }
    ]
  },

  "learning-roadmap": {
    title: "Learning Roadmap",
    eyebrow: "YOUR LEARNING JOURNEY",
    description: "Turn your skill gaps into a realistic plan with weekly activities and measurable goals.",
    endpoint: "/api/v1/learning-roadmap/generate",
    button: "Generate roadmap",
    fields: [
      { name: "target_role", label: "Target role", type: "text", required: true, placeholder: "e.g. Junior Python Backend Developer" },
      { name: "current_skills", label: "Current skills", type: "textarea", required: true, rows: 4, help: "Separate skills with commas or new lines.", placeholder: "Python, FastAPI, Git" },
      { name: "skill_gaps", label: "Skills to develop", type: "textarea", required: true, rows: 4, help: "Separate skills with commas or new lines.", placeholder: "SQL, pytest, authentication" },
      { name: "weekly_hours", label: "Study hours per week", type: "number", value: "5", min: 1, max: 40, required: true },
      { name: "duration_weeks", label: "Duration in weeks", type: "number", value: "8", min: 2, max: 24, required: true },
      { name: "learning_preferences", label: "Learning preference", type: "select", value: "mixed", options: [
        ["mixed", "A mix of learning methods"],
        ["reading", "Reading"],
        ["videos", "Videos"],
        ["hands_on", "Hands-on practice"]
      ]},
      { name: "language", label: "Output language", type: "select", value: "English", options: languageOptions() }
    ]
  },

  "mock-interview": {
    title: "Mock Interview",
    eyebrow: "INTERVIEW PRACTICE",
    description: "Answer AI-generated interview questions one at a time and receive feedback.",
    endpoint: "/api/v1/interviews",
    button: "Start interview",
    fields: [
      { name: "role", label: "Target role", type: "text", required: true, placeholder: "e.g. Junior Python Developer" },
      { name: "seniority", label: "Seniority", type: "select", value: "junior", options: [
        ["junior", "Junior"],
        ["mid", "Mid-level"],
        ["senior", "Senior"]
      ]},
      { name: "interview_type", label: "Interview type", type: "select", value: "mixed", options: [
        ["mixed", "Mixed"],
        ["behavioral", "Behavioral"],
        ["technical", "Technical"]
      ]},
      { name: "company", label: "Company (optional)", type: "text" },
      { name: "job_description", label: "Job description (optional)", type: "textarea", rows: 4 },
      { name: "number_of_questions", label: "Number of questions", type: "number", value: "6", min: 1, max: 20, required: true }
    ]
  },

  "company-interview": {
    title: "Company Interview Prep",
    eyebrow: "COMPANY RESEARCH",
    description: "Research an employer and prepare for likely questions related to its business and the target role.",
    endpoint: "/api/v1/company-interview/prepare",
    button: "Prepare my interview",
    fields: [
      { name: "company_name", label: "Company name", type: "text", required: true, placeholder: "e.g. Yttrium" },
      { name: "target_role", label: "Target role", type: "text", required: true },
      { name: "job_description", label: "Job description (optional)", type: "textarea", rows: 5 },
      { name: "company_context", label: "Additional company context (optional)", type: "textarea", rows: 3 },
      { name: "cv_text", label: "CV text (optional)", type: "textarea", rows: 5 },
      { name: "interview_type", label: "Interview type", type: "select", value: "mixed", options: [
        ["mixed", "Mixed"],
        ["behavioral", "Behavioral"],
        ["technical", "Technical"]
      ]},
      { name: "seniority", label: "Seniority", type: "select", value: "junior", options: [
        ["junior", "Junior"],
        ["mid", "Mid-level"],
        ["senior", "Senior"]
      ]},
      { name: "number_of_questions", label: "Number of questions", type: "number", value: "8", min: 3, max: 15, required: true },
      { name: "language", label: "Output language", type: "select", value: "English", options: languageOptions() }
    ]
  },

  "llm-judge": {
    title: "AI Output Evaluator",
    eyebrow: "QUALITY AND RELIABILITY",
    description: "Evaluate an AI output against its task, context and explicit quality criteria.",
    endpoint: "/api/v1/llm-judge/evaluate",
    button: "Evaluate AI output",
    fields: [
      { name: "artifact_type", label: "Output being evaluated", type: "select", value: "cv_review", required: true, options: [
        ["mock_interview", "Mock Interview"],
        ["cv_review", "CV Review"],
        ["job_fit_analysis", "Job Fit Analysis"],
        ["learning_roadmap", "Learning Roadmap"],
        ["job_search", "Job Search"],
        ["company_interview_prep", "Company Interview Preparation"]
      ]},
      { name: "task_description", label: "Original task", type: "textarea", required: true, rows: 3 },
      { name: "input_context", label: "Input context", type: "textarea", required: true, rows: 5 },
      { name: "model_output", label: "AI output to evaluate", type: "textarea", required: true, rows: 7 },
      { name: "expected_format", label: "Expected format (optional)", type: "textarea", rows: 2 },
      { name: "evaluation_criteria", label: "Evaluation criteria (optional)", type: "textarea", rows: 3, help: "Enter one criterion per line." },
      { name: "language", label: "Output language", type: "select", value: "English", options: languageOptions() }
    ]
  }
};

function languageOptions() {
  return [
    ["English", "English"],
    ["Italian", "Italian"],
    ["German", "German"],
    ["Turkish", "Türkçe"]
  ];
}

/* =========================================================
   DOM REFERENCES AND STATE
   ========================================================= */

const $ = (selector) => document.querySelector(selector);

const dashboardView = $("#dashboard-view");
const workspaceView = $("#workspace-view");
const jobHistoryList = $("#job-history-list");
const jobHistoryStatus = $("#job-history-status");
const refreshJobHistoryButton = $("#refresh-job-history");
const moduleForm = $("#module-form");
const formFields = $("#form-fields");
const pageTitle = $("#page-title");
const pageDescription = $("#page-description");
const moduleEyebrow = $("#module-eyebrow");
const formIntro = $("#form-intro");
const submitButton = $("#submit-button");
const requestStatus = $("#request-status");
const apiStatus = $("#api-status");
const apiStatusDot = $("#api-status-dot");
const resultsEmpty = $("#results-empty");
const visualResults = $("#visual-results");
const chartsContainer = $("#charts-container");
const textualResults = $("#textual-results");
const resultsContent = $("#results-content");
const jobHistoryNav = $("#nav-job-history");

let activeModule = null;
let mockInterviewState = null;
let requestInProgress = false;

const CHART_COLORS = [
  "#345dd5",
  "#167d70",
  "#bd593d",
  "#b78032",
  "#7a64bf",
  "#4b91b5",
  "#bc668c",
  "#82916a"
];

/* =========================================================
   SMALL HELPERS
   ========================================================= */

function createElement(tag, className = "", text = null) {
  const element = document.createElement(tag);

  if (className) {
    element.className = className;
  }

  if (text !== null && text !== undefined) {
    element.textContent = String(text);
  }

  return element;
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function readableLabel(value) {
  return String(value)
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function splitList(value) {
  return String(value || "")
    .split(/[,\n;]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function setRequestStatus(message, type = "") {
  requestStatus.textContent = message;
  requestStatus.className = "request-status";

  if (type) {
    requestStatus.classList.add(type);
  }
}

function setApiStatus(online, message) {
  apiStatus.textContent = message;
  apiStatusDot.classList.toggle("online", online);
  apiStatusDot.classList.toggle("offline", !online);
}

function setLoading(loading, label = "Working...") {
  requestInProgress = loading;
  submitButton.disabled = loading;

  if (activeModule) {
    submitButton.textContent = loading
      ? label
      : MODULES[activeModule].button;
  }
}

async function readResponse(response) {
  const contentType = response.headers.get("content-type") || "";

  let data;

  if (contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    let message = "Request failed with HTTP " + response.status;

    if (data && typeof data === "object") {
      message = data.detail || data.message || message;
    } else if (typeof data === "string" && data.trim()) {
      message = data;
    }

    throw new Error(message);
  }

  return data;
}

const VISITOR_ID_KEY = "career-coach-visitor-id";

function getVisitorId() {
  let visitorId = localStorage.getItem(VISITOR_ID_KEY);

  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem(VISITOR_ID_KEY, visitorId);
  }

  return visitorId;
}

async function apiRequest(endpoint, payload = null, method = "POST") {
  const options = {
    method,
    headers: {
      "Accept": "application/json"
    }
  };

  if (
  endpoint === "/api/v1/jobs/search" ||
  endpoint === "/api/v1/jobs/history"
) {
  options.headers["X-Visitor-ID"] = getVisitorId();
}

  if (payload !== null) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(payload);
  }

  const response = await fetch(API_BASE + endpoint, options);
  return readResponse(response);
}

/* =========================================================
   API STATUS
   ========================================================= */

async function checkApiStatus() {
  setApiStatus(false, "Checking backend...");

  try {
    const response = await fetch(API_BASE + "/health", {
      method: "GET",
      headers: { "Accept": "application/json" }
    });

    if (!response.ok) {
      throw new Error("Health check failed");
    }

    const data = await response.json();

    if (data.status !== "ok") {
      throw new Error("Unexpected health response");
    }

    setApiStatus(true, "Backend online");
  } catch (error) {
    console.warn("Backend status check failed:", error.message);
    setApiStatus(false, "Backend unavailable");
  }
}

/* =========================================================
   NAVIGATION
   ========================================================= */

function openDashboard() {
  activeModule = null;
  mockInterviewState = null;

  dashboardView.hidden = false;
  workspaceView.hidden = true;

  document.querySelectorAll(".nav-link").forEach((button) => {
    button.classList.toggle(
      "active",
      button.dataset.module === "dashboard"
    );
  });
}

function openModule(moduleKey) {
  if (moduleKey === "dashboard") {
    openDashboard();
    return;
  }

  const module = MODULES[moduleKey];

  if (!module) {
    return;
  }

  activeModule = moduleKey;
  mockInterviewState = null;

  dashboardView.hidden = true;
  workspaceView.hidden = false;

  pageTitle.textContent = module.title;
  pageDescription.textContent = module.description;
  moduleEyebrow.textContent = module.eyebrow;
  formIntro.textContent = "Complete the fields below to get started.";
  submitButton.textContent = module.button;

  formFields.innerHTML = module.fields.map(renderFieldHTML).join("");

  moduleForm.reset();
  setRequestStatus("");

  clearResults();

  document.querySelectorAll(".nav-link").forEach((button) => {
    button.classList.toggle(
      "active",
      button.dataset.module === moduleKey
    );
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderFieldHTML(field) {
  const required = field.required ? "required" : "";
  const placeholder = field.placeholder
    ? `placeholder="${escapeHTML(field.placeholder)}"`
    : "";
  const min = field.min !== undefined ? `min="${field.min}"` : "";
  const max = field.max !== undefined ? `max="${field.max}"` : "";
  const rows = field.rows ? `rows="${field.rows}"` : "";
  const value = field.value !== undefined
    ? `value="${escapeHTML(field.value)}"`
    : "";

  let control;

  if (field.type === "textarea") {
    control = `
      <textarea
        id="${field.name}"
        name="${field.name}"
        ${required}
        ${placeholder}
        ${rows}
      ></textarea>`;
  } else if (field.type === "select") {
    control = `
      <select id="${field.name}" name="${field.name}" ${required}>
        ${(field.options || []).map(([optionValue, optionLabel]) => `
          <option value="${escapeHTML(optionValue)}"
            ${optionValue === field.value ? "selected" : ""}>
            ${escapeHTML(optionLabel)}
          </option>
        `).join("")}
      </select>`;
  } else {
    control = `
      <input
        id="${field.name}"
        name="${field.name}"
        type="${field.type || "text"}"
        ${required}
        ${placeholder}
        ${min}
        ${max}
        ${value}
      >`;
  }

  return `
    <div class="form-field">
      <label for="${field.name}">${escapeHTML(field.label)}</label>
      ${control}
      ${field.help
        ? `<span class="field-help">${escapeHTML(field.help)}</span>`
        : ""}
    </div>`;
}

document.querySelectorAll("[data-module]").forEach((element) => {
  element.addEventListener("click", (event) => {
    event.preventDefault();
    openModule(element.dataset.module);
  });
});

$("#back-to-dashboard").addEventListener("click", openDashboard);

jobHistoryNav.addEventListener("click", async () => {
  activeModule = null;
  mockInterviewState = null;

  dashboardView.hidden = false;
  workspaceView.hidden = true;

  document.querySelectorAll(".nav-link").forEach((button) => {
    button.classList.toggle("active", button === jobHistoryNav);
  });

  await loadJobSearchHistory();

  $("#job-history-panel").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
});

/* =========================================================
   FORM DATA AND API PAYLOADS
   ========================================================= */

function formValues(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function buildPayload(moduleKey, values) {
  switch (moduleKey) {
    case "cv-review":
      return {
        target_role: values.target_role.trim(),
        cv_text: values.cv_text.trim(),
        job_description: values.job_description.trim() || null,
        language: values.language
      };

    case "job-fit":
      return {
        target_role: values.target_role.trim(),
        cv_text: values.cv_text.trim(),
        job_description: values.job_description.trim(),
        language: values.language
      };

    case "job-search":
      return {
        target_role: values.target_role.trim(),
        location: values.location.trim() || null,
        remote_preference: values.remote_preference,
        seniority: values.seniority,
        employment_type: values.employment_type,
        skills: splitList(values.skills),
        keywords: splitList(values.keywords),
        max_results: Number(values.max_results),
        language: values.language
      };

    case "learning-roadmap":
      return {
        target_role: values.target_role.trim(),
        current_skills: splitList(values.current_skills),
        skill_gaps: splitList(values.skill_gaps),
        weekly_hours: Number(values.weekly_hours),
        duration_weeks: Number(values.duration_weeks),
        learning_preferences: values.learning_preferences,
        language: values.language
      };

    case "mock-interview":
      return {
        role: values.role.trim(),
        seniority: values.seniority,
        interview_type: values.interview_type,
        company: values.company.trim() || null,
        job_description: values.job_description.trim() || null,
        number_of_questions: Number(values.number_of_questions)
      };

    case "company-interview":
      return {
        company_name: values.company_name.trim(),
        target_role: values.target_role.trim(),
        job_description: values.job_description.trim() || null,
        company_context: values.company_context.trim() || null,
        cv_text: values.cv_text.trim() || null,
        interview_type: values.interview_type,
        seniority: values.seniority,
        number_of_questions: Number(values.number_of_questions),
        language: values.language
      };

    case "llm-judge":
      return {
        artifact_type: values.artifact_type,
        task_description: values.task_description.trim(),
        input_context: values.input_context.trim(),
        model_output: values.model_output.trim(),
        expected_format: values.expected_format.trim() || null,
        evaluation_criteria: splitList(values.evaluation_criteria),
        language: values.language
      };

    default:
      throw new Error("Unknown module.");
  }
}

/* =========================================================
   FORM SUBMISSION
   ========================================================= */

moduleForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!activeModule || requestInProgress) {
    return;
  }

  if (!moduleForm.reportValidity()) {
    return;
  }

  const moduleKey = activeModule;
  const module = MODULES[moduleKey];
  const values = formValues(moduleForm);

  setRequestStatus("");
  setLoading(true);

  try {
    const payload = buildPayload(moduleKey, values);

    setRequestStatus("Sending your request to the AI service...");

    const result = await apiRequest(module.endpoint, payload);

    if (moduleKey === "mock-interview") {
      mockInterviewState = {
        sessionId: result.session_id,
        totalQuestions: result.total_questions,
        questionNumber: result.question_number || 1
      };

      renderMockInterviewQuestion(result);
        } else {
      renderOutput(moduleKey, result);
    }

    if (moduleKey === "job-search") {
      await loadJobSearchHistory();
    }

    setRequestStatus("Your results are ready.", "success");
  } catch (error) {
    console.error("Career Coach request failed:", error);

    setRequestStatus(
      error.message || "The request could not be completed. Please retry.",
      "error"
    );
  } finally {
    setLoading(false);
  }
});

/* =========================================================
   RESULTS LAYOUT
   ========================================================= */

function clearResults() {
  resultsEmpty.hidden = false;
  visualResults.hidden = true;
  textualResults.hidden = true;

  chartsContainer.replaceChildren();
  resultsContent.replaceChildren();
}


function renderOutput(moduleKey, data) {
  resultsEmpty.hidden = true;
  textualResults.hidden = false;

  resultsContent.replaceChildren();
  chartsContainer.replaceChildren();

  // Keep the existing chart rendering unchanged.
  const charts = buildCharts(moduleKey, data);

  if (charts.length > 0) {
    visualResults.hidden = false;

    charts.forEach((chart) => {
      if (chart.type === "bars") {
        renderBarChart(chartsContainer, chart);
      } else if (chart.type === "donut") {
        renderDonutChart(chartsContainer, chart);
      }
    });
  } else {
    visualResults.hidden = true;
  }

  // Organize written results into key results and expandable details.
  renderCompactResults(moduleKey, data, resultsContent);
}

function renderCompactResults(moduleKey, data, parent) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    renderValue("Result", data, parent);
    return;
  }

  const entries = Object.entries(data).filter(
    ([, value]) =>
      value !== null &&
      value !== undefined &&
      value !== ""
  );

  if (entries.length === 0) {
    renderValue("Result", data, parent);
    return;
  }

  const moduleOverviewKeys = {
    "cv-review": [
      "overall_assessment",
      "summary",
      "executive_summary",
      "overall_score",
      "verdict",
      "recommendation"
    ],

    "job-fit": [
      "overall_assessment",
      "summary",
      "fit_score",
      "verdict",
      "recommendation"
    ],

    "job-search": [
      "search_summary",
      "summary",
      "total_found",
      "jobs_found",
      "query",
      "location"
    ],

    "learning-roadmap": [
      "summary",
      "learning_goal",
      "total_weeks",
      "weekly_hours",
      "recommendation"
    ],

    "company-interview": [
      "summary",
      "company_overview",
      "interview_strategy",
      "key_takeaways",
      "recommendation"
    ],

    "llm-judge": [
      "verdict",
      "overall_score",
      "score",
      "evaluation_summary",
      "overall_assessment",
      "summary"
    ]
  };

  const commonOverviewKeys = [
    "summary",
    "executive_summary",
    "overall_summary",
    "overall_assessment",
    "verdict",
    "overall_score",
    "fit_score",
    "score",
    "recommendation",
    "final_recommendation",
    "conclusion"
  ];

  const normalizeKey = (key) =>
    String(key).toLowerCase().replace(/[\s_-]/g, "");

  const preferredKeys = [
    ...(moduleOverviewKeys[moduleKey] || []),
    ...commonOverviewKeys
  ].map(normalizeKey);

  // Prefer meaningful summary fields already returned by the AI.
  const overviewEntries = [];

  for (const preferredKey of preferredKeys) {
    const match = entries.find(
      ([key]) => normalizeKey(key) === preferredKey
    );

    if (
      match &&
      !overviewEntries.some(([key]) => key === match[0])
    ) {
      overviewEntries.push(match);
    }

    if (overviewEntries.length >= 4) {
      break;
    }
  }

  // If there are no summary fields, show a few concise metrics.
  if (overviewEntries.length === 0) {
    const metricEntries = entries.filter(([key, value]) =>
      /score|rating|verdict|status|total|count|weeks|hours|fit|match/i.test(key) &&
      (typeof value === "number" || typeof value === "boolean" ||
        (typeof value === "string" && value.length <= 180))
    );

    overviewEntries.push(...metricEntries.slice(0, 4));
  }

  // Final fallback: show up to two short text values, not long analysis sections.
  if (overviewEntries.length === 0) {
    const excludedFromFallback =
      /description|analysis|details|reason|explanation|evidence|strengths|issues|jobs|weeks|skills|requirements|questions|recommendations|actions|steps|risks|gaps/i;

    const shortEntries = entries.filter(([key, value]) =>
      !excludedFromFallback.test(key) &&
      (
        typeof value === "number" ||
        typeof value === "boolean" ||
        (typeof value === "string" && value.length <= 180)
      )
    );

    overviewEntries.push(...shortEntries.slice(0, 2));
  }

  const overviewKeys = new Set(
    overviewEntries.map(([key]) => key)
  );

  const detailEntries = entries.filter(
    ([key]) => !overviewKeys.has(key)
  );

  if (overviewEntries.length > 0) {
    const overviewHeading = createElement(
      "section",
      "result-block result-overview"
    );

    overviewHeading.appendChild(
      createElement("h3", "", "Key results")
    );

    overviewEntries.forEach(([key, value]) => {
      renderValue(readableLabel(key), value, overviewHeading);
    });

    parent.appendChild(overviewHeading);
  } else {
    parent.appendChild(
      createElement(
        "p",
        "results-detail-hint",
        "Open the detailed analysis below to view the complete results."
      )
    );
  }

  if (detailEntries.length > 0) {
    const details = createElement("details", "result-details");

    const summary = createElement(
      "summary",
      "result-details-summary",
      "Detailed analysis and remaining results"
    );

    const detailsContent = createElement(
      "div",
      "result-details-content"
    );

    details.appendChild(summary);
    details.appendChild(detailsContent);

    detailEntries.forEach(([key, value]) => {
      renderValue(readableLabel(key), value, detailsContent);
    });

    parent.appendChild(details);
  }
}

function renderObjectContents(object, parent) {
  if (!object || typeof object !== "object" || Array.isArray(object)) {
    renderValue("Result", object, parent);
    return;
  }

  for (const [key, value] of Object.entries(object)) {
    if (value === null || value === undefined || value === "") {
      continue;
    }

    renderValue(readableLabel(key), value, parent);
  }
}

function renderValue(label, value, parent, depth = 0) {
  if (value === null || value === undefined || depth > 5) {
    return;
  }

  const block = createElement("section", "result-block");
  const heading = createElement("h3", "", label);
  block.appendChild(heading);

  if (Array.isArray(value)) {
    if (value.length === 0) {
      block.appendChild(
        createElement("p", "", "No items reported.")
      );
    } else if (value.every((item) =>
      item === null ||
      ["string", "number", "boolean"].includes(typeof item)
    )) {
      const list = createElement("ul", "result-list");

      value.forEach((item) => {
        list.appendChild(createElement("li", "", String(item)));
      });

      block.appendChild(list);
    } else {
      value.forEach((item, index) => {
        if (!item || typeof item !== "object") {
          block.appendChild(createElement("p", "", String(item)));
          return;
        }

        const card = createElement("article", "result-card");
        const cardTitle = getObjectTitle(item, index);

        card.appendChild(createElement("h4", "", cardTitle));
        renderObjectContents(item, card);
        block.appendChild(card);
      });
    }
  } else if (typeof value === "object") {
    const nested = createElement("div", "result-nested");
    renderObjectContents(value, nested);
    block.appendChild(nested);
  } else if (typeof value === "boolean") {
    block.appendChild(createElement("p", "", value ? "Yes" : "No"));
  } else {
    const text = createElement("p", "", String(value));
    block.appendChild(text);
  }

  parent.appendChild(block);
}

function getObjectTitle(object, index) {
  const preferredKeys = [
    "title",
    "question",
    "skill",
    "focus",
    "company",
    "dimension",
    "week",
    "category",
    "name",
    "priority"
  ];

  for (const key of preferredKeys) {
    if (object[key] !== undefined && object[key] !== null) {
      const value = object[key];

      if (typeof value === "object") {
        continue;
      }

      return key === "week"
        ? `Week ${value}`
        : String(value);
    }
  }

  return `Item ${index + 1}`;
}

/* =========================================================
   DATA-DRIVEN CHARTS
   No invented scores: charts use returned response values.
   ========================================================= */

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function chartBars(title, description, items) {
  const validItems = items
    .map((item) => ({
      label: String(item.label),
      value: Number(item.value)
    }))
    .filter((item) => Number.isFinite(item.value) && item.value >= 0);

  if (validItems.length === 0) {
    return null;
  }

  return {
    type: "bars",
    title,
    description,
    items: validItems
  };
}

function chartDonut(title, description, items) {
  const validItems = items
    .map((item) => ({
      label: String(item.label),
      value: Number(item.value)
    }))
    .filter((item) => Number.isFinite(item.value) && item.value > 0);

  if (validItems.length === 0) {
    return null;
  }

  return {
    type: "donut",
    title,
    description,
    items: validItems
  };
}

function buildCharts(moduleKey, data) {
  const charts = [];

  const add = (chart) => {
    if (chart) charts.push(chart);
  };

  if (moduleKey === "cv-review") {
    const items = [
      { label: "Strengths", value: asArray(data.strengths).length },
      { label: "Issues", value: asArray(data.issues).length },
      { label: "Relevant skills", value: asArray(data.relevant_skills).length },
      { label: "Requirements to verify", value: asArray(data.requirements_to_verify).length }
    ];

    add(chartBars(
      "CV Review Overview",
      "Number of findings in each category returned by the review.",
      items
    ));

    add(chartDonut(
      "Strengths and issues",
      "Proportion of strengths and issues identified in the CV.",
      [
        { label: "Strengths", value: asArray(data.strengths).length },
        { label: "Issues", value: asArray(data.issues).length }
      ]
    ));
  }

  if (moduleKey === "job-fit") {
    add(chartDonut(
      "Skills and requirement analysis",
      "Counts of matching requirements, skill gaps and transferable skills.",
      [
        { label: "Matching requirements", value: asArray(data.matching_requirements).length },
        { label: "Skill gaps", value: asArray(data.skill_gaps).length },
        { label: "Transferable skills", value: asArray(data.transferable_skills).length }
      ]
    ));

    if (Number.isFinite(Number(data.fit_score))) {
      add(chartBars(
        "Job fit score",
        "The score generated by the backend, shown on a scale of 0–100.",
        [{ label: "Fit score", value: Math.max(0, Math.min(100, Number(data.fit_score))) }]
      ));
    }
  }

  if (moduleKey === "job-search") {
    const jobs = asArray(data.jobs);
    const remoteCounts = {};

    jobs.forEach((job) => {
      const policy = job.remote_policy || "unknown";
      remoteCounts[readableLabel(policy)] =
        (remoteCounts[readableLabel(policy)] || 0) + 1;
    });

    add(chartDonut(
      "Work arrangements",
      "Distribution of retrieved listings by their reported work arrangement.",
      Object.entries(remoteCounts).map(([label, value]) => ({ label, value }))
    ));

    const scoredJobs = jobs
      .filter((job) => Number.isFinite(Number(job.fit_score)))
      .map((job) => ({
        label: job.title || job.company || "Job",
        value: Math.max(0, Math.min(100, Number(job.fit_score)))
      }));

    add(chartBars(
      "Job relevance scores",
      "Approximate relevance scores returned for individual listings.",
      scoredJobs
    ));
  }

  if (moduleKey === "learning-roadmap") {
    const weeks = asArray(data.weeks);

    add(chartBars(
      "Estimated hours per week",
      "Planned weekly workload from the generated learning roadmap.",
      weeks.map((week) => ({
        label: `Week ${week.week}`,
        value: Number(week.estimated_hours)
      }))
    ));

    const activityCounts = {};

    weeks.forEach((week) => {
      asArray(week.activities).forEach((activity) => {
        const type = readableLabel(activity.activity_type || "Other");
        activityCounts[type] = (activityCounts[type] || 0) + 1;
      });
    });

    add(chartDonut(
      "Learning activity mix",
      "Distribution of planned activities by activity type.",
      Object.entries(activityCounts).map(([label, value]) => ({ label, value }))
    ));
  }

  if (moduleKey === "mock-interview") {
    const feedback = data.feedback || {};
    const dimensionScores = asArray(feedback.dimension_scores);

    if (dimensionScores.length > 0) {
      add(chartBars(
        "Interview feedback scores",
        "Scores returned by the interview feedback service.",
        dimensionScores.map((item) => ({
          label: item.dimension || item.name || "Score",
          value: Number(item.score)
        }))
      ));
    }
  }

  if (moduleKey === "company-interview") {
    const questions = asArray(data.likely_questions);
    const categoryCounts = {};
    const difficultyCounts = {};

    questions.forEach((question) => {
      const category = readableLabel(question.category || "Other");
      const difficulty = readableLabel(question.difficulty || "Unknown");

      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      difficultyCounts[difficulty] = (difficultyCounts[difficulty] || 0) + 1;
    });

    add(chartDonut(
      "Question categories",
      "Distribution of proposed interview questions by category.",
      Object.entries(categoryCounts).map(([label, value]) => ({ label, value }))
    ));

    add(chartBars(
      "Question difficulty",
      "Number of proposed questions at each difficulty level.",
      Object.entries(difficultyCounts).map(([label, value]) => ({ label, value }))
    ));
  }

  if (moduleKey === "llm-judge") {
    const dimensions = asArray(data.dimension_scores);

    add(chartBars(
      "Evaluation by dimension",
      "Scores returned by the evaluator, on a scale of 0–5.",
      dimensions.map((item) => ({
        label: readableLabel(item.dimension || "Dimension"),
        value: Number(item.score)
      }))
    ));

    const issues = asArray(data.issues);
    const severityCounts = {};

    issues.forEach((issue) => {
      const severity = readableLabel(issue.severity || "Unknown");
      severityCounts[severity] = (severityCounts[severity] || 0) + 1;
    });

    add(chartDonut(
      "Identified issues by severity",
      "Distribution of issues reported by the evaluator.",
      Object.entries(severityCounts).map(([label, value]) => ({ label, value }))
    ));
  }

  return charts;
}

/* =========================================================
   CHART CARD AND SVG BAR CHART RENDERING
   ========================================================= */

function createChartCard(chart) {
  const card = createElement("section", "chart-card");
  card.appendChild(createElement("h4", "", chart.title));
  card.appendChild(createElement("p", "chart-description", chart.description));
  card.appendChild(createElement("div", "chart-canvas-container"));
  return card;
}

function renderBarChart(container, chart) {
  const card = createChartCard(chart);
  const chartArea = card.querySelector(".chart-canvas-container");

  const items = chart.items;
  const width = 520;
  const left = 160;
  const right = 42;
  const barWidth = width - left - right;
  const rowHeight = 40;
  const height = Math.max(105, items.length * rowHeight + 24);
  const maxValue = Math.max(1, ...items.map((item) => item.value));

  const parts = [
    `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHTML(chart.title)}" xmlns="http://www.w3.org/2000/svg">`
  ];

  items.forEach((item, index) => {
    const y = 12 + index * rowHeight;
    const barLength = Math.max(0, (item.value / maxValue) * barWidth);
    const color = CHART_COLORS[index % CHART_COLORS.length];
    const displayLabel = item.label.length > 22
      ? item.label.slice(0, 21) + "…"
      : item.label;

    parts.push(`
      <text x="0" y="${y + 15}"
        fill="#647386" font-size="11"
        font-family="Arial, sans-serif">${escapeHTML(displayLabel)}</text>

      <rect x="${left}" y="${y}" width="${barWidth}" height="18"
        rx="6" fill="#edf0f4"/>

      <rect x="${left}" y="${y}" width="${barLength}" height="18"
        rx="6" fill="${color}"/>

      <text x="${width - right + 8}" y="${y + 14}"
        fill="#1b2d40" font-size="11" font-weight="700"
        font-family="Arial, sans-serif">${escapeHTML(item.value)}</text>
    `);
  });

  parts.push("</svg>");
  chartArea.innerHTML = parts.join("");
  container.appendChild(card);
}

function renderDonutChart(container, chart) {
  const card = createChartCard(chart);
  const chartArea = card.querySelector(".chart-canvas-container");

  const items = chart.items;
  const total = items.reduce((sum, item) => sum + item.value, 0);

  if (total <= 0) return;

  const ring = createElement("div");
  ring.style.cssText = [
    "position:relative",
    "display:grid",
    "place-items:center",
    "width:142px",
    "height:142px",
    "margin:8px auto 18px",
    "border-radius:50%"
  ].join(";");

  let cursor = 0;
  const gradientParts = items.map((item, index) => {
    const start = cursor;
    const end = cursor + (item.value / total) * 100;
    cursor = end;

    return `${CHART_COLORS[index % CHART_COLORS.length]} ${start}% ${end}%`;
  });

  ring.style.background = `conic-gradient(${gradientParts.join(", ")})`;

  const center = createElement("div");
  center.style.cssText = [
    "display:flex",
    "flex-direction:column",
    "align-items:center",
    "justify-content:center",
    "width:91px",
    "height:91px",
    "border-radius:50%",
    "background:#ffffff",
    "text-align:center"
  ].join(";");

  center.appendChild(
    createElement("span", "", String(total))
  ).style.cssText = "color:#15304d;font-size:24px;font-weight:800;line-height:1.3";

  center.appendChild(
    createElement("span", "", "Total")
  ).style.cssText = "color:#647386;font-size:10px";

  ring.appendChild(center);
  chartArea.appendChild(ring);

  const legend = createElement("div");
  legend.style.cssText = "display:flex;flex-direction:column;gap:9px";

  items.forEach((item, index) => {
    const row = createElement("div");
    row.style.cssText = "display:flex;align-items:center;gap:8px;font-size:11px";

    const swatch = createElement("span");
    swatch.style.cssText = [
      "width:9px",
      "height:9px",
      "flex:0 0 9px",
      "border-radius:3px",
      `background:${CHART_COLORS[index % CHART_COLORS.length]}`
    ].join(";");

    const label = createElement("span", "", item.label);
    label.style.cssText = "flex:1;color:#647386";

    const value = createElement(
      "strong",
      "",
      `${item.value} (${Math.round((item.value / total) * 100)}%)`
    );
    value.style.cssText = "color:#1b2d40;font-size:10px";

    row.append(swatch, label, value);
    legend.appendChild(row);
  });

  chartArea.appendChild(legend);
  container.appendChild(card);
}

/* =========================================================
   MOCK INTERVIEW FLOW
   ========================================================= */

function renderMockInterviewQuestion(data) {
  resultsEmpty.hidden = true;
  visualResults.hidden = true;
  textualResults.hidden = false;
  resultsContent.replaceChildren();

  const currentNumber = Number(data.question_number || mockInterviewState.questionNumber || 1);
  const total = Number(data.total_questions || mockInterviewState.totalQuestions || 1);
  const isCompleted = data.status === "completed";

  const progressBlock = createElement("section", "result-block");
  progressBlock.appendChild(
    createElement("h3", "", isCompleted ? "Interview completed" : `Question ${currentNumber} of ${total}`)
  );

  const summary = isCompleted
    ? "You have completed the interview. Review the feedback below."
    : "Answer as you would during a real interview. Your progress is shown below.";

  progressBlock.appendChild(createElement("p", "", summary));

  if (!isCompleted && total > 0) {
    const answered = Math.max(0, Math.min(total, currentNumber - 1));
    const remaining = Math.max(0, total - answered);

    chartsContainer.replaceChildren();

    renderDonutChart(chartsContainer, {
      title: "Interview progress",
      description: "Questions already answered versus questions remaining.",
      items: [
        { label: "Answered", value: answered },
        { label: "Remaining", value: remaining }
      ].filter((item) => item.value > 0)
    });

    if (chartsContainer.children.length > 0) {
      visualResults.hidden = false;
    } else {
      visualResults.hidden = true;
    }
  }

  progressBlock.appendChild(
    createElement("p", "", `Session ID: ${data.session_id || mockInterviewState.sessionId}`)
  );

  resultsContent.appendChild(progressBlock);

  if (isCompleted) {
    if (data.feedback) {
      renderValue("Final feedback", data.feedback, resultsContent);
    }

    renderValue("Status", data.status, resultsContent);
    renderValue("Total questions", data.total_questions, resultsContent);
    return;
  }

  const questionBlock = createElement("section", "result-block");
  questionBlock.appendChild(createElement("h3", "", "Your question"));
  questionBlock.appendChild(
    createElement("p", "", data.question || data.next_question || "No question was returned.")
  );

  const answerForm = createElement("form", "interview-question");
  const label = createElement("label", "field-label", "Your answer");
  label.htmlFor = "mock-answer";

  const answer = createElement("textarea", "interview-answer");
  answer.id = "mock-answer";
  answer.name = "answer";
  answer.required = true;
  answer.placeholder = "Write your answer here...";
  answer.setAttribute("aria-label", "Your interview answer");

  const submit = createElement("button", "primary-button", "Submit answer");
  submit.type = "submit";

  answerForm.append(label, answer, submit);
  questionBlock.appendChild(answerForm);
  resultsContent.appendChild(questionBlock);

  answerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!mockInterviewState || requestInProgress || !answer.value.trim()) {
      return;
    }

    const sessionId = mockInterviewState.sessionId;
    setLoading(true, "Submitting answer...");
    setRequestStatus("Saving your answer and preparing the next step...");

    try {
      const result = await apiRequest(
        `/api/v1/interviews/${encodeURIComponent(sessionId)}/answers`,
        { answer: answer.value.trim() }
      );

      mockInterviewState.questionNumber = result.question_number;
      mockInterviewState.totalQuestions = result.total_questions;

      if (result.status === "completed") {
        renderMockInterviewQuestion(result);
        setRequestStatus("Interview completed. Your feedback is ready.", "success");
      } else {
        result.question = result.next_question;
        renderMockInterviewQuestion(result);
        setRequestStatus("Answer submitted. Continue with the next question.", "success");
      }
    } catch (error) {
      console.error("Interview answer failed:", error);
      setRequestStatus(error.message || "Could not submit your answer.", "error");
    } finally {
      setLoading(false);
    }
  });
}

async function loadJobSearchHistory() {
  if (!jobHistoryList || !jobHistoryStatus) {
    return;
  }

  jobHistoryList.replaceChildren();
  jobHistoryStatus.textContent = "Loading saved searches...";

  try {
    const records = await apiRequest(
      "/api/v1/jobs/history",
      null,
      "GET"
    );

    if (!Array.isArray(records) || records.length === 0) {
      jobHistoryStatus.textContent =
        "No saved job searches in this browser yet.";
      return;
    }

    jobHistoryStatus.textContent =
      `Showing ${records.length} saved search${records.length === 1 ? "" : "es"}.`;

    records.forEach((record) => {
      const item = document.createElement("article");
      item.className = "history-item";

      const details = document.createElement("div");
      details.className = "history-item-copy";

      const title = document.createElement("h3");
      title.textContent = record.target_role || "Job search";

      const meta = document.createElement("p");
      const date = record.created_at
        ? new Date(record.created_at)
        : null;

      const dateText =
        date && !Number.isNaN(date.getTime())
          ? date.toLocaleString()
          : "";

      meta.textContent = [
        record.location,
        dateText
      ].filter(Boolean).join(" · ");

      details.append(title, meta);

      const button = document.createElement("button");
      button.type = "button";
      button.className = "history-view-button";
      button.textContent = "View results";

      button.addEventListener("click", () => {
        if (!record.result_data) {
          jobHistoryStatus.textContent =
            "Saved results are unavailable.";
          return;
        }

        openModule("job-search");
        renderOutput("job-search", record.result_data);
        setRequestStatus("Showing saved results.", "success");
      });

      item.append(details, button);
      jobHistoryList.appendChild(item);
    });
  } catch (error) {
    console.error("Could not load job search history:", error);

    jobHistoryStatus.textContent =
      "Could not load saved searches. Please try again.";
  }
}

/* =========================================================
   INITIALIZATION
   ========================================================= */
refreshJobHistoryButton.addEventListener(
  "click",
  loadJobSearchHistory
);

openDashboard();
checkApiStatus();

loadJobSearchHistory();
