import React, { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api.js";
import { INR, S, C } from "../styles.js";

// ── Keyword maps ─────────────────────────────────────────────────
const BIZ_MAP = {
  medicine: "pharmacy", pharmacy: "pharmacy", medical: "pharmacy",
  diagnostic: "diagnostic", diagnostics: "diagnostic", lab: "diagnostic",
  test: "diagnostic", pathology: "diagnostic",
  nursing: "nursing_home", hospital: "nursing_home", ward: "nursing_home",
  nurse: "nursing_home",
};

const MODE_MAP = {
  cash: "cash",
  bank: "bank", upi: "bank", gpay: "bank",
  google: "bank", online: "bank", transfer: "bank", neft: "bank",
};

const TYPE_MAP = {
  in: "in", income: "in", received: "in", credit: "in", deposit: "in",
  out: "out", expense: "out", paid: "out", debit: "out", payment: "out",
  spent: "out", withdrawn: "out",
};

const BIZ_LABELS = {
  pharmacy:     { name: "Pharmacy",          icon: "💊", color: "#10B981" },
  diagnostic:   { name: "Diagnostic Centre", icon: "🔬", color: "#8B5CF6" },
  nursing_home: { name: "Nursing Home",      icon: "🏥", color: "#3B82F6" },
};

// ── Parser ───────────────────────────────────────────────────────
function parseCommand(transcript) {
  const words = transcript.toLowerCase().trim().split(/[\s,]+/);
  let bizType = null, mode = null, type = null, amount = null;

  for (let i = 0; i < words.length; i++) {
    const w = words[i];

    if (!bizType && BIZ_MAP[w])  bizType = BIZ_MAP[w];
    if (!mode    && MODE_MAP[w]) mode    = MODE_MAP[w];
    if (!type    && TYPE_MAP[w]) type    = TYPE_MAP[w];

    const num = parseFloat(w.replace(/,/g, ""));
    if (!isNaN(num) && num > 0) {
      const next = words[i + 1];
      if (next === "lakh" || next === "lac" || next === "lakhs") {
        amount = num * 100000; i++;
      } else if (next === "thousand" || next === "k") {
        amount = num * 1000; i++;
      } else {
        amount = num;
      }
    }

    if (w.endsWith("k") && !isNaN(parseFloat(w.slice(0, -1)))) {
      amount = parseFloat(w.slice(0, -1)) * 1000;
    }
  }

  return { bizType, mode, type, amount, valid: !!(bizType && mode && type && amount) };
}

// ── Helper ───────────────────────────────────────────────────────
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};

// ── Component ────────────────────────────────────────────────────
export default function VoiceEntryModal({ onClose }) {
  const qc = useQueryClient();

  const [phase, setPhase] = useState("idle");
  const [transcript, setTranscript] = useState("");
  const [parsed, setParsed] = useState(null);
  const [saveErr, setSaveErr] = useState("");
  const [amount, setAmount] = useState("");
  const [supported, setSupported] = useState(true);

  const recogRef = useRef(null);

  const { data: bizData } = useQuery({
    queryKey: ["businesses"],
    queryFn: () => api.get("/businesses").then(r => r.data),
  });

  const businesses = bizData?.businesses || [];

  // SSR-safe check
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) {
        setSupported(false);
        setPhase("unsupported");
      }
    }
    return () => recogRef.current?.abort();
  }, []);

  const getSR = () =>
    typeof window !== "undefined" &&
    (window.SpeechRecognition || window.webkitSpeechRecognition);

  const startListening = () => {
    const SR = getSR();
    if (!SR) return;

    const recog = new SR();
    recog.lang = "en-IN";
    recog.continuous = false;
    recog.interimResults = false;
    recog.maxAlternatives = 3;

    recogRef.current = recog;

    setPhase("listening");
    setTranscript("");
    setParsed(null);
    setSaveErr("");

    recog.onresult = (e) => {
      let best = null;
      for (let i = 0; i < e.results[0].length; i++) {
        const t = e.results[0][i].transcript;
        const p = parseCommand(t);
        if (p.valid) { best = { transcript: t, parsed: p }; break; }
        if (!best) best = { transcript: t, parsed: p };
      }
      setTranscript(best.transcript);
      setParsed(best.parsed);
      setAmount(best.parsed.amount ? String(best.parsed.amount) : "");
      setPhase("parsed");
    };

    recog.onerror = (e) => {
      if (e.error === "no-speech") setPhase("idle");
      else {
        setTranscript(`Error: ${e.error}`);
        setPhase("error");
      }
    };

    recog.onend = () => {
      setPhase(prev => (prev === "listening" ? "idle" : prev));
    };

    recog.start();
  };

  const stopListening = () => {
    recogRef.current?.stop();
    setPhase("idle");
  };

  const save = async () => {
    if (!parsed?.valid) return;

    const biz = businesses.find(b => b.type === parsed.bizType);
    if (!biz) return setSaveErr("Business not found.");

    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return setSaveErr("Fix the amount first.");

    setPhase("saving");

    try {
      await api.post("/transactions", {
        businessId: biz.id,
        type: parsed.type,
        amount: amt,
        mode: parsed.mode,
        category: parsed.type === "in" ? "Collection" : "Expense",
        description: `Voice entry: ${transcript}`,
        txDate: todayStr(),
      });

      qc.invalidateQueries(["dashboard"]);
      qc.invalidateQueries(["allTxs"]);
      qc.invalidateQueries(["bizTxs"]);
      qc.invalidateQueries(["reports"]);

      setPhase("done");
      setTimeout(() => onClose(), 1500);

    } catch (e) {
      setSaveErr(e.response?.data?.error || "Save failed");
      setPhase("parsed");
    }
  };

  const bizMeta = parsed?.bizType ? BIZ_LABELS[parsed.bizType] : null;

  return (
    <div style={S.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ ...S.mBox, paddingBottom: 40 }}>

        <h2 style={{ marginBottom: 10 }}>🎙️ Voice Entry</h2>

        {phase === "unsupported" && (
          <div>Voice not supported on this device.</div>
        )}

        {(phase === "idle" || phase === "error") && supported && (
          <button onClick={startListening}>🎙️ Start</button>
        )}

        {phase === "listening" && (
          <button onClick={stopListening}>🛑 Stop</button>
        )}

        {(phase === "parsed" || phase === "saving") && parsed && (
          <div>
            <div>"{transcript}"</div>

            {parsed.valid ? (
              <>
                <div>{bizMeta?.name}</div>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                />
                <button onClick={save}>
                  {phase === "saving" ? "Saving..." : "Save"}
                </button>
              </>
            ) : (
              <div>Could not parse</div>
            )}
          </div>
        )}

        {phase === "done" && <div>✅ Saved</div>}

        {saveErr && <div>{saveErr}</div>}
      </div>
    </div>
  );
}