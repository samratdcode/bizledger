require("dotenv").config();
const express    = require("express");
const cors       = require("cors");
const rateLimit  = require("express-rate-limit");

const authRoutes        = require("./routes/auth");
const businessRoutes    = require("./routes/businesses");
const transactionRoutes = require("./routes/transactions");
const transferRoutes    = require("./routes/transfers");
const partnerRoutes     = require("./routes/partners");
const reportRoutes      = require("./routes/reports");
const dashboardRoutes   = require("./routes/dashboard");

const app  = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 4000;

// ── Middleware ──────────────────────────────────────────────────
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || "http://localhost:5173",
    /\.vercel\.app$/,
  ],
  credentials: true,
}));
app.use(express.json());

// Rate limit login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many attempts. Try again in 15 minutes." },
});

// ── Routes ──────────────────────────────────────────────────────
app.get("/health", (_, res) => res.json({ status: "ok", ts: new Date() }));

app.use("/api/auth",         loginLimiter, authRoutes);
app.use("/api/businesses",   businessRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/transfers",    transferRoutes);
app.use("/api/partners",     partnerRoutes);
app.use("/api/reports",      reportRoutes);
app.use("/api/dashboard",    dashboardRoutes);

// ── Global error handler ────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

app.listen(PORT, () => console.log(`✅ BizLedger API running on port ${PORT}`));
