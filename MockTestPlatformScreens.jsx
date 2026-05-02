import { useState, useEffect, useRef } from "react";
import { testsAPI, companiesAPI } from "./api";

// ─── DATA ────────────────────────────────────────────────────────────────────

export const COMPANIES = [
  { id: "tcs",       name: "TCS",        logo: "🔷", color: "#0051A2", tag: "IT Services",      tests: 4, difficulty: "Medium" },
  { id: "infosys",   name: "Infosys",    logo: "🟦", color: "#007CC3", tag: "IT Consulting",    tests: 3, difficulty: "Medium" },
  { id: "wipro",     name: "Wipro",      logo: "🟣", color: "#7B2D8B", tag: "Technology",       tests: 3, difficulty: "Easy"   },
  { id: "amazon",    name: "Amazon",     logo: "🟠", color: "#FF9900", tag: "E-Commerce/Cloud", tests: 5, difficulty: "Hard"   },
  { id: "google",    name: "Google",     logo: "🔴", color: "#EA4335", tag: "Tech Giant",       tests: 5, difficulty: "Hard"   },
  { id: "microsoft", name: "Microsoft",  logo: "🪟", color: "#00A4EF", tag: "Software/Cloud",   tests: 4, difficulty: "Hard"   },
  { id: "accenture", name: "Accenture",  logo: "🟪", color: "#A100FF", tag: "Consulting",       tests: 3, difficulty: "Easy"   },
  { id: "cognizant", name: "Cognizant",  logo: "🔵", color: "#1C4DA1", tag: "IT Services",      tests: 3, difficulty: "Medium" },
  { id: "hcl",       name: "HCL",        logo: "🟩", color: "#009943", tag: "IT Services",      tests: 3, difficulty: "Easy"   },
  { id: "capgemini", name: "Capgemini",  logo: "🟤", color: "#0070AD", tag: "Consulting",       tests: 3, difficulty: "Medium" },
];

const TESTS_BY_COMPANY = {
  tcs: [
    { id:"tcs-verbal",  company_id:"tcs", name:"Verbal Ability",       category:"Verbal",   icon:"📝", desc:"English comprehension, grammar, vocabulary",     questions:10, time:600,  difficulty:"Medium" },
    { id:"tcs-quant",   company_id:"tcs", name:"Quantitative Aptitude",category:"Quant",    icon:"🔢", desc:"Arithmetic, algebra, data interpretation",        questions:10, time:600,  difficulty:"Medium" },
    { id:"tcs-logical", company_id:"tcs", name:"Logical Reasoning",    category:"Logical",  icon:"🧠", desc:"Patterns, sequences, critical thinking",          questions:10, time:600,  difficulty:"Medium" },
    { id:"tcs-coding",  company_id:"tcs", name:"Coding Round",         category:"Coding",   icon:"💻", desc:"Data structures, algorithms, problem solving",    questions:5,  time:900,  difficulty:"Hard"   },
  ],
  amazon: [
    { id:"amz-verbal",  company_id:"amazon", name:"Verbal Ability",       icon:"📝", desc:"English comprehension & grammar",      questions:10, time:600,  difficulty:"Medium" },
    { id:"amz-quant",   company_id:"amazon", name:"Quantitative Aptitude",icon:"🔢", desc:"Math & analytical reasoning",           questions:10, time:600,  difficulty:"Hard"   },
    { id:"amz-logical", company_id:"amazon", name:"Logical Reasoning",    icon:"🧠", desc:"Critical thinking & patterns",         questions:10, time:600,  difficulty:"Hard"   },
    { id:"amz-coding",  company_id:"amazon", name:"Coding Round",         icon:"💻", desc:"OOP, DSA & system design basics",      questions:5,  time:900,  difficulty:"Hard"   },
    { id:"amz-lp",      company_id:"amazon", name:"Leadership Principles",icon:"🏆", desc:"Amazon-specific behavioral questions", questions:10, time:600,  difficulty:"Medium" },
  ],
};

