require("dotenv").config();
const express   = require("express");
const cors      = require("cors");
const rateLimit = require("express-rate-limit");

// ── Crash guard — keep server alive on unhandled errors ──────────
process.on("uncaughtException",  (err) => console.error("UNCAUGHT:",  err.message, err.stack));
process.on("unhandledRejection", (r)   => console.error("UNHANDLED:", r));

// ── Validate required env vars at startup ────────────────────────
const REQUIRED_ENV = ["DATABASE_URL","JWT_SECRET","JWT_REFRESH_SECRET"];
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length) {
  console.error("FATAL: Missing required env vars:", missing.join(", "));
  process.exit(1);
}

const app  = express();
const PORT = process.env.PORT || 4000;

app.set("trust proxy", 1);

app.use(cors({
  origin: (origin, cb) => cb(null, true),
  credentials: true,
  methods: ["GET","POST","PUT","DELETE","OPTIONS","PATCH"],
  allowedHeaders: ["Content-Type","Authorization","Accept"],
}));
app.options("*", cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.ip || req.headers["x-forwarded-for"] || "unknown",
  handler: (req, res) => res.status(429).json({ error: "Too many attempts. Try again in 15 minutes." }),
});

app.get("/health", (_, res) => res.json({ status: "ok", ts: new Date() }));
app.use("/api/auth",         loginLimiter, require("./routes/auth"));
app.use("/api/businesses",   require("./routes/businesses"));
app.use("/api/transactions", require("./routes/transactions"));
app.use("/api/transfers",    require("./routes/transfers"));
app.use("/api/partners",     require("./routes/partners"));
app.use("/api/reports",      require("./routes/reports"));
app.use("/api/dashboard",    require("./routes/dashboard"));

app.use((err, req, res, next) => {
  console.error("GLOBAL ERR:", err.message);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

app.listen(PORT, () => console.log(`✅ BizLedger API running on port ${PORT}`));
