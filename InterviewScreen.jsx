import { useState, useEffect, useRef, useCallback } from "react";
import { interviewAPI } from "./api";

// ── Waveform visualiser (canvas) ─────────────────────────────────────────────
function Waveform({ analyser, active }) {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);

  useEffect(() => {
    if (!active || !analyser) return;
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d");
    const buf    = new Uint8Array(analyser.frequencyBinCount);

    function draw() {
      analyser.getByteTimeDomainData(buf);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth   = 2;
      ctx.beginPath();
      const sliceW = canvas.width / buf.length;
      let x = 0;
      buf.forEach((v, i) => {
        const y = (v / 128) * (canvas.height / 2);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        x += sliceW;
      });
      ctx.stroke();
      rafRef.current = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [active, analyser]);

  return (
    <canvas ref={canvasRef} width={300} height={60}
      style={{ width: "100%", height: 60, borderRadius: 8, background: "#0a1628" }} />
  );
}

// ── Score Ring ────────────────────────────────────────────────────────────────
function ScoreRing({ score, size = 64 }) {
  const r   = size / 2 - 6;
  const circ = 2 * Math.PI * r;
  const pct  = score / 10;
  const color = score >= 7 ? "#22c55e" : score >= 5 ? "#f59e0b" : "#ef4444";
  return (
    <svg width={size} height={size}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1e293b" strokeWidth={5} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={5}
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
        strokeLinecap="round" style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }} />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
        style={{ fontSize: 16, fontWeight: 800, fill: color, fontFamily: "'DM Sans',sans-serif" }}>
        {score}
      </text>
    </svg>
  );
}

