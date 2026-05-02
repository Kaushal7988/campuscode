import { useState, useEffect } from "react";
import AuthScreen          from "./AuthScreen";
import { HomeScreen, CompanyScreen, TestScreen, ResultsScreen } from "./MockTestPlatformScreens";
import InterviewScreen     from "./InterviewScreen";
import AnalyticsDashboard  from "./AnalyticsDashboard";

const ROLES = [
  "Software Engineer","Frontend Developer","Backend Developer",
  "Full Stack Developer","Data Analyst","Data Scientist",
  "DevOps Engineer","QA Engineer","Product Manager","Business Analyst",
];

function RoleModal({ company, onSelect, onClose }) {
  const [custom, setCustom] = useState("");
  return (
    <div style={{ position:"fixed",inset:0,background:"#000000cc",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:24 }}>
      <div style={{ background:"#0d1520",border:"1px solid #1e293b",borderRadius:20,padding:"36px",maxWidth:480,width:"100%" }}>
        <h3 style={{ fontSize:20,fontWeight:800,color:"#f1f5f9",margin:"0 0 4px" }}>{company.logo} {company.name} AI Interview</h3>
        <p style={{ color:"#475569",margin:"0 0 22px",fontSize:14 }}>Select the role you're interviewing for</p>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16 }}>
          {ROLES.map(r=>(
            <button key={r} onClick={()=>onSelect(r)}
              style={{ padding:"9px 12px",background:"#111827",border:"1px solid #1e293b",borderRadius:8,color:"#94a3b8",fontSize:13,cursor:"pointer",textAlign:"left",fontFamily:"'DM Sans',sans-serif",transition:"all 0.15s" }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=company.color;e.currentTarget.style.color="#f1f5f9";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="#1e293b";e.currentTarget.style.color="#94a3b8";}}>
              {r}
            </button>
          ))}
        </div>
        <div style={{ display:"flex",gap:8 }}>
          <input value={custom} onChange={e=>setCustom(e.target.value)} placeholder="Or type a custom role…"
            style={{ flex:1,padding:"10px 14px",background:"#111827",border:"1px solid #1e293b",borderRadius:8,color:"#e2e8f0",fontSize:13,outline:"none",fontFamily:"'DM Sans',sans-serif" }}
            onKeyDown={e=>e.key==="Enter"&&custom.trim()&&onSelect(custom.trim())} />
          <button onClick={()=>custom.trim()&&onSelect(custom.trim())}
            style={{ padding:"10px 18px",background:company.color,color:"#fff",border:"none",borderRadius:8,fontWeight:700,cursor:"pointer",fontSize:13 }}>Go →</button>
        </div>
        <button onClick={onClose} style={{ width:"100%",marginTop:14,background:"none",border:"none",color:"#334155",cursor:"pointer",fontSize:13 }}>Cancel</button>
      </div>
    </div>
  );
}

