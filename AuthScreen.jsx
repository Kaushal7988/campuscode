import { useState, useEffect } from "react";
import { authAPI } from "./api";

const S = {
  page: {
    minHeight: "100vh",
    background: "#060910",
    display: "flex",
    fontFamily: "'DM Sans', sans-serif",
    overflow: "hidden",
    position: "relative",
  },
  // Left decorative panel
  panel: {
    width: "45%",
    background: "linear-gradient(160deg, #0d1f3c 0%, #060910 100%)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "60px 56px",
    position: "relative",
    overflow: "hidden",
    borderRight: "1px solid #ffffff08",
  },
  // Right form area
  form_area: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px",
  },
  card: {
    width: "100%",
    maxWidth: 420,
  },
};

function FloatingOrb({ style }) {
  return (
    <div style={{
      position: "absolute", borderRadius: "50%",
      background: "radial-gradient(circle, #1e40af33 0%, transparent 70%)",
      pointerEvents: "none", ...style
    }} />
  );
}

function Input({ label, type = "text", value, onChange, placeholder, error }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
        {label}
      </label>
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width: "100%", padding: "12px 16px", background: "#0d1520",
          border: `1.5px solid ${error ? "#ef4444" : focused ? "#3b82f6" : "#1e293b"}`,
          borderRadius: 10, color: "#f1f5f9", fontSize: 14,
          outline: "none", boxSizing: "border-box",
          transition: "border-color 0.2s",
          fontFamily: "'DM Sans', sans-serif",
        }}
      />
      {error && <p style={{ color: "#ef4444", fontSize: 12, margin: "6px 0 0" }}>{error}</p>}
    </div>
  );
}

