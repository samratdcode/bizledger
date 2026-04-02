const router = require("express").Router();
const prisma = require("../db");
const { auth, adminOnly } = require("../middleware/auth");

// GET /api/partners?month=2026-03
router.get("/", auth, async (req, res) => {
  try {
    const month = req.query.month || new Date().toISOString().slice(0, 7);

    const [partners, drawings, personalOuts] = await Promise.all([
      prisma.partner.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
      prisma.drawing.findMany({ where: { month } }),
      prisma.personalCashOut.findMany({
        include: { partner: { select: { id: true, name: true, initials: true, note: true } } },
        orderBy: { paymentDate: "desc" },
      }),
    ]);

    const drawingMap = {};
    drawings.forEach((d) => { drawingMap[d.partnerId] = d; });

    const result = partners.map((p) => ({
      ...p,
      drawing: drawingMap[p.id] || { paid: false, amount: 100000, paidDate: null },
    }));

    const totalPaid         = drawings.filter((d) => d.paid).reduce((s, d) => s + d.amount, 0);
    const paidCount         = drawings.filter((d) => d.paid).length;
    const unpaidCount       = partners.length - paidCount;
    const totalPersonalOuts = personalOuts.reduce((s, p) => s + p.amount, 0);

    res.json({
      partners: result,
      month,
      totalPaid,
      paidCount,
      unpaidCount,
      personalOuts,
      totalPersonalOuts,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch partners" });
  }
});

// POST /api/partners — admin only
router.post("/", auth, adminOnly, async (req, res) => {
  try {
    const { name, initials, note } = req.body;
    if (!name || !initials) return res.status(400).json({ error: "name and initials required" });
    const partner = await prisma.partner.create({ data: { name, initials, note: note || null } });
    res.status(201).json({ partner });
  } catch {
    res.status(500).json({ error: "Failed to create partner" });
  }
});

// PUT /api/partners/:id — admin only
router.put("/:id", auth, adminOnly, async (req, res) => {
  try {
    const { name, initials, note } = req.body;
    const partner = await prisma.partner.update({
      where: { id: req.params.id },
      data:  { name, initials, note },
    });
    res.json({ partner });
  } catch {
    res.status(500).json({ error: "Failed to update partner" });
  }
});

module.exports = router;
