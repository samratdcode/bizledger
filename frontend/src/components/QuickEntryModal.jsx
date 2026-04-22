import React, { useState } from “react”;
import { useQueryClient } from “@tanstack/react-query”;
import api from “../api.js”;
import { INR, S, C } from “../styles.js”;

const todayStr = () => {
const d = new Date();
return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};

export default function QuickEntryModal({ template: t, onClose }) {
const qc = useQueryClient();
const [amount, setAmount] = useState(””);
const [desc,   setDesc]   = useState(””);
const [date,   setDate]   = useState(todayStr());
const [saving, setSaving] = useState(false);
const [done,   setDone]   = useState(false);
const [error,  setError]  = useState(””);

const isBackdated = date !== todayStr();

const save = async () => {
const amt = parseFloat(amount);
if (!amt || amt <= 0) return setError(“Enter a valid amount”);
setSaving(true); setError(””);
try {
await api.post(”/transactions”, {
businessId:  t.businessId,
type:        t.type,
amount:      amt,
mode:        t.mode,
category:    t.category,
description: desc.trim() || t.sublabel,
txDate:      date,
});
qc.invalidateQueries([“dashboard”]);
qc.invalidateQueries([“allTxs”]);
qc.invalidateQueries([“bizTxs”]);
qc.invalidateQueries([“reports”]);
setDone(true);
setTimeout(() => onClose(), 1200);
} catch (e) {
setError(e.response?.data?.error || “Save failed. Try again.”);
} finally {
setSaving(false);
}
};

return (
<div style={S.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
<div style={{ …S.mBox, paddingBottom:48 }}>

```
    {/* Header */}
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <span style={{ fontSize:30 }}>{t.icon}</span>
        <div>
          <div style={{ fontSize:17, fontWeight:800, color:C.slate900 }}>{t.label}</div>
          <div style={{ fontSize:12, color:C.slate500 }}>{t.sublabel}</div>
        </div>
      </div>
      <button onClick={onClose} style={{ background:"none", border:"none", fontSize:26, cursor:"pointer", color:C.slate400 }}>×</button>
    </div>

    {/* Summary pills */}
    <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:24 }}>
      <span style={{ fontSize:12, background:t.bgColor, borderRadius:20, padding:"4px 10px", color:t.color, border:`1px solid ${t.borderColor}`, fontWeight:600 }}>
        {t.businessIcon} {t.businessName}
      </span>
      <span style={{ fontSize:12, background:t.type==="in"?"#ECFDF5":"#FEF2F2", borderRadius:20, padding:"4px 10px", color:t.type==="in"?"#065F46":"#991B1B", border:`1px solid ${t.type==="in"?"#6EE7B7":"#FCA5A5"}`, fontWeight:600 }}>
        {t.type==="in" ? "↑ Cash IN" : "↓ Cash OUT"}
      </span>
      <span style={{ fontSize:12, background:t.mode==="cash"?"#FFFBEB":"#EFF6FF", borderRadius:20, padding:"4px 10px", color:t.mode==="cash"?"#92400E":"#1E40AF", border:`1px solid ${t.mode==="cash"?"#FDE68A":"#93C5FD"}`, fontWeight:600 }}>
        {t.mode==="cash" ? "💵 Cash Pool" : "🏦 Bank / UPI"}
      </span>
    </div>

    {/* Amount */}
    <div style={{ textAlign:"center", marginBottom:6 }}>
      <div style={{ fontSize:12, color:C.slate400, fontWeight:600, textTransform:"uppercase", letterSpacing:0.5, marginBottom:10 }}>Enter Amount</div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:4 }}>
        <span style={{ fontSize:32, color:C.slate300, fontWeight:700 }}>₹</span>
        <input
          type="number" inputMode="numeric" placeholder="0"
          value={amount}
          onChange={e=>{ setAmount(e.target.value); setError(""); }}
          onKeyDown={e=>e.key==="Enter" && save()}
          autoFocus
          style={{
            border:"none", borderBottom:`3px solid ${t.color}`,
            fontSize:48, fontWeight:900, width:"65%", textAlign:"center",
            outline:"none", background:"transparent",
            fontFamily:"inherit", color:C.slate900, padding:"4px 0",
          }}
        />
      </div>
    </div>

    {/* Note */}
    <div style={{ marginTop:20 }}>
      <div style={{ fontSize:11, fontWeight:600, color:C.slate400, textTransform:"uppercase", letterSpacing:0.5, marginBottom:6 }}>Note (optional)</div>
      <input style={{ ...S.input, marginTop:0, background:"#F8FAFC" }}
        placeholder="Patient name, bill no, any note..."
        value={desc} onChange={e=>setDesc(e.target.value)}
        onKeyDown={e=>e.key==="Enter" && save()} />
    </div>

    {/* Date Picker */}
    <div style={{ marginTop:16 }}>
      <div style={{ fontSize:11, fontWeight:600, color:C.slate400, textTransform:"uppercase", letterSpacing:0.5, marginBottom:6 }}>Transaction Date</div>
      <input
        type="date"
        value={date}
        max={todayStr()}
        onChange={e=>setDate(e.target.value)}
        style={{
          ...S.input, marginTop:0, fontFamily:"inherit",
          color:       isBackdated ? "#92400E" : C.slate900,
          background:  isBackdated ? "#FFFBEB" : "#F8FAFC",
          borderColor: isBackdated ? "#FDE68A" : C.slate200,
        }}
      />
      {isBackdated && (
        <div style={{ marginTop:6, fontSize:12, color:"#92400E", background:"#FFFBEB", borderRadius:8, padding:"6px 10px" }}>
          📅 Back-dated entry for <strong>{new Date(date+"T00:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</strong>
        </div>
      )}
    </div>

    {/* Error */}
    {error && (
      <div style={{ background:"#FEF2F2", color:C.red, borderRadius:10, padding:"10px 14px", fontSize:13, marginTop:12 }}>
        ⚠️ {error}
      </div>
    )}

    {/* Save / Success */}
    {done ? (
      <div style={{ marginTop:16, background:"#ECFDF5", borderRadius:12, padding:18, textAlign:"center", fontSize:18, fontWeight:800, color:"#065F46" }}>
        ✅ {INR(parseFloat(amount))} saved!
      </div>
    ) : (
      <button onClick={save} disabled={saving || !amount}
        style={{
          ...S.btn,
          background: !amount ? C.slate200 : t.type==="in" ? C.green : C.red,
          color:       !amount ? C.slate400 : C.white,
          fontSize:18, marginTop:20, opacity:saving?0.7:1,
        }}>
        {saving ? "Saving..." : `✓ Save  ${amount ? INR(parseFloat(amount)||0) : ""}`}
      </button>
    )}
  </div>
</div>
```

);
}