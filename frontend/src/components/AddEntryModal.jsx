import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api.js";
import { INR, S, C } from "../styles.js";

// ── Templates ────────────────────────────────────────────────────
const TEMPLATES = [
  { id:"t1", label:"Medicine Sale", sublabel:"Cash", icon:"💊", color:"#10B981", bgColor:"#ECFDF5", borderColor:"#6EE7B7", bizType:"pharmacy", type:"in", mode:"cash", category:"Medicine Sale" },
  { id:"t2", label:"Medicine Sale", sublabel:"GPay", icon:"💊", color:"#2563EB", bgColor:"#EFF6FF", borderColor:"#93C5FD", bizType:"pharmacy", type:"in", mode:"bank", category:"Medicine Sale" },
  { id:"t3", label:"Nursing Home", sublabel:"Cash", icon:"🏥", color:"#3B82F6", bgColor:"#EFF6FF", borderColor:"#93C5FD", bizType:"nursing_home", type:"in", mode:"cash", category:"Collection" },
  { id:"t4", label:"Diagnostic", sublabel:"Cash", icon:"🔬", color:"#8B5CF6", bgColor:"#F5F3FF", borderColor:"#C4B5FD", bizType:"diagnostic", type:"in", mode:"cash", category:"Collection" },
  { id:"t5", label:"Diagnostic", sublabel:"UPI", icon:"🔬", color:"#2563EB", bgColor:"#EFF6FF", borderColor:"#93C5FD", bizType:"diagnostic", type:"in", mode:"bank", category:"Collection" },
];

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};

const newRow = (id) => ({ id, templateId: "t1", amount: "", note: "" });

let rowCounter = 1;

export default function QuickAdd({ openVoice }) {
  const qc = useQueryClient();

  const [date, setDate] = useState(todayStr());
  const [rows, setRows] = useState([newRow(rowCounter++)]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");

  const { data: bizData } = useQuery({
    queryKey: ["businesses"],
    queryFn: () => api.get("/businesses").then(r => r.data),
  });

  const { data: dashData } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api.get("/dashboard").then(r => r.data),
    refetchInterval: 20000,
  });

  const businesses = bizData?.businesses || [];
  const sharedCash = dashData?.sharedCash || 0;
  const todayIn = dashData?.today?.in || 0;
  const todayOut = dashData?.today?.out || 0;

  const isBackdated = date !== todayStr();

  const getBiz = (bizType) => businesses.find(b => b.type === bizType);
  const getTpl = (id) => TEMPLATES.find(t => t.id === id);

  const batchTotal = rows.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);

  const addRow = () => setRows(prev => [...prev, newRow(rowCounter++)]);

  const removeRow = (id) => {
    if (rows.length === 1) return;
    setRows(prev => prev.filter(r => r.id !== id));
    setErrors(prev => {
      const e = { ...prev };
      delete e[id];
      return e;
    });
  };

  const updateRow = (id, field, value) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
    if (errors[id]) {
      setErrors(prev => {
        const e = { ...prev };
        delete e[id];
        return e;
      });
    }
  };

  const saveAll = async () => {
    const newErrors = {};
    let valid = true;

    rows.forEach(r => {
      const amt = parseFloat(r.amount);
      if (!r.amount || isNaN(amt) || amt <= 0) {
        newErrors[r.id] = "Enter an amount";
        valid = false;
      }
    });

    if (!valid) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);
    setGlobalError("");

    try {
      await Promise.all(rows.map(r => {
        const tpl = getTpl(r.templateId);
        const biz = getBiz(tpl.bizType);

        if (!biz) throw new Error(`Business not found for ${tpl.label}`);

        return api.post("/transactions", {
          businessId: biz.id,
          type: tpl.type,
          amount: parseFloat(r.amount),
          mode: tpl.mode,
          category: tpl.category,
          description: r.note || tpl.label,
          txDate: date,
        });
      }));

      qc.invalidateQueries(["dashboard"]);
      qc.invalidateQueries(["allTxs"]);
      qc.invalidateQueries(["bizTxs"]);
      qc.invalidateQueries(["reports"]);

      setSaved(true);
      setRows([newRow(rowCounter++)]);
      setErrors({});
      setTimeout(() => setSaved(false), 3000);

    } catch (e) {
      setGlobalError(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ ...S.header, justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={S.title}>⚡ Bulk Entry</div>
          <div style={S.sub}>Add multiple transactions · save at once</div>
        </div>

        {openVoice && (
          <button onClick={openVoice} style={{ padding:"8px 12px" }}>
            🎙️ Voice
          </button>
        )}
      </div>

      <div style={{ margin:"0 16px", ...S.card }}>
        <div style={{ display:"flex", gap:10 }}>
          <div style={{ flex:1 }}>💵 {INR(sharedCash)}</div>
          <div style={{ flex:1 }}>↑ {INR(todayIn)}</div>
          <div style={{ flex:1 }}>↓ {INR(todayOut)}</div>
        </div>
      </div>

      <div style={{ padding:"16px" }}>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} />

        {rows.map((row) => (
          <div key={row.id}>
            <input
              value={row.amount}
              onChange={e => updateRow(row.id, "amount", e.target.value)}
            />
          </div>
        ))}

        <button onClick={addRow}>+ Add Row</button>

        <button onClick={saveAll}>
          Save All {INR(batchTotal)}
        </button>
      </div>
    </div>
  );
}