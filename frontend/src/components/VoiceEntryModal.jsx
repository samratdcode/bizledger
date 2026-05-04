import React, { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api.js";
import { INR, S, C } from "../styles.js";

const BIZ_MAP = {
  medicine:"pharmacy", pharmacy:"pharmacy", medical:"pharmacy",
  diagnostic:"diagnostic", diagnostics:"diagnostic", lab:"diagnostic", test:"diagnostic", pathology:"diagnostic",
  nursing:"nursing_home", hospital:"nursing_home", ward:"nursing_home", nurse:"nursing_home",
};
const MODE_MAP = { cash:"cash", bank:"bank", upi:"bank", gpay:"bank", google:"bank", online:"bank", transfer:"bank", neft:"bank" };
const TYPE_MAP = { in:"in", income:"in", received:"in", credit:"in", deposit:"in", out:"out", expense:"out", paid:"out", debit:"out", payment:"out", spent:"out", withdrawn:"out" };
const BIZ_LABELS = {
  pharmacy:     { name:"Pharmacy",          icon:"💊", color:"#10B981" },
  diagnostic:   { name:"Diagnostic Centre", icon:"🔬", color:"#8B5CF6" },
  nursing_home: { name:"Nursing Home",      icon:"🏥", color:"#3B82F6" },
};
// FIX: Map bizType to correct category (was hardcoded "Collection" for all)
const CATEGORY_MAP = {
  pharmacy:     "Medicine Sale",
  diagnostic:   "Collection",
  nursing_home: "Collection",
};

function parseCommand(transcript) {
  const words = transcript.toLowerCase().trim().split(/[\s,]+/);
  let bizType = null, mode = null, type = null, amount = null;
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (!bizType && BIZ_MAP[w])  bizType = BIZ_MAP[w];
    if (!mode    && MODE_MAP[w]) mode    = MODE_MAP[w];
    if (!type    && TYPE_MAP[w]) type    = TYPE_MAP[w];
    // FIX: Check "3k" suffix before general number parse to avoid intermediate wrong value
    if (w.endsWith("k") && !isNaN(parseFloat(w.slice(0, -1)))) {
      amount = parseFloat(w.slice(0, -1)) * 1000;
      continue;
    }
    const num = parseFloat(w.replace(/,/g, ""));
    if (!isNaN(num) && num > 0) {
      const next = words[i + 1];
      if      (next === "lakh" || next === "lac" || next === "lakhs") { amount = num * 100000; i++; }
      else if (next === "thousand" || next === "k")                   { amount = num * 1000;   i++; }
      else                                                             { amount = num; }
    }
  }
  return { bizType, mode, type, amount, valid: !!(bizType && mode && type && amount) };
}

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};

