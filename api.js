// src/api.js  —  All backend API calls in one place

const BASE = "http://localhost:8000";

function getToken() {
  return localStorage.getItem("campuscode_token");
}

async function request(method, path, body = null, isForm = false) {
  const headers = {};
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!isForm) headers["Content-Type"] = "application/json";

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body
      ? isForm
        ? body                          // FormData
        : JSON.stringify(body)
      : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Request failed");
  }
  return res.json();
}

// ─── AUTH ────────────────────────────────────────────────────────────────────

export const authAPI = {
  register: (name, email, password) =>
    request("POST", "/auth/register", { name, email, password }),

  login: (email, password) =>
    request("POST", "/auth/login", { email, password }),

  me: () => request("GET", "/auth/me"),
};

// ─── COMPANIES ───────────────────────────────────────────────────────────────

export const companiesAPI = {
  list:      ()   => request("GET", "/companies/"),
  get:       (id) => request("GET", `/companies/${id}`),
};

// ─── TESTS ───────────────────────────────────────────────────────────────────

export const testsAPI = {
  getTests:     (companyId)          => request("GET", `/tests/${companyId}`),
  getQuestions: (companyId, testId)  => request("GET", `/tests/${companyId}/${testId}/questions`),
  submit:       (payload)            => request("POST", "/tests/submit", payload),
};

// ─── INTERVIEW ───────────────────────────────────────────────────────────────

export const interviewAPI = {
  start: (companyId, role, resumeText = "") =>
    request("POST", "/interview/start", { company_id: companyId, role, resume_text: resumeText }),

  submitTextAnswer: (sessionId, questionId, answerText) =>
    request("POST", "/interview/answer", {
      session_id: sessionId,
      question_id: String(questionId),
      answer_text: answerText,
    }),

  submitVoiceAnswer: (sessionId, questionId, audioBlob) => {
    const form = new FormData();
    form.append("session_id",  sessionId);
    form.append("question_id", String(questionId));
    form.append("audio",       audioBlob, "answer.webm");
    return request("POST", "/interview/answer-voice", form, true);
  },

  complete:  (sessionId) => request("POST", `/interview/complete/${sessionId}`),
  history:   ()          => request("GET",  "/interview/history"),
};

// ─── ANALYTICS ───────────────────────────────────────────────────────────────

export const analyticsAPI = {
  dashboard:   ()          => request("GET", "/analytics/dashboard"),
  leaderboard: (companyId) => request("GET", `/analytics/leaderboard/${companyId}`),
};
