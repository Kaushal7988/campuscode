import { useState, useEffect } from "react";
import { analyticsAPI } from "./api";

// ── Mini bar chart (pure SVG) ─────────────────────────────────────────────────
function BarChart({ data, color = "#3b82f6", height = 120 }) {
  if (!data?.length) return <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center", color: "#334155", fontSize: 13 }}>No data yet</div>;
  const max = Math.max(...data.map(d => d.value), 1);
  const w   = 100 / data.length;
  return (
    <div style={{ height, display: "flex", alignItems: "flex-end", gap: 4, padding: "0 4px" }}>
      {data.map((d, i) => {
        const pct = (d.value / max) * 100;
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%", justifyContent: "flex-end" }}>
            <span style={{ fontSize: 10, color: "#475569" }}>{d.value}%</span>
            <div style={{ width: "100%", height: `${Math.max(pct, 4)}%`, background: `linear-gradient(180deg, ${color}, ${color}88)`, borderRadius: "4px 4px 0 0", transition: "height 0.6s ease", minHeight: 4 }} />
            <span style={{ fontSize: 9, color: "#475569", textAlign: "center", maxWidth: 40, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Donut chart (SVG) ─────────────────────────────────────────────────────────
function Donut({ segments, size = 100 }) {
  const r = size / 2 - 12;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1e293b" strokeWidth={10} />
      {segments.map((s, i) => {
        const dash = (s.pct / 100) * circ;
        const el = (
          <circle key={i} cx={size/2} cy={size/2} r={r} fill="none"
            stroke={s.color} strokeWidth={10}
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={-offset}
            strokeLinecap="butt" />
        );
        offset += dash;
        return el;
      })}
    </svg>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color = "#3b82f6" }) {
  return (
    <div style={{ background: "#0d1520", border: "1px solid #1e293b", borderRadius: 14, padding: "22px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
        <span style={{ background: color + "22", color, border: `1px solid ${color}44`, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>LIVE</span>
      </div>
      <div style={{ fontSize: 32, fontWeight: 900, color: "#f1f5f9", lineHeight: 1 }}>{value}</div>
      <div style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>{label}</div>
      {sub && <div style={{ color: color, fontSize: 12, marginTop: 8, fontWeight: 600 }}>{sub}</div>}
    </div>
  );
}

// ── Progress bar ──────────────────────────────────────────────────────────────
function ProgressRow({ label, value, max = 100, color }) {
  const pct = Math.round((value / max) * 100);
  const c   = color || (pct >= 70 ? "#22c55e" : pct >= 50 ? "#f59e0b" : "#ef4444");
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ color: "#94a3b8", fontSize: 13 }}>{label}</span>
        <span style={{ color: c, fontSize: 13, fontWeight: 700 }}>{value}%</span>
      </div>
      <div style={{ height: 6, background: "#1e293b", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${c}, ${c}88)`, borderRadius: 3, transition: "width 1s ease" }} />
      </div>
    </div>
  );
}

// ── MOCK DATA for dev when backend is offline ─────────────────────────────────
function getMockData() {
  return {
    tests: {
      total: 12,
      avg_score: 67.4,
      best_company: "tcs",
      weak_categories: ["Coding", "Quantitative"],
      trend: [
        { company: "tcs",    score: 55, date: "2024-01-10" },
        { company: "amazon", score: 62, date: "2024-01-15" },
        { company: "tcs",    score: 70, date: "2024-01-20" },
        { company: "infosys",score: 78, date: "2024-01-25" },
        { company: "amazon", score: 65, date: "2024-01-28" },
        { company: "google", score: 48, date: "2024-02-02" },
        { company: "tcs",    score: 82, date: "2024-02-05" },
      ],
      company_breakdown: [
        { company: "tcs",      avg_score: 69, tests_taken: 4, best_score: 82 },
        { company: "amazon",   avg_score: 58, tests_taken: 3, best_score: 65 },
        { company: "infosys",  avg_score: 74, tests_taken: 2, best_score: 78 },
        { company: "google",   avg_score: 48, tests_taken: 2, best_score: 52 },
        { company: "accenture",avg_score: 88, tests_taken: 1, best_score: 88 },
      ],
    },
    interviews: {
      total: 5,
      avg_score: 7.2,
      recent: [
        { company: "tcs",     role: "Software Engineer", score: 7.5, date: "2024-02-01" },
        { company: "amazon",  role: "SDE-1",             score: 6.8, date: "2024-01-28" },
        { company: "google",  role: "Software Engineer", score: 8.0, date: "2024-01-22" },
        { company: "infosys", role: "Systems Engineer",  score: 7.2, date: "2024-01-18" },
        { company: "wipro",   role: "Developer",         score: 6.5, date: "2024-01-10" },
      ],
    },
  };
}

const COMPANY_COLORS = { tcs:"#0051A2", infosys:"#007CC3", wipro:"#7B2D8B", amazon:"#FF9900", google:"#EA4335", microsoft:"#00A4EF", accenture:"#A100FF", cognizant:"#1C4DA1", default:"#6366f1" };
function ccolor(id) { return COMPANY_COLORS[id] || COMPANY_COLORS.default; }

// ── MAIN DASHBOARD ────────────────────────────────────────────────────────────
export default function AnalyticsDashboard({ user, onBack }) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]       = useState("overview"); // overview | tests | interviews

  useEffect(() => {
    analyticsAPI.dashboard()
      .then(setData)
      .catch(() => setData(getMockData()))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#0a0f1e", display: "flex", alignItems: "center", justifyContent: "center", color: "#475569", fontFamily: "'DM Sans',sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 40, height: 40, border: "3px solid #1e293b", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
        Loading your dashboard…
      </div>
    </div>
  );

  const { tests, interviews } = data;
  const trend = tests.trend || [];
  const breakdown = tests.company_breakdown || [];
  const categories = [
    { label: "Verbal",       value: tests.weak_categories?.includes("Verbal")       ? 45 : 72 },
    { label: "Quant",        value: tests.weak_categories?.includes("Quantitative") ? 52 : 68 },
    { label: "Logical",      value: tests.weak_categories?.includes("Logical")      ? 49 : 74 },
    { label: "Coding",       value: tests.weak_categories?.includes("Coding")       ? 38 : 65 },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0a0f1e", color: "#e8eaf6", fontFamily: "'DM Sans',sans-serif" }}>
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>

      {/* HEADER */}
      <div style={{ background: "#0d1520", borderBottom: "1px solid #1e293b", padding: "16px 32px", display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={onBack} style={{ background: "#111827", border: "1px solid #1e293b", color: "#94a3b8", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 13 }}>← Home</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>📊 Your Dashboard</div>
          <div style={{ color: "#475569", fontSize: 12 }}>Welcome back, {user?.name || "Student"}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {[["overview","Overview"], ["tests","Mock Tests"], ["interviews","Interviews"]].map(([t, l]) => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: "7px 16px", borderRadius: 8, border: `1px solid ${tab===t ? "#3b82f6" : "#1e293b"}`, background: tab===t ? "#3b82f622" : "transparent", color: tab===t ? "#3b82f6" : "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>

        {/* ── OVERVIEW TAB ── */}
        {tab === "overview" && (
          <>
            {/* Stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
              <StatCard icon="📝" label="Tests Taken"       value={tests.total}                                  color="#3b82f6"  sub={`Best: ${tests.best_company?.toUpperCase() || "—"}`} />
              <StatCard icon="📈" label="Avg Test Score"    value={`${tests.avg_score}%`}                        color="#10b981"  sub={tests.avg_score >= 60 ? "↑ On track" : "↓ Needs work"} />
              <StatCard icon="🎤" label="AI Interviews"     value={interviews.total}                             color="#f59e0b"  sub={`Avg: ${interviews.avg_score}/10`} />
              <StatCard icon="⚠️" label="Weak Areas"        value={tests.weak_categories?.length || 0}           color="#ef4444"  sub={(tests.weak_categories || []).join(", ") || "None!"} />
            </div>

            {/* Score trend + Category breakdown */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>

              {/* Trend */}
              <div style={{ background: "#0d1520", border: "1px solid #1e293b", borderRadius: 14, padding: "24px" }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>📈 Score Trend</div>
                <div style={{ color: "#475569", fontSize: 12, marginBottom: 20 }}>Last {trend.length} tests</div>
                <BarChart
                  data={trend.map(t => ({ label: t.company?.slice(0,4).toUpperCase(), value: t.score }))}
                  color="#3b82f6"
                  height={140}
                />
              </div>

              {/* Category scores */}
              <div style={{ background: "#0d1520", border: "1px solid #1e293b", borderRadius: 14, padding: "24px" }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>🎯 Category Performance</div>
                <div style={{ color: "#475569", fontSize: 12, marginBottom: 20 }}>Average across all tests</div>
                {categories.map(c => <ProgressRow key={c.label} label={c.label} value={c.value} />)}
              </div>
            </div>

            {/* Company breakdown */}
            <div style={{ background: "#0d1520", border: "1px solid #1e293b", borderRadius: 14, padding: "24px" }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 20 }}>🏢 Company Breakdown</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14 }}>
                {breakdown.map(b => {
                  const c = ccolor(b.company);
                  return (
                    <div key={b.company} style={{ background: "#111827", border: `1px solid ${c}33`, borderRadius: 12, padding: "18px" }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#f1f5f9", textTransform: "capitalize", marginBottom: 12 }}>{b.company}</div>
                      <div style={{ fontSize: 28, fontWeight: 900, color: c }}>{b.avg_score}%</div>
                      <div style={{ color: "#475569", fontSize: 12 }}>avg score</div>
                      <div style={{ height: 4, background: "#1e293b", borderRadius: 2, marginTop: 10 }}>
                        <div style={{ height: "100%", width: `${b.avg_score}%`, background: c, borderRadius: 2 }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                        <span style={{ color: "#475569", fontSize: 11 }}>{b.tests_taken} tests</span>
                        <span style={{ color: "#22c55e", fontSize: 11 }}>Best: {b.best_score}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* ── TESTS TAB ── */}
        {tab === "tests" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
              <div style={{ background: "#0d1520", border: "1px solid #1e293b", borderRadius: 14, padding: "24px" }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 20 }}>📊 Score Distribution</div>
                <BarChart data={trend.map(t => ({ label: t.company?.slice(0,4), value: t.score }))} color="#3b82f6" height={160} />
              </div>
              <div style={{ background: "#0d1520", border: "1px solid #1e293b", borderRadius: 14, padding: "24px" }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 20 }}>🎯 Category Mastery</div>
                {categories.map(c => <ProgressRow key={c.label} label={c.label} value={c.value} max={100} />)}
              </div>
            </div>

            <div style={{ background: "#0d1520", border: "1px solid #1e293b", borderRadius: 14, padding: "24px" }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>🕒 Recent Test History</div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Company","Test","Score","Date"].map(h => (
                      <th key={h} style={{ textAlign: "left", color: "#475569", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, padding: "0 0 14px", borderBottom: "1px solid #1e293b" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {trend.map((t, i) => {
                    const c = ccolor(t.company);
                    return (
                      <tr key={i} style={{ borderBottom: "1px solid #0d1520" }}>
                        <td style={{ padding: "12px 0", color: c, fontWeight: 700, textTransform: "capitalize" }}>{t.company}</td>
                        <td style={{ padding: "12px 0", color: "#94a3b8", fontSize: 13 }}>{t.test_id || "Mixed"}</td>
                        <td style={{ padding: "12px 0" }}>
                          <span style={{ background: (t.score>=70?"#22c55e":t.score>=50?"#f59e0b":"#ef4444") + "22", color: t.score>=70?"#22c55e":t.score>=50?"#f59e0b":"#ef4444", borderRadius: 6, padding: "2px 10px", fontSize: 13, fontWeight: 700 }}>
                            {t.score}%
                          </span>
                        </td>
                        <td style={{ padding: "12px 0", color: "#475569", fontSize: 13 }}>{t.date?.slice(0,10)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── INTERVIEWS TAB ── */}
        {tab === "interviews" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
              <StatCard icon="🎤" label="Total Interviews" value={interviews.total}          color="#f59e0b" />
              <StatCard icon="⭐" label="Avg Score"        value={`${interviews.avg_score}/10`} color="#10b981" />
              <StatCard icon="🏆" label="Best Score"       value={`${Math.max(...(interviews.recent||[]).map(r=>r.score||0),0)}/10`} color="#6366f1" />
            </div>

            <div style={{ background: "#0d1520", border: "1px solid #1e293b", borderRadius: 14, padding: "24px" }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>🕒 Interview History</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {(interviews.recent || []).map((r, i) => {
                  const c    = ccolor(r.company);
                  const score = parseFloat(r.score||0);
                  const sc   = score>=7?"#22c55e":score>=5?"#f59e0b":"#ef4444";
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, background: "#111827", border: "1px solid #1e293b", borderRadius: 12, padding: "16px 20px" }}>
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: c + "22", border: `1px solid ${c}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🎤</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: "#f1f5f9", fontSize: 14, textTransform: "capitalize" }}>{r.company} — {r.role}</div>
                        <div style={{ color: "#475569", fontSize: 12 }}>{r.date?.slice(0,10)}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 22, fontWeight: 900, color: sc }}>{r.score}</div>
                        <div style={{ color: "#475569", fontSize: 11 }}>/ 10</div>
                      </div>
                    </div>
                  );
                })}
                {!interviews.recent?.length && (
                  <div style={{ textAlign: "center", color: "#334155", padding: "40px", fontSize: 14 }}>No interviews yet. Start your first AI interview!</div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