export default function VoiceEntryModal({ onClose }) {
  const qc = useQueryClient();
  const [phase,      setPhase]      = useState("idle");
  const [transcript, setTranscript] = useState("");
  const [parsed,     setParsed]     = useState(null);
  const [saveErr,    setSaveErr]    = useState("");
  const [amount,     setAmount]     = useState("");
  const [supported,  setSupported]  = useState(true);
  const recogRef = useRef(null);
  // FIX: Track current phase in ref for use inside onend callback (avoids stale closure)
  const phaseRef = useRef("idle");
  const setPhaseSync = (p) => { phaseRef.current = p; setPhase(p); };

  const { data: bizData } = useQuery({
    queryKey: ["businesses"],
    queryFn:  () => api.get("/businesses").then(r => r.data),
  });
  const businesses = bizData?.businesses || [];

  // FIX: All window access inside useEffect — never at module/component top level
  useEffect(() => {
    const SR = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SR) { setSupported(false); setPhaseSync("unsupported"); }
    return () => recogRef.current?.abort();
  }, []);

  const getSR = () =>
    typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);

  const startListening = () => {
    const SR = getSR();
    if (!SR) return;
    const recog = new SR();
    recog.lang            = "en-IN";
    recog.continuous      = false;
    recog.interimResults  = false;
    recog.maxAlternatives = 3;
    recogRef.current = recog;

    setPhaseSync("listening");
    setTranscript(""); setParsed(null); setSaveErr("");

    recog.onresult = (e) => {
      let best = null;
      for (let i = 0; i < e.results[0].length; i++) {
        const t = e.results[0][i].transcript;
        const p = parseCommand(t);
        if (p.valid) { best = { transcript: t, parsed: p }; break; }
        if (!best)     best = { transcript: t, parsed: p };
      }
      setTranscript(best.transcript);
      setParsed(best.parsed);
      setAmount(best.parsed.amount ? String(best.parsed.amount) : "");
      setPhaseSync("parsed");
    };

    recog.onerror = (e) => {
      if (e.error === "no-speech") { setPhaseSync("idle"); }
      else { setTranscript(`Error: ${e.error}`); setPhaseSync("error"); }
    };

    // FIX: onend handler prevents permanent "Listening..." hang on timeout/mobile Safari
    recog.onend = () => {
      if (phaseRef.current === "listening") setPhaseSync("idle");
    };

    recog.start();
  };

  const stopListening = () => { recogRef.current?.stop(); setPhaseSync("idle"); };

  const save = async () => {
    if (!parsed?.valid) return;
    const biz = businesses.find(b => b.type === parsed.bizType);
    if (!biz) return setSaveErr("Business not found. Check businesses are set up.");
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return setSaveErr("Fix the amount first.");
    setPhaseSync("saving");
    try {
      await api.post("/transactions", {
        businessId:  biz.id,
        type:        parsed.type,
        amount:      amt,
        mode:        parsed.mode,
        // FIX: Use correct category per business type
        category:    CATEGORY_MAP[parsed.bizType] || "Collection",
        description: `Voice: ${transcript}`,
        txDate:      todayStr(),
      });
      qc.invalidateQueries(["dashboard"]);
      qc.invalidateQueries(["allTxs"]);
      qc.invalidateQueries(["bizTxs"]);
      qc.invalidateQueries(["reports"]);
      setPhaseSync("done");
      setTimeout(() => onClose(), 1800);
    } catch (e) {
      setSaveErr(e.response?.data?.error || "Save failed. Try again.");
      setPhaseSync("parsed");
    }
  };

  const bizMeta = parsed?.bizType ? BIZ_LABELS[parsed.bizType] : null;

  return (
    <div style={S.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ ...S.mBox, paddingBottom: 48 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
          <div>
            <h2 style={{ fontSize:20, fontWeight:700, color:C.slate900, margin:0 }}>🎙️ Voice Entry</h2>
            <div style={{ fontSize:12, color:C.slate400, marginTop:4 }}>Say the transaction out loud</div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:26, cursor:"pointer", color:C.slate400 }}>×</button>
        </div>

        <div style={{ background:C.slate50, borderRadius:12, padding:"12px 14px", marginBottom:20 }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.slate500, textTransform:"uppercase", letterSpacing:0.5, marginBottom:8 }}>Say it like this:</div>
          {[
            { text:'"Medicine Cash In 3000"',    color:"#10B981" },
            { text:'"Medicine Bank In 5000"',     color:"#2563EB" },
            { text:'"Diagnostic Cash In 40000"', color:"#8B5CF6" },
            { text:'"Diagnostic Bank In 20000"', color:"#2563EB" },
            { text:'"Nursing Cash Out 10000"',   color:"#EF4444" },
          ].map((ex, i) => <div key={i} style={{ fontSize:13, fontWeight:600, color:ex.color, marginBottom:4 }}>{ex.text}</div>)}
          <div style={{ fontSize:11, color:C.slate400, marginTop:6 }}>Pattern: <strong>Business · Cash/Bank · In/Out · Amount</strong></div>
        </div>

        {phase === "unsupported" && (
          <div style={{ background:"#FEF2F2", borderRadius:12, padding:16, textAlign:"center" }}>
            <div style={{ fontSize:24, marginBottom:8 }}>😔</div>
            <div style={{ fontSize:14, fontWeight:700, color:C.red }}>Voice not supported on this browser</div>
            <div style={{ fontSize:12, color:C.slate500, marginTop:4 }}>Use Chrome on Android or Safari on iPhone.</div>
          </div>
        )}

        {(phase === "idle" || phase === "error") && supported && (
          <div style={{ textAlign:"center" }}>
            <button onClick={startListening} style={{ width:90, height:90, borderRadius:"50%", background:C.blue, border:"none", fontSize:36, cursor:"pointer", boxShadow:"0 6px 24px rgba(37,99,235,0.4)", display:"inline-flex", alignItems:"center", justifyContent:"center" }}>🎙️</button>
            <div style={{ fontSize:14, color:C.slate500, marginTop:12, fontWeight:600 }}>Tap to speak</div>
            {phase === "error" && <div style={{ fontSize:12, color:C.red, marginTop:8 }}>{transcript}</div>}
          </div>
        )}

        {phase === "listening" && (
          <div style={{ textAlign:"center" }}>
            <button onClick={stopListening} style={{ width:90, height:90, borderRadius:"50%", background:C.red, border:"4px solid #FCA5A5", fontSize:36, cursor:"pointer", display:"inline-flex", alignItems:"center", justifyContent:"center" }}>🎙️</button>
            <div style={{ fontSize:15, fontWeight:700, color:C.red, marginTop:12 }}>Listening...</div>
            <div style={{ fontSize:12, color:C.slate400, marginTop:4 }}>Speak now · tap to stop</div>
          </div>
        )}

        {(phase === "parsed" || phase === "saving") && parsed && (
          <div>
            <div style={{ background:C.slate50, borderRadius:10, padding:"10px 14px", marginBottom:16, fontSize:13, color:C.slate600 }}>
              <span style={{ fontWeight:600, color:C.slate400, fontSize:11, textTransform:"uppercase", letterSpacing:0.5 }}>Heard: </span>
              "{transcript}"
            </div>
            {parsed.valid ? (
              <div style={{ background:"#ECFDF5", border:"1.5px solid #6EE7B7", borderRadius:14, padding:"16px 18px", marginBottom:16 }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#065F46", textTransform:"uppercase", letterSpacing:0.5, marginBottom:12 }}>✅ Parsed successfully</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:14 }}>
                  {bizMeta && <span style={{ background:"#fff", borderRadius:20, padding:"5px 12px", fontSize:13, fontWeight:700, color:bizMeta.color, border:`1.5px solid ${bizMeta.color}` }}>{bizMeta.icon} {bizMeta.name}</span>}
                  <span style={{ background:"#fff", borderRadius:20, padding:"5px 12px", fontSize:13, fontWeight:700, color:parsed.type==="in"?C.green:C.red, border:`1.5px solid ${parsed.type==="in"?C.green:C.red}` }}>{parsed.type==="in"?"↑ Cash IN":"↓ Cash OUT"}</span>
                  <span style={{ background:"#fff", borderRadius:20, padding:"5px 12px", fontSize:13, fontWeight:700, color:parsed.mode==="cash"?"#92400E":"#1E40AF", border:`1.5px solid ${parsed.mode==="cash"?"#FDE68A":"#93C5FD"}` }}>{parsed.mode==="cash"?"💵 Cash Pool":"🏦 Bank / UPI"}</span>
                </div>
                <div style={{ fontSize:11, fontWeight:700, color:"#065F46", textTransform:"uppercase", letterSpacing:0.5, marginBottom:6 }}>Amount — edit if wrong</div>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                  style={{ ...S.input, fontSize:26, fontWeight:900, textAlign:"center", borderColor:"#6EE7B7", background:"#fff" }} />
              </div>
            ) : (
              <div style={{ background:"#FEF2F2", border:"1.5px solid #FCA5A5", borderRadius:14, padding:"16px 18px", marginBottom:16 }}>
                <div style={{ fontSize:13, fontWeight:700, color:C.red, marginBottom:8 }}>❌ Couldn't parse — what was missing?</div>
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  <div style={{ fontSize:13, color:parsed.bizType?"#065F46":C.red }}>{parsed.bizType?`✓ Business: ${BIZ_LABELS[parsed.bizType]?.name}`:"✗ Business not recognised (say Medicine, Diagnostic, or Nursing)"}</div>
                  <div style={{ fontSize:13, color:parsed.mode?"#065F46":C.red }}>{parsed.mode?`✓ Mode: ${parsed.mode}`:"✗ Mode not recognised (say Cash or Bank)"}</div>
                  <div style={{ fontSize:13, color:parsed.type?"#065F46":C.red }}>{parsed.type?`✓ Direction: ${parsed.type}`:"✗ Direction not recognised (say In or Out)"}</div>
                  <div style={{ fontSize:13, color:parsed.amount?"#065F46":C.red }}>{parsed.amount?`✓ Amount: ${INR(parsed.amount)}`:"✗ Amount not found (say a number)"}</div>
                </div>
              </div>
            )}

            {saveErr && <div style={{ background:"#FEF2F2", color:C.red, borderRadius:10, padding:"10px 14px", fontSize:13, marginBottom:12 }}>⚠️ {saveErr}</div>}

            <div style={{ display:"flex", gap:10 }}>
              <button onClick={startListening} style={{ flex:1, padding:14, borderRadius:12, border:`1.5px solid ${C.slate200}`, background:C.white, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"inherit", color:C.slate700 }}>
                🎙️ Try Again
              </button>
              {parsed.valid && (
                <button onClick={save} disabled={phase==="saving" || !amount}
                  style={{ flex:2, ...S.btn, marginTop:0, background:parsed.type==="in"?C.green:C.red, color:C.white, opacity:phase==="saving"?0.7:1, fontSize:15, cursor:phase==="saving"?"not-allowed":"pointer" }}>
                  {phase === "saving" ? "Saving..." : `✓ Save ${INR(parseFloat(amount) || 0)}`}
                </button>
              )}
            </div>
          </div>
        )}

        {phase === "done" && (
          <div style={{ textAlign:"center", padding:"20px 0" }}>
            <div style={{ fontSize:48, marginBottom:12 }}>✅</div>
            <div style={{ fontSize:18, fontWeight:800, color:"#065F46" }}>Saved!</div>
            <div style={{ fontSize:14, color:C.slate500, marginTop:4 }}>"{transcript}"</div>
          </div>
        )}
      </div>
    </div>
  );
}
