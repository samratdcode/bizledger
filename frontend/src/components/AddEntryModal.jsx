import React, { useState } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import api from "../api.js";
import { S, C, INR } from "../styles.js";

const CATS = {
  in: ["Bed Charge","Lab Test","Medicine Sale","OPD Fee","Admission","Consultation","Collection","Other"],
  out: ["Staff Salary","Medicine Purchase","Electricity","Rent","Equipment","Maintenance","Other"],
};

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};

export default function AddEntryModal({ onClose, prefillBiz }) {
  const qc = useQueryClient();

  const [type, setType] = useState("in");
  const [amount, setAmount] = useState("");
  const [bizId, setBizId] = useState(prefillBiz?.id || "");
  const [mode, setMode] = useState("cash");
  const [cat, setCat] = useState("");
  const [desc, setDesc] = useState("");
  const [date, setDate] = useState(todayStr());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const { data: bizData } = useQuery({
    queryKey: ["businesses"],
    queryFn: () => api.get("/businesses").then(r => r.data),
  });

  const { data: dashData } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api.get("/dashboard").then(r => r.data),
  });

  const businesses = bizData?.businesses || [];
  const sharedCash = dashData?.sharedCash || 0;
  const chosenBiz = businesses.find(b => b.id === bizId);
  const isBackdated = date !== todayStr();

  const save = async () => {
    if (!amount || !bizId) return setError("Enter amount and select a business");

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return setError("Enter a valid amount");

    setSaving(true);
    setError("");

    try {
      await api.post("/transactions", {
        businessId: bizId,
        type,
        amount: amt,
        mode,
        category: cat || null,
        description: desc || null,
        txDate: date,
      });

      qc.invalidateQueries(["dashboard"]);
      qc.invalidateQueries(["bizTxs"]);
      qc.invalidateQueries(["allTxs"]);
      qc.invalidateQueries(["reports"]);

      onClose();
    } catch (e) {
      setError(e.response?.data?.error || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={S.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={S.mBox}>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <h2 style={{ fontSize:20, fontWeight:700, color:C.slate900 }}>Add Entry</h2>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:26, cursor:"pointer", color:C.slate500 }}>×</button>
        </div>

        <div style={S.toggle}>
          <button style={{ ...S.tBtn, background:type==="in"?C.green:"transparent", color:type==="in"?C.white:C.slate500 }}
            onClick={()=>{ setType("in"); setCat(""); }}>↑ Cash IN</button>

          <button style={{ ...S.tBtn, background:type==="out"?C.red:"transparent", color:type==="out"?C.white:C.slate500 }}
            onClick={()=>{ setType("out"); setCat(""); }}>↓ Cash OUT</button>
        </div>

        <div style={{ textAlign:"center", margin:"20px 0 4px" }}>
          <span style={{ fontSize:26, color:C.slate300 }}>₹</span>
          <input
            type="number"
            value={amount}
            onChange={e=>setAmount(e.target.value)}
            style={{
              border:"none",
              borderBottom:`2.5px solid ${C.blue}`,
              fontSize:36,
              textAlign:"center",
              width:"80%"
            }}
          />
        </div>

        {/* Business */}
        <span style={S.fLabel}>Business</span>
        <div style={{ display:"flex", gap:8, marginTop:8, flexWrap:"wrap" }}>
          {businesses.map(b=>(
            <button key={b.id}
              style={{ ...S.pill, ...(bizId===b.id?{background:b.color,color:C.white}:{}) }}
              onClick={()=>setBizId(b.id)}>
              {b.icon} {b.name.split(" ")[0]}
            </button>
          ))}
        </div>

        {/* Payment */}
        <span style={S.fLabel}>Payment Mode</span>
        <div style={{ display:"flex", gap:8, marginTop:8 }}>
          <button style={{ ...S.pill, ...(mode==="cash"?{background:C.amber,color:C.white}:{}) }}
            onClick={()=>setMode("cash")}>💵 Cash</button>

          <button style={{ ...S.pill, ...(mode==="bank"?{background:C.blue,color:C.white}:{}) }}
            onClick={()=>setMode("bank")}>🏦 Bank</button>
        </div>

        {/* Category */}
        <span style={S.fLabel}>Category</span>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:8 }}>
          {CATS[type].map(c=>(
            <button key={c}
              style={{ ...S.chip, ...(cat===c?{background:C.blue,color:C.white}:{}) }}
              onClick={()=>setCat(c===cat?"":c)}>
              {c}
            </button>
          ))}
        </div>

        {/* Note */}
        <span style={S.fLabel}>Note</span>
        <input style={S.input} value={desc} onChange={e=>setDesc(e.target.value)} />

        {/* Date */}
        <span style={S.fLabel}>Transaction Date</span>
        <input type="date" value={date} max={todayStr()}
          onChange={e=>setDate(e.target.value)}
          style={{ ...S.input, marginTop:8 }} />

        {error && <div style={{ color:C.red }}>{error}</div>}

        <button onClick={save} disabled={saving}
          style={{ ...S.btn, background:type==="in"?C.green:C.red }}>
          {saving ? "Saving..." : "Save Entry"}
        </button>

      </div>
    </div>
  );
}