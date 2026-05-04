const router  = require("express").Router();
const bcrypt  = require("bcryptjs");
const jwt     = require("jsonwebtoken");
const prisma  = require("../db");
const { auth } = require("../middleware/auth");

const signAccess  = (id) => jwt.sign({ userId: id }, process.env.JWT_SECRET,         { expiresIn: process.env.JWT_EXPIRES_IN         || "15m" });
const signRefresh = (id) => jwt.sign({ userId: id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d" });

// POST /api/auth/login — accepts JSON and URL-encoded (URL-encoded bypasses mobile CORS preflight)
router.post("/login", async (req, res) => {
  try {
    const phone    = String(req.body?.phone    || "").trim();
    const password = String(req.body?.password || "");
    // FIX: Do NOT log phone numbers — DPDP compliance
    console.log("LOGIN ATTEMPT");
    if (!phone || !password)
      return res.status(400).json({ error: "Phone and password required" });

    let user;
    try {
      user = await prisma.user.findUnique({ where: { phone } });
    } catch (e) {
      console.error("DB ERROR during login:", e.message);
      return res.status(500).json({ error: "Database error. Try again." });
    }

    if (!user || !user.isActive)
      return res.status(401).json({ error: "Invalid credentials" });

    let valid;
    try {
      valid = await bcrypt.compare(password, user.passwordHash);
    } catch (e) {
      console.error("BCRYPT ERROR:", e.message);
      return res.status(500).json({ error: "Authentication error. Try again." });
    }

    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    console.log("LOGIN SUCCESS");
    return res.json({
      accessToken:  signAccess(user.id),
      refreshToken: signRefresh(user.id),
      user: { id: user.id, name: user.name, phone: user.phone, role: user.role },
    });
  } catch (err) {
    console.error("UNHANDLED LOGIN ERROR:", err.message);
    return res.status(500).json({ error: "Login failed. Try again." });
  }
});

// POST /api/auth/refresh
router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: "Refresh token required" });
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user    = await prisma.user.findUnique({ where: { id: decoded.userId }, select: { id: true, isActive: true } });
    if (!user || !user.isActive) return res.status(401).json({ error: "User not found" });
    return res.json({ accessToken: signAccess(user.id) });
  } catch {
    return res.status(401).json({ error: "Invalid refresh token" });
  }
});

// GET /api/auth/me
router.get("/me", auth, (req, res) => res.json({ user: req.user }));

// POST /api/auth/change-password
router.post("/change-password", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: "Both passwords required" });
    if (newPassword.length < 6)           return res.status(400).json({ error: "Min 6 characters" });
    const user  = await prisma.user.findUnique({ where: { id: req.user.id } });
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return res.status(400).json({ error: "Current password incorrect" });
    const hash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.user.id }, data: { passwordHash: hash } });
    return res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("CHANGE PASSWORD ERROR:", err.message);
    return res.status(500).json({ error: "Failed to change password" });
  }
});

module.exports = router;