function defaultTests(id) {
  return [
    { id:`${id}-verbal`,  company_id:id, name:"Verbal Ability",       icon:"📝", desc:"English comprehension & grammar",     questions:10, time:600, difficulty:"Medium" },
    { id:`${id}-quant`,   company_id:id, name:"Quantitative Aptitude",icon:"🔢", desc:"Arithmetic & data interpretation",    questions:10, time:600, difficulty:"Medium" },
    { id:`${id}-logical`, company_id:id, name:"Logical Reasoning",    icon:"🧠", desc:"Patterns, sequences, reasoning",      questions:10, time:600, difficulty:"Medium" },
  ];
}

const SAMPLE_QUESTIONS = [
  { id:"q1", question:"A train travels 360 km in 4 hours. Average speed?",            options:["80 km/h","90 km/h","100 km/h","110 km/h"], correct:1, explanation:"Speed = 360/4 = 90 km/h" },
  { id:"q2", question:"Word most similar to 'ELOQUENT':",                              options:["Silent","Fluent","Confused","Rude"],          correct:1, explanation:"Eloquent = fluent/persuasive." },
  { id:"q3", question:"Data structure using LIFO:",                                    options:["Queue","Array","Stack","Linked List"],         correct:2, explanation:"Stack uses LIFO." },
  { id:"q4", question:"Next in series: 2, 6, 12, 20, 30, ?",                          options:["40","42","44","46"],                           correct:1, explanation:"Diff: 4,6,8,10,12 → 42" },
  { id:"q5", question:"Time complexity of binary search:",                             options:["O(n)","O(n²)","O(log n)","O(1)"],              correct:2, explanation:"Halves space each step." },
  { id:"q6", question:"20% discount on ₹500. Selling price?",                         options:["₹350","₹380","₹400","₹420"],                   correct:2, explanation:"500 − 100 = ₹400" },
  { id:"q7", question:"NOT a valid JavaScript data type:",                             options:["undefined","boolean","character","symbol"],    correct:2, explanation:"No 'character' in JS." },
  { id:"q8", question:"HTTP stands for:",                                              options:["HyperText Transfer Protocol","High Tech...","HyperText Transmission","High Text..."], correct:0, explanation:"HyperText Transfer Protocol." },
  { id:"q9", question:"P is 60% of Q. Q is what % of P?",                             options:["150%","166.67%","140%","180%"],                 correct:1, explanation:"Q = P/0.6 ≈ 166.67%" },
  { id:"q10", question:"Sort with best average time complexity:",                      options:["Bubble","Selection","Merge","Insertion"],       correct:2, explanation:"Merge Sort: O(n log n)." },
];

// ─── SHARED UI ────────────────────────────────────────────────────────────────

function Badge({ children, color="#6ee7b7" }) {
  return <span style={{ background:color+"22", color, border:`1px solid ${color}55`, borderRadius:6, padding:"2px 10px", fontSize:11, fontWeight:700, letterSpacing:1, textTransform:"uppercase" }}>{children}</span>;
}
function DiffBadge({ d }) {
  const m = { Easy:"#22c55e", Medium:"#f59e0b", Hard:"#ef4444" };
  return <Badge color={m[d]||"#6ee7b7"}>{d}</Badge>;
}

function useTimer(seconds, onEnd) {
  const [remaining, setRemaining] = useState(seconds);
  const ref = useRef(null);
  useEffect(() => {
    ref.current = setInterval(() => {
      setRemaining(prev => {
        if (prev<=1) { clearInterval(ref.current); onEnd(); return 0; }
        return prev-1;
      });
    }, 1000);
    return () => clearInterval(ref.current);
  }, []);
  const pct  = (remaining/seconds)*100;
  const mins = String(Math.floor(remaining/60)).padStart(2,"0");
  const secs = String(remaining%60).padStart(2,"0");
  return { remaining, pct, display:`${mins}:${secs}` };
}

// ─── HOME SCREEN ─────────────────────────────────────────────────────────────

