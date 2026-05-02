import React, { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api.js";
import { INR, S, C } from "../styles.js";

const BIZ_MAP = {
  medicine: "pharmacy",
  pharmacy: "pharmacy",
  diagnostic: "diagnostic",
  nursing: "nursing_home",
};

const MODE_MAP = {
  cash: "cash",
  bank: "bank",
  upi: "bank",
};

const TYPE_MAP = {
  in: "in",
  out: "out",
};

function parseCommand(text) {
  const words = text.toLowerCase().split(" ");
  let bizType, mode, type, amount;

  words.forEach((w) => {
    if (BIZ_MAP[w]) bizType = BIZ_MAP[w];
    if (MODE_MAP[w]) mode = MODE_MAP[w];
    if (TYPE_MAP[w]) type = TYPE_MAP[w];

    const num = parseFloat(w);
    if (!isNaN(num)) amount = num;
  });

  return {
    bizType,
    mode,
    type,
    amount,
    valid: bizType && mode && type && amount,
  };
}

export default function VoiceEntryModal({ onClose }) {
  const qc = useQueryClient();

  const [phase, setPhase] = useState("idle");
  const [transcript, setTranscript] = useState("");
  const [parsed, setParsed] = useState(null);

  const recogRef = useRef(null);

  const { data } = useQuery({
    queryKey: ["businesses"],
    queryFn: () => api.get("/businesses").then(r => r.data),
  });

  const businesses = data?.businesses || [];

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      setPhase("unsupported");
    }
  }, []);

  const startListening = () => {
    const SR =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SR) return;

    const recog = new SR();
    recog.lang = "en-IN";

    recog.onresult = (e) => {
      const text = e.results[0][0].transcript;
      const p = parseCommand(text);

      setTranscript(text);
      setParsed(p);
      setPhase("parsed");
    };

    recog.start();
    recogRef.current = recog;
    setPhase("listening");
  };

  const save = async () => {
    if (!parsed?.valid) return;

    const biz = businesses.find(b => b.type === parsed.bizType);
    if (!biz) return;

    await api.post("/transactions", {
      businessId: biz.id,
      type: parsed.type,
      amount: parsed.amount,
      mode: parsed.mode,
      category: "Collection",
      description: transcript,
      txDate: new Date(),
    });

    qc.invalidateQueries(["dashboard"]);
    qc.invalidateQueries(["reports"]);

    setPhase("done");
    setTimeout(onClose, 1500);
  };

  return (
    <div style={S.overlay}>
      <div style={{ ...S.mBox }}>

        {phase === "idle" && (
          <button onClick={startListening}>🎙 Start</button>
        )}

        {phase === "listening" && <div>Listening...</div>}

        {phase === "parsed" && (
          <div>
            <div>{transcript}</div>
            <button onClick={save}>Save</button>
          </div>
        )}

        {phase === "done" && <div>Saved!</div>}

      </div>
    </div>
  );
}