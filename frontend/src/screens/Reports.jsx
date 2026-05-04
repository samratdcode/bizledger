import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../api.js";
import { INR, S, C, MONTH_STR, MONTH_LABEL } from "../styles.js";

export default function Reports() {
  const [monthOffset,setMonthOffset]=useState(0); const [bizId,setBizId]=useState("all");
  const month=MONTH_STR(monthOffset);
  const { data:bizData } = useQuery({ queryKey:["businesses"], queryFn:()=>api.get("/businesses").then(r=>r.data) });
  const businesses=bizData?.businesses||[];
  const params=new URLSearchParams({month}); if(bizId!=="all") params.set("businessId",bizId);
  const { data, isLoading } = useQuery({ queryKey:["reports",month,bizId], queryFn:()=>api.get(`/reports?${params}`).then(r=>r.data), placeholderData:(prev)=>prev });
  const summary=data?.summary||{}, byBiz=data?.byBusiness||[], byCat=data?.byCategory||{}, balances=data?.balances||{}, drawings=data?.drawings||[], personalOuts=data?.personalOuts||[];
  return (
    <div>
      <div style={{ ...S.header, justifyContent:"space-between", alignItems:"center" }}><div style={S.title}>Reports</div></div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 20px", background:C.white, borderBottom:`1px solid ${C.slate200}` }}>
        <button onClick={()=>setMonthOffset(o=>o-1)} style={{ background:"none", border:"none", fontSize:22, cursor:"pointer", color:C.slate500 }}>◀</button>
        <div style={{ fontWeight:700, fontSize:15, color:C.slate900 }}>{MONTH_LABEL(month)}</div>
        <button onClick={()=>setMonthOffset(o=>Math.min(0,o+1))} style={{ background:"none", border:"none", fontSize:22, cursor:"pointer", color:monthOffset===0?C.slate300:C.slate500 }}>▶</button>
      </div>
      <div style={{ display:"flex", gap:6, padding:"12px 16px", overflowX:"auto" }}>
        <button style={{ ...S.chip, ...(bizId==="all"?{background:"#EFF6FF",borderColor:C.blue,color:C.blue}:{}) }} onClick={()=>setBizId("all")}>All</button>
        {businesses.map(b=>(
          <button key={b.id} style={{ ...S.chip, ...(bizId===b.id?{background:b.color+"18",borderColor:b.color,color:b.color}:{}) }} onClick={()=>setBizId(b.id)}>{b.icon} {b.name.split(" ")[0]}</button>
        ))}
      </div>
      {isLoading?<div style={{ textAlign:"center", padding:40, color:C.slate500 }}>Loading...</div>:(
        <div style={{ padding:"0 16px" }}>
          {/* P&L */}
          <div style={S.rCard}>
            <div style={{ ...S.label, marginBottom:12 }}>Operating Performance</div>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
              <div><div style={{ fontSize:11, color:C.slate500, fontWeight:600 }}>INCOME</div><div style={{ fontSize:22, fontWeight:900, color:C.green }}>{INR(summary.totalIn)}</div></div>
              <div style={{ textAlign:"right" }}><div style={{ fontSize:11, color:C.slate500, fontWeight:600 }}>EXPENSES</div><div style={{ fontSize:22, fontWeight:900, color:C.red }}>{INR(summary.totalOut)}</div></div>
            </div>
            <div style={{ borderTop:`1px solid ${C.slate100}`, paddingTop:12, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.slate500 }}>OPERATING PROFIT</div>
              <div style={{ fontSize:22, fontWeight:900, color:(summary.operatingProfit||0)>=0?C.green:C.red }}>{INR(summary.operatingProfit)}</div>
            </div>
          </div>
          {/* Partner Outflows */}
          <div style={{ ...S.rCard, border:`1.5px solid #DDD6FE` }}>
            <div style={{ ...S.label, color:C.purple, marginBottom:12 }}>🤝 Partner Outflows (not an expense)</div>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}><div style={{ fontSize:13, color:C.slate500 }}>Monthly drawings</div><div style={{ fontSize:14, fontWeight:700, color:C.purple }}>{INR(summary.totalDrawings)}</div></div>
            {drawings.map(d=>(<div key={d.id} style={{ display:"flex", justifyContent:"space-between", padding:"4px 0 4px 12px", fontSize:12, borderBottom:`1px solid ${C.slate100}` }}><span style={{ color:C.slate600 }}>· {d.partner?.name}</span><span style={{ fontWeight:600, color:C.purple }}>{INR(d.amount)}</span></div>))}
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:12, marginBottom:6 }}><div style={{ fontSize:13, color:C.slate500 }}>Personal cash outs</div><div style={{ fontSize:14, fontWeight:700, color:"#EA580C" }}>{INR(summary.totalPersonalOuts)}</div></div>
            {personalOuts.length>0?personalOuts.map(p=>(<div key={p.id} style={{ display:"flex", justifyContent:"space-between", padding:"4px 0 4px 12px", fontSize:12, borderBottom:`1px solid ${C.slate100}` }}><span style={{ color:C.slate600, flex:1, minWidth:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>· {p.partner?.name} — {p.description}</span><span style={{ fontWeight:600, color:"#EA580C", flexShrink:0, marginLeft:8 }}>{INR(p.amount)}</span></div>)):<div style={{ fontSize:12, color:C.slate400, paddingLeft:12, marginBottom:6 }}>No personal cash outs this month</div>}
            <div style={S.divider} />
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:4 }}><span style={{ color:C.slate500 }}>Operating Profit</span><span style={{ fontWeight:700, color:(summary.operatingProfit||0)>=0?C.green:C.red }}>{INR(summary.operatingProfit)}</span></div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:4 }}><span style={{ color:C.slate500 }}>− Monthly drawings</span><span style={{ fontWeight:700, color:C.purple }}>− {INR(summary.totalDrawings)}</span></div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:8 }}><span style={{ color:C.slate500 }}>− Personal cash outs</span><span style={{ fontWeight:700, color:"#EA580C" }}>− {INR(summary.totalPersonalOuts)}</span></div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:16, fontWeight:900, borderTop:`1px solid ${C.slate100}`, paddingTop:10 }}>
              <span>Net After All Partner Outflows</span>
              <span style={{ color:(summary.netAfterDrawings||0)>=0?C.green:C.red }}>{INR(summary.netAfterDrawings)}</span>
            </div>
            <div style={{ marginTop:10, fontSize:11, color:C.purple, background:"#F5F3FF", borderRadius:8, padding:"6px 10px" }}>ℹ️ Partner outflows are profit distributions — they don't affect operating profit.</div>
          </div>
          {/* Balances */}
          <div style={S.rCard}>
            <div style={{ ...S.label, marginBottom:10 }}>Current Balances</div>
            <div style={{ background:"#FFFBEB", borderRadius:10, padding:"10px 12px", marginBottom:8, display:"flex", justifyContent:"space-between" }}><span style={{ fontSize:13, fontWeight:600, color:"#92400E" }}>💵 Shared Cash Pool</span><span style={{ fontSize:15, fontWeight:800, color:"#92400E" }}>{INR(balances.sharedCash)}</span></div>
            {(balances.businesses||[]).map(b=>(<div key={b.id} style={{ display:"flex", justifyContent:"space-between", background:C.slate50, borderRadius:10, padding:"8px 12px", marginBottom:6, borderLeft:`3px solid ${b.color}` }}><span style={{ fontSize:13, fontWeight:600 }}>{b.icon} {b.name} Bank</span><span style={{ fontSize:14, fontWeight:800, color:b.color }}>{INR(b.bank)}</span></div>))}
          </div>
          {/* By Business */}
          {bizId==="all"&&(<>
            <div style={{ ...S.label, margin:"14px 0 8px" }}>By Business</div>
            {byBiz.length===0&&<div style={{...S.rCard,textAlign:"center",color:C.slate400,fontSize:13}}>No transactions for this period</div>}
            {byBiz.map(b=>(<div key={b.id} style={{ ...S.rCard, borderLeft:`4px solid ${b.color}` }}><div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}><div style={{ display:"flex", alignItems:"center", gap:10 }}><span style={{ fontSize:22 }}>{b.icon}</span><div><div style={{ fontSize:14, fontWeight:700 }}>{b.name}</div><div style={{ fontSize:12, color:C.slate400 }}>↑{INR(b.income)} ↓{INR(b.expenses)}</div></div></div><div style={{ fontSize:17, fontWeight:800, color:(b.income-b.expenses)>=0?b.color:C.red }}>{INR(b.income-b.expenses)}</div></div></div>))}
          </>)}
          {/* By Category */}
          {Object.keys(byCat).length>0&&(<>
            <div style={{ ...S.label, margin:"14px 0 8px" }}>By Category</div>
            {Object.entries(byCat).sort((a,b)=>(b[1].in+b[1].out)-(a[1].in+a[1].out)).map(([cat,vals])=>(<div key={cat} style={{ ...S.rCard, padding:"12px 16px" }}><div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}><span style={{ fontSize:14, fontWeight:600 }}>{cat}</span><div style={{ textAlign:"right" }}>{vals.in>0&&<div style={{ fontSize:13, fontWeight:700, color:C.green }}>+{INR(vals.in)}</div>}{vals.out>0&&<div style={{ fontSize:13, fontWeight:700, color:C.red }}>-{INR(vals.out)}</div>}</div></div></div>))}
          </>)}
        </div>
      )}
    </div>
  );
}