export function HomeScreen({ onSelect }) {
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState("All");
  const [hovered, setHovered] = useState(null);
  const [companies, setCompanies] = useState(COMPANIES);

  useEffect(() => {
    companiesAPI.list().then(setCompanies).catch(() => setCompanies(COMPANIES));
  }, []);

  const filtered = companies.filter(c =>
    (filter==="All" || c.difficulty===filter) &&
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight:"100vh", background:"#0a0f1e", color:"#e8eaf6", fontFamily:"'DM Sans',sans-serif" }}>
      {/* Hero */}
      <div style={{ background:"linear-gradient(135deg,#0d1b3e 0%,#0a0f1e 60%)", padding:"48px 40px 36px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-80, right:-80, width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle,#1a3a6e44 0%,transparent 70%)", pointerEvents:"none" }} />
        <div style={{ maxWidth:900, margin:"0 auto", position:"relative" }}>
          <h1 style={{ fontSize:44, fontWeight:900, lineHeight:1.1, margin:"0 0 14px", letterSpacing:-2 }}>
            Company Mock Tests<br/>
            <span style={{ background:"linear-gradient(90deg,#0ea5e9,#818cf8)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Crack Every Round</span>
          </h1>
          <p style={{ color:"#94a3b8", fontSize:15, marginBottom:28, maxWidth:500 }}>
            Practice with real company-pattern tests. AI-evaluated interviews. Instant feedback.
          </p>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            {["500+ Questions","10+ Companies","AI Evaluation","Voice Interviews"].map(t=>(
              <div key={t} style={{ background:"#ffffff0d", border:"1px solid #ffffff1a", borderRadius:20, padding:"5px 14px", fontSize:13, color:"#cbd5e1" }}>✓ {t}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ maxWidth:900, margin:"0 auto", padding:"28px 40px 0" }}>
        <div style={{ display:"flex", gap:12, alignItems:"center", flexWrap:"wrap", marginBottom:20 }}>
          <div style={{ flex:1, minWidth:220, position:"relative" }}>
            <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", fontSize:14, color:"#475569" }}>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search company…"
              style={{ width:"100%", padding:"10px 14px 10px 40px", background:"#111827", border:"1px solid #1e293b", borderRadius:10, color:"#e2e8f0", fontSize:14, outline:"none", boxSizing:"border-box", fontFamily:"'DM Sans',sans-serif" }} />
          </div>
          <div style={{ display:"flex", gap:6 }}>
            {["All","Easy","Medium","Hard"].map(d=>(
              <button key={d} onClick={()=>setFilter(d)}
                style={{ padding:"8px 16px", borderRadius:8, border:"1px solid", borderColor:filter===d?"#0ea5e9":"#1e293b", background:filter===d?"#0ea5e922":"transparent", color:filter===d?"#0ea5e9":"#64748b", fontSize:13, fontWeight:600, cursor:"pointer" }}>{d}</button>
            ))}
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:16, paddingBottom:80 }}>
          {filtered.map(c=>(
            <div key={c.id} onClick={()=>onSelect(c)} onMouseEnter={()=>setHovered(c.id)} onMouseLeave={()=>setHovered(null)}
              style={{ background:hovered===c.id?"#111827":"#0d1520", border:`1px solid ${hovered===c.id?c.color+"66":"#1e293b"}`, borderRadius:14, padding:"22px 20px", cursor:"pointer", transform:hovered===c.id?"translateY(-3px)":"none", transition:"all 0.2s", boxShadow:hovered===c.id?`0 8px 30px ${c.color}22`:"none", position:"relative", overflow:"hidden" }}>
              {hovered===c.id&&<div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${c.color},${c.color}00)` }} />}
              <div style={{ fontSize:32, marginBottom:12 }}>{c.logo}</div>
              <div style={{ fontWeight:800, fontSize:17, color:"#f1f5f9", marginBottom:4 }}>{c.name}</div>
              <div style={{ color:"#475569", fontSize:12, marginBottom:12 }}>{c.tag}</div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <DiffBadge d={c.difficulty} />
                <span style={{ color:"#64748b", fontSize:12 }}>{c.tests} tests</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── COMPANY SCREEN ───────────────────────────────────────────────────────────

export function CompanyScreen({ company, onBack, onStart }) {
  const [tests, setTests]   = useState([]);
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    testsAPI.getTests(company.id)
      .then(setTests)
      .catch(()=>setTests(TESTS_BY_COMPANY[company.id] || defaultTests(company.id)));
  }, [company.id]);

  const allTests = tests.length ? tests : (TESTS_BY_COMPANY[company.id] || defaultTests(company.id));

  return (
    <div style={{ minHeight:"100vh", background:"#0a0f1e", color:"#e8eaf6", fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ borderBottom:"1px solid #1e293b", padding:"16px 40px", display:"flex", alignItems:"center", gap:14 }}>
        <button onClick={onBack} style={{ background:"#111827", border:"1px solid #1e293b", color:"#94a3b8", borderRadius:8, padding:"6px 14px", cursor:"pointer", fontSize:13 }}>← Back</button>
        <span style={{ fontSize:22 }}>{company.logo}</span>
        <span style={{ fontWeight:700, fontSize:18 }}>{company.name} Preparation</span>
      </div>

      <div style={{ maxWidth:800, margin:"0 auto", padding:"36px 40px" }}>
        <div style={{ background:`linear-gradient(135deg,${company.color}18,#0d1520)`, border:`1px solid ${company.color}44`, borderRadius:16, padding:"26px", marginBottom:32 }}>
          <div style={{ display:"flex", alignItems:"flex-start", gap:18 }}>
            <div style={{ fontSize:52 }}>{company.logo}</div>
            <div style={{ flex:1 }}>
              <h2 style={{ margin:"0 0 6px", fontSize:24, fontWeight:800 }}>{company.name}</h2>
              <p style={{ margin:"0 0 14px", color:"#94a3b8", fontSize:14 }}>{company.tag}</p>
              <div style={{ display:"flex", gap:20 }}>
                <div><div style={{ fontSize:22, fontWeight:800 }}>{allTests.length}</div><div style={{ fontSize:11, color:"#475569", textTransform:"uppercase", letterSpacing:1 }}>Rounds</div></div>
                <div style={{ width:1, background:"#1e293b" }} />
                <div><div style={{ fontSize:22, fontWeight:800 }}>{allTests.reduce((a,t)=>a+t.questions,0)}</div><div style={{ fontSize:11, color:"#475569", textTransform:"uppercase", letterSpacing:1 }}>Questions</div></div>
                <div style={{ width:1, background:"#1e293b" }} />
                <div><DiffBadge d={company.difficulty} /><div style={{ fontSize:11, color:"#475569", textTransform:"uppercase", letterSpacing:1, marginTop:4 }}>Difficulty</div></div>
              </div>
            </div>
          </div>
        </div>

        <p style={{ color:"#94a3b8", fontSize:11, textTransform:"uppercase", letterSpacing:2, marginBottom:14 }}>Available Test Rounds</p>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {allTests.map((test,i)=>(
            <div key={test.id} onMouseEnter={()=>setHovered(test.id)} onMouseLeave={()=>setHovered(null)}
              style={{ background:hovered===test.id?"#111827":"#0d1520", border:`1px solid ${hovered===test.id?company.color+"55":"#1e293b"}`, borderRadius:12, padding:"18px 22px", display:"flex", alignItems:"center", gap:14, transition:"all 0.2s" }}>
              <div style={{ width:46, height:46, borderRadius:10, background:company.color+"22", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>{test.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:15, color:"#f1f5f9", marginBottom:2 }}>Round {i+1}: {test.name}</div>
                <div style={{ color:"#475569", fontSize:13 }}>{test.desc}</div>
              </div>
              <div style={{ textAlign:"right", marginRight:14, flexShrink:0 }}>
                <div style={{ color:"#94a3b8", fontSize:13 }}>{test.questions} Qs</div>
                <div style={{ color:"#475569", fontSize:12 }}>{Math.floor(test.time/60)} min</div>
              </div>
              <button onClick={()=>onStart(company,test)}
                style={{ background:`linear-gradient(135deg,${company.color},${company.color}bb)`, color:"#fff", border:"none", borderRadius:8, padding:"9px 18px", fontWeight:700, fontSize:13, cursor:"pointer", flexShrink:0, fontFamily:"'DM Sans',sans-serif" }}>
                Start →
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── TEST SCREEN ──────────────────────────────────────────────────────────────

export function TestScreen({ company, test, onSubmit }) {
  const [questions, setQuestions] = useState([]);
  const [confirmed, setConfirmed] = useState(false);
  const [current,   setCurrent]   = useState(0);
  const [answers,   setAnswers]   = useState({});
  const [flagged,   setFlagged]   = useState(new Set());
  const [loaded,    setLoaded]    = useState(false);

  useEffect(() => {
    testsAPI.getQuestions(company.id, test.id)
      .then(qs => { setQuestions(qs.slice(0,test.questions)); setLoaded(true); })
      .catch(()  => { setQuestions(SAMPLE_QUESTIONS.slice(0,test.questions)); setLoaded(true); });
  }, [company.id, test.id]);

  const { display, pct } = useTimer(test.time, handleSubmit);

  function handleSubmit() {
    const results = questions.map((q,i) => ({
      question:q.question, options:q.options,
      selected:answers[i]??null, correct:q.correct, explanation:q.explanation
    }));
    const score = results.filter(r=>r.selected===r.correct).length;
    onSubmit({ score, total:questions.length, results, test, company });
  }

  if (!loaded) return <div style={{ minHeight:"100vh", background:"#0a0f1e", display:"flex", alignItems:"center", justifyContent:"center", color:"#475569", fontFamily:"'DM Sans',sans-serif" }}>Loading questions…</div>;

  if (!confirmed) return (
    <div style={{ minHeight:"100vh", background:"#0a0f1e", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans',sans-serif", padding:24 }}>
      <div style={{ background:"#0d1520", border:"1px solid #1e293b", borderRadius:20, padding:"44px 36px", maxWidth:460, width:"100%", textAlign:"center" }}>
        <div style={{ fontSize:46, marginBottom:14 }}>{test.icon}</div>
        <h2 style={{ fontSize:22, fontWeight:800, margin:"0 0 6px", color:"#f1f5f9" }}>{test.name}</h2>
        <p style={{ color:"#64748b", margin:"0 0 26px", fontSize:14 }}>{company.name} — {test.desc}</p>
        <div style={{ display:"flex", justifyContent:"center", gap:28, marginBottom:28 }}>
          {[["Questions",test.questions],["Duration",`${Math.floor(test.time/60)} min`],["Type","MCQ"]].map(([l,v])=>(
            <div key={l}><div style={{ fontSize:20, fontWeight:800, color:"#e2e8f0" }}>{v}</div><div style={{ fontSize:11, color:"#475569", textTransform:"uppercase", letterSpacing:1 }}>{l}</div></div>
          ))}
        </div>
        <button onClick={()=>setConfirmed(true)}
          style={{ width:"100%", background:`linear-gradient(135deg,${company.color},${company.color}bb)`, color:"#fff", border:"none", borderRadius:10, padding:"13px", fontWeight:800, fontSize:15, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
          Begin Test →
        </button>
      </div>
    </div>
  );

  const q = questions[current];
  if (!q) return null;
  const timerColor = pct>50?"#22c55e":pct>20?"#f59e0b":"#ef4444";

  return (
    <div style={{ minHeight:"100vh", background:"#0a0f1e", fontFamily:"'DM Sans',sans-serif", display:"flex", flexDirection:"column" }}>
      {/* Top bar */}
      <div style={{ background:"#0d1520", borderBottom:"1px solid #1e293b", padding:"12px 24px", display:"flex", alignItems:"center", gap:14, position:"sticky", top:0, zIndex:100 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:700, fontSize:14, color:"#f1f5f9" }}>{company.name} — {test.name}</div>
          <div style={{ color:"#475569", fontSize:12 }}>{Object.keys(answers).length}/{questions.length} answered</div>
        </div>
        <div style={{ width:100, height:6, background:"#1e293b", borderRadius:3, overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${pct}%`, background:timerColor, transition:"width 1s linear" }} />
        </div>
        <span style={{ fontWeight:800, fontSize:16, color:timerColor, minWidth:50, fontVariantNumeric:"tabular-nums" }}>{display}</span>
        <button onClick={handleSubmit} style={{ background:"#ef4444", color:"#fff", border:"none", borderRadius:8, padding:"8px 16px", fontWeight:700, fontSize:13, cursor:"pointer" }}>Submit</button>
      </div>

      <div style={{ display:"flex", flex:1, maxWidth:1000, margin:"0 auto", width:"100%", padding:"24px", gap:20, boxSizing:"border-box" }}>
        {/* Question */}
        <div style={{ flex:1 }}>
          <div style={{ background:"#0d1520", border:"1px solid #1e293b", borderRadius:14, padding:"26px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
              <Badge color="#0ea5e9">Q {current+1} of {questions.length}</Badge>
              <button onClick={()=>setFlagged(prev=>{ const s=new Set(prev); s.has(current)?s.delete(current):s.add(current); return s; })}
                style={{ background:flagged.has(current)?"#f59e0b22":"transparent", border:`1px solid ${flagged.has(current)?"#f59e0b":"#1e293b"}`, color:flagged.has(current)?"#f59e0b":"#475569", borderRadius:6, padding:"4px 12px", cursor:"pointer", fontSize:12 }}>
                {flagged.has(current)?"🚩 Flagged":"🏳 Flag"}
              </button>
            </div>
            <p style={{ fontSize:17, fontWeight:600, color:"#f1f5f9", lineHeight:1.65, marginBottom:24 }}>{q.question}</p>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {q.options.map((opt,i)=>{
                const sel = answers[current]===i;
                return (
                  <button key={i} onClick={()=>setAnswers(prev=>({...prev,[current]:i}))}
                    style={{ background:sel?`${company.color}22`:"#111827", border:`2px solid ${sel?company.color:"#1e293b"}`, borderRadius:10, padding:"13px 16px", textAlign:"left", color:sel?"#f1f5f9":"#94a3b8", cursor:"pointer", fontSize:14, fontWeight:sel?600:400, display:"flex", alignItems:"center", gap:12, transition:"all 0.15s" }}>
                    <span style={{ width:26, height:26, borderRadius:"50%", background:sel?company.color:"#1e293b", color:sel?"#fff":"#475569", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, flexShrink:0 }}>{["A","B","C","D"][i]}</span>
                    {opt}
                  </button>
                );
              })}
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:24 }}>
              <button onClick={()=>setCurrent(c=>Math.max(0,c-1))} disabled={current===0}
                style={{ background:"#111827", border:"1px solid #1e293b", color:current===0?"#334155":"#94a3b8", borderRadius:8, padding:"10px 20px", cursor:current===0?"not-allowed":"pointer", fontSize:14 }}>← Prev</button>
              <button onClick={()=>setCurrent(c=>Math.min(questions.length-1,c+1))} disabled={current===questions.length-1}
                style={{ background:"#111827", border:"1px solid #1e293b", color:current===questions.length-1?"#334155":"#94a3b8", borderRadius:8, padding:"10px 20px", cursor:current===questions.length-1?"not-allowed":"pointer", fontSize:14 }}>Next →</button>
            </div>
          </div>
        </div>

        {/* Palette */}
        <div style={{ width:190, flexShrink:0 }}>
          <div style={{ background:"#0d1520", border:"1px solid #1e293b", borderRadius:14, padding:"18px" }}>
            <div style={{ color:"#475569", fontSize:11, textTransform:"uppercase", letterSpacing:1, marginBottom:12 }}>Palette</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:5, marginBottom:16 }}>
              {questions.map((_,i)=>{
                const isAns=answers[i]!==undefined, isFlag=flagged.has(i), isCurr=current===i;
                let bg="#111827",color="#475569",border="#1e293b";
                if(isCurr){bg=company.color;color="#fff";border=company.color;}
                else if(isFlag){bg="#f59e0b22";color="#f59e0b";border="#f59e0b55";}
                else if(isAns){bg="#22c55e22";color="#22c55e";border="#22c55e55";}
                return <button key={i} onClick={()=>setCurrent(i)} style={{ width:"100%", aspectRatio:"1", borderRadius:5, border:`1px solid ${border}`, background:bg, color, fontSize:10, fontWeight:700, cursor:"pointer" }}>{i+1}</button>;
              })}
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
              {[["#22c55e55","Answered",Object.keys(answers).length],["#1e293b","Not Visited",questions.length-Object.keys(answers).length],["#f59e0b55","Flagged",flagged.size]].map(([bg,l,c])=>(
                <div key={l} style={{ display:"flex", alignItems:"center", gap:7, fontSize:12, color:"#64748b" }}>
                  <div style={{ width:12, height:12, borderRadius:3, background:bg, flexShrink:0 }} />
                  <span style={{ flex:1 }}>{l}</span>
                  <span style={{ fontWeight:700, color:"#94a3b8" }}>{c}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── RESULTS SCREEN ───────────────────────────────────────────────────────────

export function ResultsScreen({ data, onRetry, onHome }) {
  const { score, total, results, test, company } = data;
  const pct = Math.round((score/total)*100);
  const [expanded, setExpanded] = useState(null);
  const grade = pct>=80?{label:"Excellent",color:"#22c55e"}:pct>=60?{label:"Good",color:"#0ea5e9"}:pct>=40?{label:"Average",color:"#f59e0b"}:{label:"Needs Work",color:"#ef4444"};

  return (
    <div style={{ minHeight:"100vh", background:"#0a0f1e", fontFamily:"'DM Sans',sans-serif", padding:"40px 24px" }}>
      <div style={{ maxWidth:680, margin:"0 auto" }}>
        <div style={{ background:`linear-gradient(135deg,${grade.color}18,#0d1520)`, border:`1px solid ${grade.color}44`, borderRadius:20, padding:"36px", textAlign:"center", marginBottom:24 }}>
          <div style={{ fontSize:14, color:"#64748b", marginBottom:10 }}>{company.name} — {test.name}</div>
          <div style={{ position:"relative", width:130, height:130, margin:"0 auto 16px" }}>
            <svg width="130" height="130" style={{ transform:"rotate(-90deg)" }}>
              <circle cx="65" cy="65" r="55" fill="none" stroke="#1e293b" strokeWidth="9" />
              <circle cx="65" cy="65" r="55" fill="none" stroke={grade.color} strokeWidth="9"
                strokeDasharray={`${2*Math.PI*55}`} strokeDashoffset={`${2*Math.PI*55*(1-pct/100)}`}
                strokeLinecap="round" />
            </svg>
            <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
              <span style={{ fontSize:30, fontWeight:900, color:"#f1f5f9" }}>{pct}%</span>
            </div>
          </div>
          <Badge color={grade.color}>{grade.label}</Badge>
          <div style={{ display:"flex", justifyContent:"center", gap:24, marginTop:18 }}>
            {[["✅",score,"#22c55e"],["❌",total-score,"#ef4444"],["📋",total,"#94a3b8"]].map(([l,v,c])=>(
              <div key={l} style={{ textAlign:"center" }}><div style={{ fontSize:22, fontWeight:800, color:c }}>{v}</div><div style={{ fontSize:12, color:"#475569" }}>{l}</div></div>
            ))}
          </div>
        </div>

        <div style={{ display:"flex", gap:12, marginBottom:24 }}>
          <button onClick={onRetry} style={{ flex:1, background:`linear-gradient(135deg,${company.color},${company.color}bb)`, color:"#fff", border:"none", borderRadius:10, padding:"12px", fontWeight:700, fontSize:14, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>🔄 Retry</button>
          <button onClick={onHome}  style={{ flex:1, background:"#111827", border:"1px solid #1e293b", color:"#94a3b8", borderRadius:10, padding:"12px", fontWeight:700, fontSize:14, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>🏠 Home</button>
        </div>

        <p style={{ color:"#475569", fontSize:11, textTransform:"uppercase", letterSpacing:2, marginBottom:12 }}>Question Review</p>
        {results.map((r,i)=>{
          const correct=r.selected===r.correct, isOpen=expanded===i;
          return (
            <div key={i} style={{ background:"#0d1520", border:`1px solid ${correct?"#22c55e33":"#ef444433"}`, borderRadius:12, overflow:"hidden", marginBottom:10 }}>
              <button onClick={()=>setExpanded(isOpen?null:i)} style={{ width:"100%", background:"none", border:"none", padding:"14px 18px", display:"flex", alignItems:"center", gap:12, cursor:"pointer", textAlign:"left" }}>
                <span style={{ width:26, height:26, borderRadius:"50%", background:correct?"#22c55e22":"#ef444422", color:correct?"#22c55e":"#ef4444", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, flexShrink:0 }}>{correct?"✓":"✗"}</span>
                <span style={{ flex:1, color:"#e2e8f0", fontSize:14, fontWeight:500 }}>Q{i+1}. {r.question}</span>
                <span style={{ color:"#475569", fontSize:12 }}>{isOpen?"▲":"▼"}</span>
              </button>
              {isOpen&&(
                <div style={{ padding:"0 18px 16px", borderTop:"1px solid #1e293b" }}>
                  {r.options?.map((opt,j)=>{
                    let bg="transparent",color="#64748b",border="transparent";
                    if(j===r.correct){bg="#22c55e22";color="#22c55e";border="#22c55e44";}
                    else if(j===r.selected&&!correct){bg="#ef444422";color="#ef4444";border="#ef444444";}
                    return (
                      <div key={j} style={{ display:"flex", alignItems:"center", gap:10, padding:"7px 12px", marginTop:5, borderRadius:8, background:bg, border:`1px solid ${border}` }}>
                        <span style={{ width:20, height:20, borderRadius:"50%", background:"#1e293b", color:"#475569", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, flexShrink:0 }}>{["A","B","C","D"][j]}</span>
                        <span style={{ fontSize:13, color }}>{opt}</span>
                        {j===r.correct&&<span style={{ marginLeft:"auto", fontSize:11, color:"#22c55e" }}>✓ Correct</span>}
                        {j===r.selected&&!correct&&j!==r.correct&&<span style={{ marginLeft:"auto", fontSize:11, color:"#ef4444" }}>✗ Yours</span>}
                      </div>
                    );
                  })}
                  <div style={{ marginTop:10, background:"#0ea5e911", border:"1px solid #0ea5e933", borderRadius:8, padding:"9px 14px", color:"#7dd3fc", fontSize:13 }}>
                    💡 {r.explanation}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── DEFAULT EXPORT (standalone app without auth/nav) ────────────────────────

export default function StandaloneMockTest() {
  const [screen,  setScreen]  = useState("home");
  const [company, setCompany] = useState(null);
  const [test,    setTest]    = useState(null);
  const [result,  setResult]  = useState(null);

  if (screen==="home")    return <HomeScreen    onSelect={c=>{setCompany(c);setScreen("company");}}/>;
  if (screen==="company") return <CompanyScreen company={company} onBack={()=>setScreen("home")} onStart={(c,t)=>{setTest(t);setScreen("test");}}/>;
  if (screen==="test")    return <TestScreen    key={test.id} company={company} test={test} onSubmit={r=>{setResult(r);setScreen("results");}}/>;
  if (screen==="results") return <ResultsScreen data={result} onRetry={()=>setScreen("test")} onHome={()=>setScreen("home")}/>;
}
