require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const authRoutes = require("./routes/auth");
const businessRoutes = require("./routes/businesses");
const transactionRoutes = require("./routes/transactions");
const transferRoutes = require("./routes/transfers");
const partnerRoutes = require("./routes/partners");
const reportRoutes = require("./routes/reports");
const dashboardRoutes = require("./routes/dashboard");
const app = express();
const PORT = process.env.PORT || 4000;
// ── Trust proxy (required for Railway/Render) ───────────────────
app.set("trust proxy", 1);
// ── CORS — allow all origins (safe because we use JWT auth) ─────
app.use(cors({
 origin: (origin, callback) => {
 // Allow all origins — security is handled by JWT tokens not origin
 // This fixes mobile data (Jio/Airtel) blocking cross-origin POST requests
 callback(null, true);
 },
 credentials: true,
 methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
 allowedHeaders: ["Content-Type", "Authorization", "Accept"],
}));
// Handle preflight OPTIONS requests explicitly
app.options("*", cors());
app.use(express.json());
// ── Rate limit login attempts ───────────────────────────────────
const loginLimiter = rateLimit({
 windowMs: 15 * 60 * 1000,
 max: 20,
 message: { error: "Too many attempts. Try again in 15 minutes." },
 // Required when behind a proxy (Railway/Render)
 keyGenerator: (req) => {
 return req.ip || req.headers["x-forwarded-for"] || "unknown";
 },
 skip: () => false,
});
// ── Routes ──────────────────────────────────────────────────────
app.get("/health", (_, res) => res.json({ status: "ok", ts: new Date() }));
app.use("/api/auth", loginLimiter, authRoutes);
app.use("/api/businesses", businessRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/transfers", transferRoutes);
app.use("/api/partners", partnerRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/dashboard", dashboardRoutes);
// ── Global error handler ────────────────────────────────────────
app.use((err, req, res, next) => {
 console.error(err);
 res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});
app.listen(PORT, () => console.log(` BizLedger API running on port ${PORT}`));
