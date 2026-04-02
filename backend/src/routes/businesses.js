const router = require("express").Router();
const prisma = require("../db");
const { auth, adminOnly } = require("../middleware/auth");

// GET /api/businesses
router.get("/", auth, async (req, res) => {
  try {
    const businesses = await prisma.business.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    res.json({ businesses });
  } catch {
    res.status(500).json({ error: "Failed to fetch businesses" });
  }
});

// GET /api/businesses/:id
router.get("/:id", auth, async (req, res) => {
  try {
    const business = await prisma.business.findUnique({ where: { id: req.params.id } });
    if (!business) return res.status(404).json({ error: "Business not found" });
    res.json({ business });
  } catch {
    res.status(500).json({ error: "Failed to fetch business" });
  }
});

// POST /api/businesses — admin only
router.post("/", auth, adminOnly, async (req, res) => {
  try {
    const { name, type, icon, color } = req.body;
    if (!name || !type) return res.status(400).json({ error: "Name and type required" });
    const business = await prisma.business.create({ data: { name, type, icon: icon || "🏢", color: color || "#3B82F6" } });
    res.status(201).json({ business });
  } catch {
    res.status(500).json({ error: "Failed to create business" });
  }
});

// PUT /api/businesses/:id — admin only
router.put("/:id", auth, adminOnly, async (req, res) => {
  try {
    const { name, icon, color } = req.body;
    const business = await prisma.business.update({
      where: { id: req.params.id },
      data: { name, icon, color },
    });
    res.json({ business });
  } catch {
    res.status(500).json({ error: "Failed to update business" });
  }
});

module.exports = router;