function TopNav({ user, active, onNav, onLogout }) {
  return (
    <div style={{ background:"#080d19",borderBottom:"1px solid #0f1f38",padding:"0 32px",display:"flex",alignItems:"center",height:54,position:"sticky",top:0,zIndex:200,fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ display:"flex",alignItems:"center",gap:10,marginRight:32 }}>
        <div style={{ width:30,height:30,borderRadius:8,background:"linear-gradient(135deg,#3b82f6,#6366f1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14 }}>⚡</div>
        <span style={{ fontFamily:"'DM Serif Display',serif",fontSize:18,color:"#f1f5f9" }}>CampusCode</span>
      </div>
      {[["home","🏠 Home"],["dashboard","📊 Dashboard"]].map(([id,label])=>(
        <button key={id} onClick={()=>onNav(id)}
          style={{ padding:"0 18px",height:"100%",background:"none",border:"none",borderBottom:`2px solid ${active===id?"#3b82f6":"transparent"}`,color:active===id?"#3b82f6":"#475569",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:"color 0.2s" }}>
          {label}
        </button>
      ))}
      <div style={{ flex:1 }} />
      <div style={{ display:"flex",alignItems:"center",gap:12 }}>
        <div style={{ width:30,height:30,borderRadius:"50%",background:"linear-gradient(135deg,#3b82f6,#6366f1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:"#fff",fontWeight:700 }}>
          {user?.name?.[0]?.toUpperCase()||"U"}
        </div>
        <span style={{ color:"#94a3b8",fontSize:13 }}>{user?.name}</span>
        <button onClick={onLogout} style={{ background:"#111827",border:"1px solid #1e293b",color:"#64748b",borderRadius:6,padding:"5px 12px",cursor:"pointer",fontSize:12 }}>Logout</button>
      </div>
    </div>
  );
}

export default function App() {
  const [user,        setUser]        = useState(null);
  const [navScreen,   setNavScreen]   = useState("home");
  const [mockScreen,  setMockScreen]  = useState("home");
  const [company,     setCompany]     = useState(null);
  const [test,        setTest]        = useState(null);
  const [result,      setResult]      = useState(null);
  const [iCompany,    setICompany]    = useState(null);
  const [iRole,       setIRole]       = useState(null);
  const [showModal,   setShowModal]   = useState(false);
  const [pendingCo,   setPendingCo]   = useState(null);

  useEffect(() => {
    const link = document.createElement("link");
    link.href  = "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Serif+Display&display=swap";
    link.rel   = "stylesheet";
    document.head.appendChild(link);
    const saved = localStorage.getItem("campuscode_user");
    const token = localStorage.getItem("campuscode_token");
    if (saved && token) { try { setUser(JSON.parse(saved)); } catch(_){} }
  }, []);

  const handleAuth    = u => setUser(u);
  const handleLogout  = () => { localStorage.removeItem("campuscode_token"); localStorage.removeItem("campuscode_user"); setUser(null); };
  const handleNav     = s => { setNavScreen(s); if (s==="home") setMockScreen("home"); };
  const openModal     = co => { setPendingCo(co); setShowModal(true); };
  const handleRole    = r  => { setShowModal(false); setICompany(pendingCo); setIRole(r); setNavScreen("interview"); };

  if (!user) return <AuthScreen onAuth={handleAuth} />;

  if (navScreen === "interview") return (
    <InterviewScreen company={iCompany} role={iRole}
      onBack={()=>setNavScreen("home")} onDone={()=>setNavScreen("home")} />
  );

  if (navScreen === "dashboard") return (
    <><TopNav user={user} active="dashboard" onNav={handleNav} onLogout={handleLogout} />
    <AnalyticsDashboard user={user} onBack={()=>handleNav("home")} /></>
  );

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif" }}>
      {showModal && pendingCo && <RoleModal company={pendingCo} onSelect={handleRole} onClose={()=>setShowModal(false)} />}
      <TopNav user={user} active="home" onNav={handleNav} onLogout={handleLogout} />

      {mockScreen==="home"    && <HomeScreen onSelect={c=>{setCompany(c);setMockScreen("company");}} />}

      {mockScreen==="company" && company && <>
        <CompanyScreen company={company} onBack={()=>setMockScreen("home")} onStart={(c,t)=>{setTest(t);setMockScreen("test");}} />
        <button onClick={()=>openModal(company)}
          style={{ position:"fixed",bottom:28,right:28,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"#fff",border:"none",borderRadius:14,padding:"13px 22px",fontWeight:800,fontSize:14,cursor:"pointer",zIndex:300,boxShadow:"0 8px 32px #6366f155",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",gap:8 }}>
          🎤 Start AI Interview
        </button>
      </>}

      {mockScreen==="test"    && test    && <TestScreen key={test.id} company={company} test={test} onSubmit={r=>{setResult(r);setMockScreen("results");}} />}
      {mockScreen==="results" && result  && <ResultsScreen data={result} onRetry={()=>setMockScreen("test")} onHome={()=>setMockScreen("home")} />}
    </div>
  );
}
