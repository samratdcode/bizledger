export const C = {
  slate900:"#0F172A", slate700:"#334155", slate600:"#475569",
  slate500:"#64748B", slate400:"#94A3B8", slate300:"#CBD5E1",
  slate200:"#E2E8F0", slate100:"#F1F5F9", slate50:"#F8FAFC",
  blue:"#2563EB", green:"#10B981", red:"#EF4444",
  amber:"#F59E0B", purple:"#7C3AED", purple2:"#8B5CF6",
  dark:"#1E293B", white:"#FFFFFF",
};

export const S = {
  header:  { background:"#1E293B", color:"#fff", padding:"20px 20px 16px", display:"flex", justifyContent:"space-between", alignItems:"flex-start" },
  card:    { background:"#fff", borderRadius:16, padding:20, boxShadow:"0 4px 24px rgba(0,0,0,0.07)" },
  rCard:   { background:"#fff", borderRadius:14, padding:"14px 18px", boxShadow:"0 2px 8px rgba(0,0,0,0.06)", marginBottom:10 },
  title:   { fontSize:18, fontWeight:700, color:"#fff" },
  sub:     { fontSize:12, opacity:0.65, marginTop:2, color:"#fff" },
  label:   { fontSize:11, fontWeight:700, color:"#64748B", textTransform:"uppercase", letterSpacing:0.8 },
  txList:  { background:"#fff", borderRadius:14, overflow:"hidden", boxShadow:"0 2px 8px rgba(0,0,0,0.06)" },
  txItem:  { display:"flex", alignItems:"center", gap:12, padding:"12px 16px", borderBottom:"1px solid #F1F5F9" },
  input:   { width:"100%", border:"1.5px solid #E2E8F0", borderRadius:10, padding:"12px 14px", fontSize:15, outline:"none", boxSizing:"border-box", fontFamily:"inherit", background:"#fff" },
  fLabel:  { fontSize:12, fontWeight:600, color:"#64748B", textTransform:"uppercase", letterSpacing:0.5, marginTop:16, display:"block" },
  btn:     { width:"100%", padding:16, borderRadius:12, border:"none", fontSize:16, fontWeight:700, cursor:"pointer", marginTop:12, fontFamily:"inherit" },
  pill:    { padding:"8px 14px", borderRadius:20, border:"1.5px solid #E2E8F0", background:"#fff", fontSize:13, cursor:"pointer", fontFamily:"inherit" },
  chip:    { padding:"6px 12px", borderRadius:20, fontSize:12, border:"1.5px solid #E2E8F0", cursor:"pointer", background:"#fff", fontFamily:"inherit", whiteSpace:"nowrap" },
  overlay: { position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:200, display:"flex", alignItems:"flex-end", justifyContent:"center" },
  mBox:    { background:"#fff", borderRadius:"22px 22px 0 0", width:"100%", maxWidth:480, padding:"24px 20px 44px", maxHeight:"92dvh", overflowY:"auto" },
  toggle:  { display:"flex", background:"#F1F5F9", borderRadius:12, padding:4, gap:4 },
  tBtn:    { flex:1, padding:10, borderRadius:8, border:"none", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s" },
  divider: { height:1, background:"#F1F5F9", margin:"12px 0" },
  avatar:  { borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, color:"#fff", flexShrink:0 },
  tday:    { display:"flex", alignItems:"center", gap:8, borderRadius:10, padding:"10px 14px", flex:1 },
};

export const AVATAR_COLORS = ["#3B82F6","#8B5CF6","#10B981","#F59E0B","#EF4444","#06B6D4","#EC4899"];
export const INR = (n) => "₹" + Number(n||0).toLocaleString("en-IN");
export const TODAY = () => new Date().toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short",year:"numeric"});
export const MONTH_STR = (offset=0) => { const d=new Date(); d.setMonth(d.getMonth()+offset); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; };
export const MONTH_LABEL = (m) => { const [y,mo]=m.split("-"); return new Date(y,mo-1,1).toLocaleDateString("en-IN",{month:"long",year:"numeric"}); };