// ── Feedback Card ─────────────────────────────────────────────────────────────
function FeedbackCard({ fb, qNum }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ background: "#0d1520", border: "1px solid #1e293b", borderRadius: 14, overflow: "hidden", marginBottom: 12 }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ width: "100%", background: "none", border: "none", padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", textAlign: "left" }}>
        <ScoreRing score={fb.score} size={48} />
        <div style={{ flex: 1 }}>
          <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 2 }}>Q{qNum}</div>
          <div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600, lineHeight: 1.4 }}>{fb.question?.slice(0, 80)}…</div>
        </div>
        <span style={{ color: "#475569", fontSize: 12 }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div style={{ padding: "0 20px 20px", borderTop: "1px solid #1e293b" }}>
          {fb.answer && (
            <div style={{ background: "#111827", borderRadius: 8, padding: "10px 14px", color: "#64748b", fontSize: 13, margin: "16px 0 12px", fontStyle: "italic" }}>
              💬 "{fb.answer}"
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ color: "#22c55e", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>✅ Strengths</div>
              {(fb.strengths || []).map((s, i) => (
                <div key={i} style={{ color: "#94a3b8", fontSize: 13, padding: "3px 0" }}>• {s}</div>
              ))}
            </div>
            <div>
              <div style={{ color: "#f59e0b", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>⚡ Improve</div>
              {(fb.improvements || []).map((s, i) => (
                <div key={i} style={{ color: "#94a3b8", fontSize: 13, padding: "3px 0" }}>• {s}</div>
              ))}
            </div>
          </div>
          {fb.model_answer && (
            <div style={{ marginTop: 14, background: "#0ea5e911", border: "1px solid #0ea5e933", borderRadius: 8, padding: "10px 14px", color: "#7dd3fc", fontSize: 13 }}>
              💡 <strong>Model Answer:</strong> {fb.model_answer}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── MAIN INTERVIEW SCREEN ────────────────────────────────────────────────────
export default function InterviewScreen({ company, role, onBack, onDone }) {
  const [phase, setPhase]       = useState("setup");   // setup | active | review
  const [session, setSession]   = useState(null);
  const [questions, setQuestions] = useState([]);
  const [qIndex, setQIndex]     = useState(0);
  const [feedbacks, setFeedbacks] = useState([]);
  const [answer, setAnswer]     = useState("");
  const [loading, setLoading]   = useState(false);
  const [resumeText, setResumeText] = useState("");
  const [inputMode, setInputMode] = useState("text"); // "text" | "voice"
  const [result, setResult]     = useState(null);

  // Voice recording state
  const [recording, setRecording]   = useState(false);
  const [audioBlob, setAudioBlob]   = useState(null);
  const [analyser, setAnalyser]     = useState(null);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);

  // ── Start session ────────────────────────────────────────────────────────
  async function startInterview() {
    setLoading(true);
    try {
      const data = await interviewAPI.start(company.id, role, resumeText);
      setSession(data);
      setQuestions(data.questions);
      setPhase("active");
    } catch (err) {
      alert("Failed to start: " + err.message + "\n\nMake sure the FastAPI backend + Ollama are running.");
      // Dev fallback — use mock questions
      const mock = {
        session_id: "mock-session",
        questions: [
          `Tell me about yourself and why you want to join ${company.name}.`,
          `What is your strongest technical skill? Give an example of using it.`,
          `Describe a challenging project. What was your role and impact?`,
          `How do you approach debugging a complex production issue?`,
          `Where do you see yourself in 5 years within the tech industry?`,
        ]
      };
      setSession(mock);
      setQuestions(mock.questions);
      setPhase("active");
    } finally {
      setLoading(false);
    }
  }

  // ── Submit text answer ───────────────────────────────────────────────────
  async function submitAnswer() {
    if (!answer.trim()) return;
    setLoading(true);
    try {
      const fb = await interviewAPI.submitTextAnswer(session.session_id, qIndex, answer);
      const combined = { ...fb, question: questions[qIndex], answer };
      setFeedbacks(prev => [...prev, combined]);
      nextQuestion(combined);
    } catch {
      // Dev fallback feedback
      const mock = {
        question: questions[qIndex], answer,
        score: Math.floor(Math.random() * 4) + 5,
        strengths: ["Clear communication", "Relevant example provided"],
        improvements: ["Add more technical depth", "Quantify your impact"],
        model_answer: "A strong answer would include specific metrics and outcomes."
      };
      setFeedbacks(prev => [...prev, mock]);
      nextQuestion(mock);
    } finally {
      setLoading(false);
      setAnswer("");
      setAudioBlob(null);
    }
  }

  // ── Submit voice answer ──────────────────────────────────────────────────
  async function submitVoiceAnswer() {
    if (!audioBlob) return;
    setLoading(true);
    try {
      const fb = await interviewAPI.submitVoiceAnswer(session.session_id, qIndex, audioBlob);
      const combined = { ...fb, question: questions[qIndex] };
      setFeedbacks(prev => [...prev, combined]);
      nextQuestion(combined);
    } catch {
      const mock = {
        question: questions[qIndex],
        score: Math.floor(Math.random() * 4) + 5,
        strengths: ["Good attempt", "Spoke clearly"],
        improvements: ["Be more specific", "Add structure to your answer"],
        model_answer: "A strong answer would follow the STAR method."
      };
      setFeedbacks(prev => [...prev, mock]);
      nextQuestion(mock);
    } finally {
      setLoading(false);
      setAudioBlob(null);
    }
  }

  function nextQuestion(fb) {
    if (qIndex >= questions.length - 1) {
      finishInterview([...feedbacks, fb]);
    } else {
      setQIndex(i => i + 1);
      setAnswer("");
    }
  }

  async function finishInterview(allFeedback) {
    const avg = allFeedback.reduce((s, f) => s + (f.score || 0), 0) / allFeedback.length;
    setResult({ overall: avg.toFixed(1), feedbacks: allFeedback });
    setPhase("review");
    try {
      if (session?.session_id !== "mock-session")
        await interviewAPI.complete(session.session_id);
    } catch (_) {}
  }

  // ── Voice recording ──────────────────────────────────────────────────────
  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const ctx    = new AudioContext();
    const src    = ctx.createMediaStreamSource(stream);
    const anal   = ctx.createAnalyser();
    anal.fftSize = 512;
    src.connect(anal);
    setAnalyser(anal);

    chunksRef.current = [];
    const mr = new MediaRecorder(stream);
    mr.ondataavailable = e => chunksRef.current.push(e.data);
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      setAudioBlob(blob);
      stream.getTracks().forEach(t => t.stop());
    };
    mr.start();
    mediaRef.current = mr;
    setRecording(true);
  }

  function stopRecording() {
    mediaRef.current?.stop();
    setRecording(false);
    setAnalyser(null);
  }

  // ── PHASE: SETUP ────────────────────────────────────────────────────────
  if (phase === "setup") return (
    <div style={{ minHeight: "100vh", background: "#0a0f1e", color: "#e8eaf6", fontFamily: "'DM Sans',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ maxWidth: 520, width: "100%" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 14, marginBottom: 28, display: "flex", alignItems: "center", gap: 6 }}>← Back</button>

        <div style={{ background: "#0d1520", border: "1px solid #1e293b", borderRadius: 20, padding: "40px" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>{company.logo}</div>
          <h2 style={{ fontSize: 26, fontWeight: 800, margin: "0 0 6px" }}>{company.name} Interview</h2>
          <p style={{ color: "#64748b", margin: "0 0 32px", fontSize: 14 }}>Role: <strong style={{ color: "#94a3b8" }}>{role}</strong></p>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
              Paste your Resume / Bio (optional — for personalised questions)
            </label>
            <textarea
              value={resumeText} onChange={e => setResumeText(e.target.value)}
              placeholder="Paste your resume text here for AI-personalized questions..."
              rows={5}
              style={{ width: "100%", padding: "12px 16px", background: "#111827", border: "1px solid #1e293b", borderRadius: 10, color: "#e2e8f0", fontSize: 13, outline: "none", resize: "vertical", fontFamily: "'DM Sans',sans-serif", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ background: "#111827", borderRadius: 10, padding: "14px 18px", marginBottom: 28 }}>
            {["5 AI-generated questions", "30 minutes estimated", "Text or voice answers", "Instant AI feedback per answer"].map(r => (
              <div key={r} style={{ color: "#64748b", fontSize: 13, padding: "3px 0" }}>✓ {r}</div>
            ))}
          </div>

          <button onClick={startInterview} disabled={loading}
            style={{ width: "100%", padding: "14px", background: `linear-gradient(135deg, ${company.color}, ${company.color}bb)`, color: "#fff", border: "none", borderRadius: 10, fontWeight: 800, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'DM Sans',sans-serif" }}>
            {loading ? "Generating Questions…" : "Start AI Interview →"}
          </button>
        </div>
      </div>
    </div>
  );

  // ── PHASE: ACTIVE ────────────────────────────────────────────────────────
  if (phase === "active") {
    const progress = ((qIndex) / questions.length) * 100;
    return (
      <div style={{ minHeight: "100vh", background: "#0a0f1e", color: "#e8eaf6", fontFamily: "'DM Sans',sans-serif" }}>

        {/* TOP BAR */}
        <div style={{ background: "#0d1520", borderBottom: "1px solid #1e293b", padding: "14px 32px", display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 20 }}>{company.logo}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{company.name} — {role} Interview</div>
            <div style={{ height: 4, background: "#1e293b", borderRadius: 2, marginTop: 6, maxWidth: 200 }}>
              <div style={{ height: "100%", width: `${progress}%`, background: company.color, borderRadius: 2, transition: "width 0.4s" }} />
            </div>
          </div>
          <span style={{ color: "#475569", fontSize: 13 }}>Question {qIndex + 1} of {questions.length}</span>
        </div>

        <div style={{ maxWidth: 860, margin: "0 auto", padding: "36px 24px", display: "grid", gridTemplateColumns: "1fr 300px", gap: 24 }}>

          {/* QUESTION + ANSWER */}
          <div>
            {/* Question bubble */}
            <div style={{ display: "flex", gap: 14, marginBottom: 28 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, #3b82f6, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🤖</div>
              <div style={{ background: "#111827", border: "1px solid #1e293b", borderRadius: "4px 16px 16px 16px", padding: "18px 22px", flex: 1 }}>
                <div style={{ color: "#64748b", fontSize: 12, marginBottom: 8 }}>Interviewer</div>
                <p style={{ color: "#f1f5f9", fontSize: 16, lineHeight: 1.7, margin: 0, fontWeight: 500 }}>{questions[qIndex]}</p>
              </div>
            </div>

            {/* Input mode toggle */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {[["text", "⌨️ Text"], ["voice", "🎤 Voice"]].map(([m, label]) => (
                <button key={m} onClick={() => setInputMode(m)}
                  style={{ padding: "7px 18px", borderRadius: 8, border: `1px solid ${inputMode === m ? company.color : "#1e293b"}`, background: inputMode === m ? company.color + "22" : "transparent", color: inputMode === m ? company.color : "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  {label}
                </button>
              ))}
            </div>

            {inputMode === "text" ? (
              <>
                <div style={{ display: "flex", gap: 14, marginBottom: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#1e293b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>👤</div>
                  <textarea
                    value={answer} onChange={e => setAnswer(e.target.value)}
                    placeholder="Type your answer here… Be specific, use examples."
                    rows={6}
                    style={{ flex: 1, padding: "14px 18px", background: "#111827", border: "1px solid #1e293b", borderRadius: "4px 16px 16px 16px", color: "#e2e8f0", fontSize: 14, outline: "none", resize: "vertical", fontFamily: "'DM Sans',sans-serif", lineHeight: 1.7 }}
                  />
                </div>
                <button onClick={submitAnswer} disabled={loading || !answer.trim()}
                  style={{ width: "100%", padding: "13px", background: loading || !answer.trim() ? "#111827" : `linear-gradient(135deg, ${company.color}, ${company.color}bb)`, color: loading || !answer.trim() ? "#334155" : "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: loading || !answer.trim() ? "not-allowed" : "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                  {loading ? "Evaluating with AI…" : qIndex === questions.length - 1 ? "Submit & Finish →" : "Submit Answer →"}
                </button>
              </>
            ) : (
              // VOICE INPUT
              <div style={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 14, padding: "28px", textAlign: "center" }}>
                {recording ? (
                  <>
                    <div style={{ color: "#ef4444", fontSize: 13, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444", display: "inline-block", animation: "pulse 1s infinite" }} />
                      Recording…
                    </div>
                    <Waveform analyser={analyser} active={recording} />
                    <button onClick={stopRecording}
                      style={{ marginTop: 20, padding: "10px 28px", background: "#ef444422", border: "1px solid #ef4444", color: "#ef4444", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 14 }}>
                      ⏹ Stop Recording
                    </button>
                  </>
                ) : audioBlob ? (
                  <>
                    <p style={{ color: "#22c55e", marginBottom: 16 }}>✅ Recording captured</p>
                    <audio controls src={URL.createObjectURL(audioBlob)} style={{ width: "100%", marginBottom: 16 }} />
                    <div style={{ display: "flex", gap: 10 }}>
                      <button onClick={() => setAudioBlob(null)} style={{ flex: 1, padding: "10px", background: "transparent", border: "1px solid #1e293b", color: "#94a3b8", borderRadius: 8, cursor: "pointer" }}>🔄 Re-record</button>
                      <button onClick={submitVoiceAnswer} disabled={loading}
                        style={{ flex: 2, padding: "10px", background: `linear-gradient(135deg, ${company.color}, ${company.color}bb)`, color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 14 }}>
                        {loading ? "Transcribing…" : "Submit Voice Answer →"}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 52, marginBottom: 16 }}>🎤</div>
                    <p style={{ color: "#64748b", fontSize: 14, marginBottom: 20 }}>Click below to start recording your answer</p>
                    <button onClick={startRecording}
                      style={{ padding: "12px 32px", background: `linear-gradient(135deg, ${company.color}, ${company.color}bb)`, color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                      🎙 Start Recording
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* SIDEBAR — previous feedback */}
          <div>
            <div style={{ color: "#475569", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>Previous Answers</div>
            {feedbacks.length === 0
              ? <div style={{ color: "#334155", fontSize: 13, textAlign: "center", padding: "32px 0" }}>No answers yet</div>
              : feedbacks.map((fb, i) => <FeedbackCard key={i} fb={fb} qNum={i + 1} />)
            }
          </div>
        </div>
      </div>
    );
  }

  // ── PHASE: REVIEW ───────────────────────────────────────────────────────
  const overall = parseFloat(result?.overall || 0);
  const grade   = overall >= 8 ? { label: "Excellent", color: "#22c55e" }
                : overall >= 6 ? { label: "Good",      color: "#0ea5e9" }
                : overall >= 4 ? { label: "Average",   color: "#f59e0b" }
                :                { label: "Needs Work", color: "#ef4444" };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0f1e", fontFamily: "'DM Sans',sans-serif", padding: "40px 24px" }}>
      <div style={{ maxWidth: 700, margin: "0 auto" }}>

        {/* Score summary */}
        <div style={{ background: `linear-gradient(135deg, ${grade.color}18, #0d1520)`, border: `1px solid ${grade.color}44`, borderRadius: 20, padding: "40px", textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>{company.logo}</div>
          <h2 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 800 }}>{company.name} Interview Complete!</h2>
          <p style={{ color: "#64748b", margin: "0 0 24px" }}>Role: {role}</p>

          <div style={{ display: "inline-block" }}>
            <ScoreRing score={parseFloat(overall)} size={100} />
          </div>
          <div style={{ marginTop: 12 }}>
            <span style={{ background: grade.color + "22", color: grade.color, border: `1px solid ${grade.color}55`, borderRadius: 20, padding: "4px 16px", fontSize: 13, fontWeight: 700 }}>{grade.label}</span>
          </div>
          <p style={{ color: "#94a3b8", marginTop: 12, fontSize: 15 }}>Overall Score: {overall} / 10</p>

          <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 20 }}>
            <button onClick={() => { setPhase("setup"); setFeedbacks([]); setQIndex(0); setResult(null); }}
              style={{ padding: "10px 24px", background: `${company.color}22`, border: `1px solid ${company.color}55`, color: company.color, borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
              🔄 Retry
            </button>
            <button onClick={onDone}
              style={{ padding: "10px 24px", background: "#111827", border: "1px solid #1e293b", color: "#94a3b8", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
              🏠 Home
            </button>
          </div>
        </div>

        {/* Detailed feedback */}
        <div style={{ color: "#475569", fontSize: 11, textTransform: "uppercase", letterSpacing: 2, marginBottom: 14 }}>Detailed Feedback</div>
        {(result?.feedbacks || []).map((fb, i) => (
          <FeedbackCard key={i} fb={fb} qNum={i + 1} />
        ))}
      </div>
    </div>
  );
}
