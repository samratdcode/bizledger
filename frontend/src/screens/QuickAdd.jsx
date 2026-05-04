import React, { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api.js";
import { INR, S, C } from "../styles.js";

const TEMPLATES = [
  { id:"t1", label:"Medicine Sale", sublabel:"Cash", icon:"💊", color:"#10B981", bgColor:"#ECFDF5", borderColor:"#6EE7B7", bizType:"pharmacy",    type:"in", mode:"cash", category:"Medicine Sale" },
  { id:"t2", label:"Medicine Sale", sublabel:"GPay", icon:"💊", color:"#2563EB", bgColor:"#EFF6FF", borderColor:"#93C5FD", bizType:"pharmacy",    type:"in", mode:"bank", category:"Medicine Sale" },
  { id:"t3", label:"Nursing Home",  sublabel:"Cash", icon:"🏥", color:"#3B82F6", bgColor:"#EFF6FF", borderColor:"#93C5FD", bizType:"nursing_home",type:"in", mode:"cash", category:"Collection"    },
  { id:"t4", label:"Diagnostic",    sublabel:"Cash", icon:"🔬", color:"#8B5CF6", bgColor:"#F5F3FF", borderColor:"#C4B5FD", bizType:"diagnostic",  type:"in", mode:"cash", category:"Collection"    },
  { id:"t5", label:"Diagnostic",    sublabel:"UPI",  icon:"🔬", color:"#2563EB", bgColor:"#EFF6FF", borderColor:"#93C5FD", bizType:"diagnostic",  type:"in", mode:"bank", category:"Collection"    },
];

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};