function SubmitBtn({ loading, children, color = "#3b82f6" }) {
  return (
    <button
      type="submit"
      disabled={loading}
      style={{
        width: "100%", padding: "13px", borderRadius: 10, border: "none",
        background: loading ? "#1e293b" : `linear-gradient(135deg, ${color}, ${color}bb)`,
        color: loading ? "#475569" : "#fff", fontSize: 15, fontWeight: 700,
        cursor: loading ? "not-allowed" : "pointer",
        fontFamily: "'DM Sans', sans-serif",
        transition: "all 0.2s",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      }}
    >
      {loading ? (
        <>
          <span style={{ width: 16, height: 16, border: "2px solid #475569", borderTopColor: "#94a3b8", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
          Please wait...
        </>
      ) : children}
    </button>
  );
}

// ── LOGIN FORM ────────────────────────────────────────────────────────────────
function LoginForm({ onSuccess, onSwitch }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const data = await authAPI.login(email, password);
      localStorage.setItem("campuscode_token", data.access_token);
      localStorage.setItem("campuscode_user", JSON.stringify(data.user));
      onSuccess(data.user);
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2 style={{ fontSize: 28, fontWeight: 800, color: "#f1f5f9", margin: "0 0 6px", letterSpacing: -0.5 }}>Welcome back</h2>
      <p style={{ color: "#475569", fontSize: 14, margin: "0 0 32px" }}>Sign in to continue your prep journey</p>

      {error && (
        <div style={{ background: "#ef444418", border: "1px solid #ef444444", borderRadius: 8, padding: "10px 14px", color: "#f87171", fontSize: 13, marginBottom: 20 }}>
          ⚠️ {error}
        </div>
      )}

      <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
      <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />

      <div style={{ textAlign: "right", marginBottom: 24, marginTop: -10 }}>
        <button type="button" style={{ background: "none", border: "none", color: "#3b82f6", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
          Forgot password?
        </button>
      </div>

      <SubmitBtn loading={loading}>Sign In →</SubmitBtn>

      <p style={{ textAlign: "center", color: "#475569", fontSize: 14, margin: "24px 0 0" }}>
        New here?{" "}
        <button type="button" onClick={onSwitch} style={{ background: "none", border: "none", color: "#3b82f6", fontWeight: 700, cursor: "pointer", fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>
          Create account
        </button>
      </p>
    </form>
  );
}

// ── REGISTER FORM ─────────────────────────────────────────────────────────────
function RegisterForm({ onSuccess, onSwitch }) {
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [errors, setErrors]     = useState({});
  const [loading, setLoading]   = useState(false);

  function validate() {
    const e = {};
    if (!name.trim())          e.name     = "Name is required";
    if (!email.includes("@")) e.email    = "Enter a valid email";
    if (password.length < 6)  e.password = "Minimum 6 characters";
    if (password !== confirm)  e.confirm  = "Passwords don't match";
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }
    setErrors({}); setLoading(true);
    try {
      const data = await authAPI.register(name, email, password);
      localStorage.setItem("campuscode_token", data.access_token);
      localStorage.setItem("campuscode_user", JSON.stringify(data.user));
      onSuccess(data.user);
    } catch (err) {
      setErrors({ api: err.message || "Registration failed." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2 style={{ fontSize: 28, fontWeight: 800, color: "#f1f5f9", margin: "0 0 6px", letterSpacing: -0.5 }}>Create account</h2>
      <p style={{ color: "#475569", fontSize: 14, margin: "0 0 28px" }}>Join thousands preparing for top companies</p>

      {errors.api && (
        <div style={{ background: "#ef444418", border: "1px solid #ef444444", borderRadius: 8, padding: "10px 14px", color: "#f87171", fontSize: 13, marginBottom: 20 }}>
          ⚠️ {errors.api}
        </div>
      )}

      <Input label="Full Name" value={name} onChange={e => setName(e.target.value)} placeholder="Aman Kumar" error={errors.name} />
      <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" error={errors.email} />
      <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters" error={errors.password} />
      <Input label="Confirm Password" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Re-enter password" error={errors.confirm} />

      <SubmitBtn loading={loading} color="#10b981">Create Account →</SubmitBtn>

      <p style={{ textAlign: "center", color: "#475569", fontSize: 14, margin: "24px 0 0" }}>
        Already have an account?{" "}
        <button type="button" onClick={onSwitch} style={{ background: "none", border: "none", color: "#3b82f6", fontWeight: 700, cursor: "pointer", fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>
          Sign in
        </button>
      </p>
    </form>
  );
}

// ── MAIN AUTH SCREEN ──────────────────────────────────────────────────────────
export default function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login"); // "login" | "register"

  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Serif+Display&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    const style = document.createElement("style");
    style.textContent = `@keyframes spin { to { transform: rotate(360deg); } } @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }`;
    document.head.appendChild(style);
  }, []);

  const stats = [
    { n: "10+", label: "Companies" },
    { n: "500+", label: "Questions" },
    { n: "AI", label: "Evaluation" },
  ];

  const features = [
    { icon: "🏢", text: "Company-specific mock tests" },
    { icon: "🤖", text: "AI-powered interview simulation" },
    { icon: "🎤", text: "Voice answer + Whisper STT" },
    { icon: "📊", text: "Performance analytics dashboard" },
  ];

  return (
    <div style={S.page}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .auth-fade { animation: fadeUp 0.5s ease forwards; }
      `}</style>

      {/* ── LEFT PANEL ── */}
      <div style={S.panel}>
        <FloatingOrb style={{ width: 400, height: 400, top: -100, left: -100 }} />
        <FloatingOrb style={{ width: 300, height: 300, bottom: -50, right: -80 }} />

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 56 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, #3b82f6, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>⚡</div>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: "#f1f5f9", letterSpacing: -0.5 }}>CampusCode</span>
        </div>

        {/* Hero text */}
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 42, lineHeight: 1.15, color: "#f1f5f9", margin: "0 0 20px", letterSpacing: -1 }}>
          Land your<br />
          <span style={{ color: "#60a5fa" }}>dream job</span><br />
          with AI.
        </h1>
        <p style={{ color: "#64748b", fontSize: 15, lineHeight: 1.7, margin: "0 0 44px", maxWidth: 320 }}>
          Practice with real company-pattern tests and get instant AI feedback on every answer.
        </p>

        {/* Stats */}
        <div style={{ display: "flex", gap: 28, marginBottom: 44 }}>
          {stats.map(s => (
            <div key={s.label}>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: "#f1f5f9" }}>{s.n}</div>
              <div style={{ color: "#475569", fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Features */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {features.map(f => (
            <div key={f.text} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 16 }}>{f.icon}</span>
              <span style={{ color: "#94a3b8", fontSize: 14 }}>{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT FORM ── */}
      <div style={S.form_area}>
        <div style={S.card} className="auth-fade" key={mode}>
          {mode === "login"
            ? <LoginForm    onSuccess={onAuth} onSwitch={() => setMode("register")} />
            : <RegisterForm onSuccess={onAuth} onSwitch={() => setMode("login")} />
          }
        </div>
      </div>
    </div>
  );
}
