export const C = {
  // Colors
  slate900: "#0F172A",
  slate700: "#334155",
  slate500: "#64748B",
  slate300: "#CBD5E1",
  slate200: "#E2E8F0",
  slate100: "#F1F5F9",
  slate50:  "#F8FAFC",
  blue:     "#2563EB",
  green:    "#10B981",
  red:      "#EF4444",
  amber:    "#F59E0B",
  purple:   "#7C3AED",
  purple2:  "#8B5CF6",
  dark:     "#1E293B",
  white:    "#FFFFFF",
  // Semantic
  income:  "#10B981",
  expense: "#EF4444",
  cash:    "#F59E0B",
  bank:    "#2563EB",
  partner: "#7C3AED",
};

export const S = {
  // Layout
  screen: { minHeight: "100dvh", background: C.slate50, paddingBottom: 80 },
  header: { background: C.dark, color: C.white, padding: "20px 20px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  // Cards
  card:   { background: C.white, borderRadius: 16, padding: 20, boxShadow: "0 4px 24px rgba(0,0,0,0.07)" },
  rCard:  { background: C.white, borderRadius: 14, padding: "14px 18px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", marginBottom: 10 },
  // Typography
  title:  { fontSize: 18, fontWeight: 700, color: C.white },
  sub:    { fontSize: 12, opacity: 0.65, marginTop: 2, color: C.white },
  label:  { fontSize: 11, fontWeight: 700, color: C.slate500, textTransform: "uppercase", letterSpacing: 0.8 },
  // List
  txList: { background: C.white, borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  txItem: { display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: `1px solid ${C.slate100}` },
  // Form
  input:  { width: "100%", border: `1.5px solid ${C.slate200}`, borderRadius: 10, padding: "12px 14px", fontSize: 15, outline: "none", boxSizing: "border-box", fontFamily: "inherit", background: C.white },
  fLabel: { fontSize: 12, fontWeight: 600, color: C.slate500, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 16, display: "block" },
  // Buttons
  btn:    { width: "100%", padding: 16, borderRadius: 12, border: "none", fontSize: 16, fontWeight: 700, cursor: "pointer", marginTop: 12, fontFamily: "inherit" },
  pill:   { padding: "8px 14px", borderRadius: 20, border: `1.5px solid ${C.slate200}`, background: C.white, fontSize: 13, cursor: "pointer", fontFamily: "inherit" },
  chip:   { padding: "6px 12px", borderRadius: 20, fontSize: 12, border: `1.5px solid ${C.slate200}`, cursor: "pointer", background: C.white, fontFamily: "inherit", whiteSpace: "nowrap" },
  // Modal
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" },
  mBox:    { background: C.white, borderRadius: "22px 22px 0 0", width: "100%", maxWidth: 480, padding: "24px 20px 44px", maxHeight: "92dvh", overflowY: "auto" },
  // Misc
  toggle:  { display: "flex", background: C.slate100, borderRadius: 12, padding: 4, gap: 4 },
  tBtn:    { flex: 1, padding: 10, borderRadius: 8, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" },
  divider: { height: 1, background: C.slate100, margin: "12px 0" },
  avatar:  { borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: C.white, flexShrink: 0 },
  tday:    { display: "flex", alignItems: "center", gap: 8, borderRadius: 10, padding: "10px 14px", flex: 1 },
};

export const AVATAR_COLORS = ["#3B82F6","#8B5CF6","#10B981","#F59E0B","#EF4444","#06B6D4","#EC4899"];

export const INR = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");

export const TODAY = () => {
  const d = new Date();
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
};

export const MONTH_STR = (offset = 0) => {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export const MONTH_LABEL = (m) => {
  const [y, mo] = m.split("-");
  return new Date(y, mo - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
};