export default function QuickAdd({ openVoice }) {
  const qc = useQueryClient();
  // FIX: rowId as useRef (not module-level mutable) — safe in Strict Mode
  const rowIdRef = useRef(1);
  const nextId = () => rowIdRef.current++;

  const [date,      setDate]      = useState(todayStr());
  const [rows,      setRows]      = useState([{ id: nextId(), tplId:"t1", amount:"", note:"" }]);
  const [saving,    setSaving]    = useState(false);
  const [saveResults, setSaveResults] = useState(null); // null | { saved, failed }
  const [rowErr,    setRowErr]    = useState({});
  const [globalErr, setGlobalErr] = useState("");

  const { data: bizData }  = useQuery({ queryKey:["businesses"], queryFn:()=>api.get("/businesses").then(r=>r.data) });
  const { data: dashData } = useQuery({ queryKey:["dashboard"],  queryFn:()=>api.get("/dashboard").then(r=>r.data), placeholderData:(prev)=>prev });

  const businesses = bizData?.businesses || [];
  const sharedCash = dashData?.sharedCash || 0;
  const todayIn    = dashData?.today?.in  || 0;
  const todayOut   = dashData?.today?.out || 0;
  const isBackdated = date !== todayStr();
  const batchTotal  = rows.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);

  const getBiz = (bizType) => businesses.find(b => b.type === bizType);
  const getTpl = (id)      => TEMPLATES.find(t => t.id === id);

  const addRow    = ()       => setRows(p => [...p, { id: nextId(), tplId:"t1", amount:"", note:"" }]);
  const removeRow = (id)     => { if (rows.length === 1) return; setRows(p => p.filter(r => r.id !== id)); };
  const updRow    = (id,f,v) => {
    setRows(p => p.map(r => r.id === id ? { ...r, [f]: v } : r));
    setRowErr(p => { const e = {...p}; delete e[id]; return e; });
  };

  const saveAll = async () => {
    // Validate
    const errs = {};
    rows.forEach(r => { if (!r.amount || parseFloat(r.amount) <= 0) errs[r.id] = "Enter amount"; });
    if (Object.keys(errs).length) { setRowErr(errs); return; }

    setSaving(true); setGlobalErr(""); setSaveResults(null);

    // FIX: Use Promise.allSettled — shows per-row status instead of silent partial saves
    const results = await Promise.allSettled(
      rows.map(r => {
        const tpl = getTpl(r.tplId);
        const biz = getBiz(tpl.bizType);
        if (!biz) return Promise.reject(new Error(`Business not found for ${tpl.label}`));
        return api.post("/transactions", {
          businessId:  biz.id,
          type:        tpl.type,
          amount:      parseFloat(r.amount),
          mode:        tpl.mode,
          category:    tpl.category,
          description: r.note.trim() || `${tpl.label} · ${tpl.sublabel}`,
          txDate:      date,
        });
      })
    );

    const saved  = results.filter(r => r.status === "fulfilled").length;
    const failed = results.filter(r => r.status === "rejected").length;

    if (saved > 0) {
      qc.invalidateQueries(["dashboard"]);
      qc.invalidateQueries(["allTxs"]);
      qc.invalidateQueries(["bizTxs"]);
      qc.invalidateQueries(["reports"]);
    }

    setSaveResults({ saved, failed });

    if (failed === 0) {
      // All succeeded — reset
      setRows([{ id: nextId(), tplId:"t1", amount:"", note:"" }]);
      setRowErr({});
      setTimeout(() => setSaveResults(null), 3000);
    } else {
      // Partial failure — highlight failed rows
      const failedErrs = {};
      results.forEach((r, i) => {
        if (r.status === "rejected") {
          failedErrs[rows[i].id] = r.reason?.response?.data?.error || "Save failed";
        }
      });
      setRowErr(failedErrs);
      // Remove successfully saved rows
      const savedIndices = new Set(results.map((r,i) => r.status === "fulfilled" ? i : -1).filter(i => i >= 0));
      setRows(p => p.filter((_, i) => !savedIndices.has(i)));
    }

    setSaving(false);
  };

  return (
    <div>
      <div style={{ ...S.header, justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={S.title}>⚡ Bulk Entry</div>
          <div style={S.sub}>Add multiple transactions · save at once</div>
        </div>
        {openVoice && (
          <button onClick={openVoice} style={{ background:"rgba(255,255,255,0.15)", border:"1.5px solid rgba(255,255,255,0.3)", borderRadius:12, padding:"8px 14px", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:6 }}>
            🎙️ Voice
          </button>
        )}
      </div>

      {/* Snapshot */}
      <div style={{ margin:"0 16px", marginTop:-6, ...S.card }}>
        <div style={{ display:"flex", gap:10 }}>
          <div style={{ flex:1, background:"#FFFBEB", borderRadius:10, padding:"10px 12px" }}><div style={{ fontSize:10, color:"#92400E", fontWeight:700, textTransform:"uppercase", letterSpacing:0.5 }}>💵 Cash Pool</div><div style={{ fontSize:15, fontWeight:900, color:"#92400E", marginTop:2 }}>{INR(sharedCash)}</div></div>
          <div style={{ flex:1, background:"#ECFDF5", borderRadius:10, padding:"10px 12px" }}><div style={{ fontSize:10, color:"#065F46", fontWeight:700, textTransform:"uppercase", letterSpacing:0.5 }}>↑ Today IN</div><div style={{ fontSize:15, fontWeight:900, color:"#065F46", marginTop:2 }}>{INR(todayIn)}</div></div>
          <div style={{ flex:1, background:"#FEF2F2", borderRadius:10, padding:"10px 12px" }}><div style={{ fontSize:10, color:"#991B1B", fontWeight:700, textTransform:"uppercase", letterSpacing:0.5 }}>↓ Today OUT</div><div style={{ fontSize:15, fontWeight:900, color:"#991B1B", marginTop:2 }}>{INR(todayOut)}</div></div>
        </div>
      </div>

      <div style={{ padding:"0 16px" }}>
        {/* Date picker */}
        <div style={{ marginTop:16 }}>
          <div style={{ ...S.label, marginBottom:8 }}>📅 Date for all entries</div>
          <input type="date" value={date} max={todayStr()} onChange={e => setDate(e.target.value)}
            style={{ ...S.input, marginTop:0, fontFamily:"inherit", color:isBackdated?"#92400E":"#0F172A", background:isBackdated?"#FFFBEB":"#fff", borderColor:isBackdated?"#FDE68A":"#E2E8F0", fontSize:15 }} />
          {isBackdated && <div style={{ marginTop:6, fontSize:12, color:"#92400E", background:"#FFFBEB", borderRadius:8, padding:"6px 10px" }}>📅 Back-dated — all entries logged for <strong>{new Date(date+"T00:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</strong></div>}
        </div>

        {/* Save result feedback */}
        {saveResults && saveResults.failed === 0 && (
          <div style={{ marginTop:12, background:"#ECFDF5", border:"1.5px solid #6EE7B7", borderRadius:12, padding:"12px 16px", textAlign:"center", fontSize:15, fontWeight:700, color:"#065F46" }}>
            ✅ All {saveResults.saved} {saveResults.saved === 1 ? "entry" : "entries"} saved!
          </div>
        )}
        {saveResults && saveResults.failed > 0 && (
          <div style={{ marginTop:12, background:"#FEF2F2", border:"1.5px solid #FCA5A5", borderRadius:12, padding:"12px 16px", fontSize:14, color:C.red }}>
            ⚠️ {saveResults.saved} saved, <strong>{saveResults.failed} failed</strong>. Failed rows shown below — fix and retry.
          </div>
        )}

        {/* Rows */}
        <div style={{ marginTop:16, display:"flex", flexDirection:"column", gap:12 }}>
          {rows.map((row, idx) => {
            const tpl    = getTpl(row.tplId);
            const err    = rowErr[row.id];
            const bizObj = getBiz(tpl.bizType);
            return (
              <div key={row.id} style={{ background:"#fff", borderRadius:14, border:`1.5px solid ${err?C.red:tpl.borderColor}`, boxShadow:"0 2px 8px rgba(0,0,0,0.06)", overflow:"hidden" }}>
                <div style={{ background:tpl.bgColor, padding:"10px 14px", borderBottom:`1px solid ${tpl.borderColor}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:20 }}>{tpl.icon}</span>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:tpl.color }}>{tpl.label} · {tpl.sublabel}</div>
                      <div style={{ fontSize:11, color:tpl.color, opacity:0.8 }}>{bizObj?.name} · {tpl.mode==="cash"?"💵 Cash Pool":"🏦 Bank/UPI"}</div>
                    </div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:11, color:C.slate400, fontWeight:600 }}>#{idx+1}</span>
                    {rows.length > 1 && (
                      <button onClick={() => removeRow(row.id)} style={{ background:"#FEF2F2", border:"none", color:C.red, borderRadius:20, width:24, height:24, cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"inherit" }}>×</button>
                    )}
                  </div>
                </div>
                <div style={{ padding:"10px 14px 0", display:"flex", gap:6, overflowX:"auto", paddingBottom:10 }}>
                  {TEMPLATES.map(t => (
                    <button key={t.id} onClick={() => updRow(row.id,"tplId",t.id)}
                      style={{ display:"flex", alignItems:"center", gap:4, whiteSpace:"nowrap", padding:"5px 10px", borderRadius:20, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit", border:`1.5px solid ${row.tplId===t.id?t.color:C.slate200}`, background:row.tplId===t.id?t.color:C.white, color:row.tplId===t.id?C.white:C.slate500, flexShrink:0 }}>
                      {t.icon} {t.label.split(" ")[0]} {t.sublabel}
                    </button>
                  ))}
                </div>
                <div style={{ padding:"0 14px 14px", display:"flex", gap:10, alignItems:"flex-start" }}>
                  <div style={{ flex:"0 0 120px" }}>
                    <div style={{ fontSize:10, color:C.slate400, fontWeight:700, textTransform:"uppercase", letterSpacing:0.5, marginBottom:4 }}>Amount (₹)</div>
                    <input type="number" inputMode="numeric" placeholder="0" value={row.amount}
                      onChange={e => updRow(row.id,"amount",e.target.value)}
                      style={{ width:"100%", border:`1.5px solid ${err?C.red:tpl.color}`, borderRadius:10, padding:"10px 12px", fontSize:18, fontWeight:800, outline:"none", fontFamily:"inherit", textAlign:"center", background:err?"#FEF2F2":"#fff", boxSizing:"border-box" }} />
                    {err && <div style={{ fontSize:11, color:C.red, marginTop:4 }}>{err}</div>}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:10, color:C.slate400, fontWeight:700, textTransform:"uppercase", letterSpacing:0.5, marginBottom:4 }}>Note (optional)</div>
                    <input type="text" placeholder="Patient, bill no..." value={row.note}
                      onChange={e => updRow(row.id,"note",e.target.value)}
                      style={{ ...S.input, marginTop:0, padding:"10px 12px", fontSize:13, borderRadius:10 }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button onClick={addRow} style={{ width:"100%", marginTop:10, padding:"13px 0", borderRadius:12, border:`2px dashed ${C.slate300}`, background:C.white, color:C.slate500, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
          + Add Another Entry
        </button>

        <div style={{ marginTop:14, background:C.white, borderRadius:14, padding:"14px 16px", boxShadow:"0 2px 8px rgba(0,0,0,0.06)", marginBottom:24 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <div>
              <div style={{ fontSize:12, color:C.slate500, fontWeight:600 }}>{rows.length} {rows.length===1?"entry":"entries"} to save</div>
              <div style={{ fontSize:20, fontWeight:900, color:C.slate900 }}>{INR(batchTotal)}</div>
            </div>
            <div style={{ fontSize:12, color:C.slate500, textAlign:"right" }}>
              <div style={{ fontWeight:600 }}>Date</div>
              <div style={{ color:isBackdated?"#92400E":C.slate700, fontWeight:700 }}>{new Date(date+"T00:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</div>
            </div>
          </div>
          {/* FIX: cursor:not-allowed when disabled */}
          <button onClick={saveAll} disabled={saving || batchTotal === 0}
            style={{ ...S.btn, marginTop:0, background:batchTotal===0?C.slate200:C.green, color:batchTotal===0?C.slate400:C.white, opacity:saving?0.7:1, fontSize:17, cursor:saving||batchTotal===0?"not-allowed":"pointer" }}>
            {saving ? "Saving all entries..." : `✓ Save ${rows.length} ${rows.length===1?"Entry":"Entries"} · ${INR(batchTotal)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
