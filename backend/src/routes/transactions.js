const router = require("express").Router();
const prisma = require("../db");
const { auth, adminOnly } = require("../middleware/auth");

// GET /api/transactions
router.get("/", auth, async (req, res) => {
  try {
    const { businessId, type, mode, category, search, startDate, endDate, page = 1, limit = 50 } = req.query;
    const where = { isDeleted: false };
    if (businessId) where.businessId = businessId;
    if (type)       where.type = type;
    if (mode)       where.mode = mode;
    if (category)   where.category = category;
    if (search)     where.description = { contains: search, mode: "insensitive" };
    if (startDate || endDate) {
      where.txDate = {};
      if (startDate) where.txDate.gte = new Date(startDate);
      if (endDate)   where.txDate.lte = new Date(endDate + "T23:59:59");
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [txs, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          business: { select: { id: true, name: true, icon: true, color: true } },
          user:     { select: { id: true, name: true } },
        },
        orderBy: { txDate: "desc" },
        skip, take: parseInt(limit),
      }),
      prisma.transaction.count({ where }),
    ]);
    res.json({ transactions: txs, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

// POST /api/transactions
router.post("/", auth, async (req, res) => {
  try {
    const { businessId, type, amount, mode, category, description, txDate } = req.body;
    if (!businessId || !type || !amount)
      return res.status(400).json({ error: "businessId, type, and amount are required" });
    if (!["in", "out"].includes(type))
      return res.status(400).json({ error: "type must be 'in' or 'out'" });
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0)
      return res.status(400).json({ error: "Amount must be a positive number" });

    const result = await prisma.$transaction(async (tx) => {
      const t = await tx.transaction.create({
        data: {
          businessId, userId: req.user.id, type,
          amount: amt, mode: mode || "cash",
          category: category || null,
          description: description || null,
          txDate: txDate ? new Date(txDate) : new Date(),
        },
        include: {
          business: { select: { id: true, name: true, icon: true, color: true } },
          user:     { select: { id: true, name: true } },
        },
      });
      const delta = type === "in" ? amt : -amt;
      if ((mode || "cash") === "cash") {
        // FIX: null-guard pool before accessing pool.id
        const pool = await tx.sharedCashPool.findFirst();
        if (!pool) throw new Error("Cash pool not initialised. Run seed first.");
        await tx.sharedCashPool.update({ where: { id: pool.id }, data: { balance: { increment: delta } } });
      } else {
        await tx.business.update({ where: { id: businessId }, data: { bankBalance: { increment: delta } } });
      }
      return t;
    });
    res.status(201).json({ transaction: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Failed to create transaction" });
  }
});

// PUT /api/transactions/:id
router.put("/:id", auth, adminOnly, async (req, res) => {
  try {
    const { category, description, txDate } = req.body;
    const t = await prisma.transaction.update({
      where: { id: req.params.id },
      data:  { category, description, txDate: txDate ? new Date(txDate) : undefined },
    });
    res.json({ transaction: t });
  } catch {
    res.status(500).json({ error: "Failed to update transaction" });
  }
});

// DELETE /api/transactions/:id
router.delete("/:id", auth, adminOnly, async (req, res) => {
  try {
    await prisma.$transaction(async (tx) => {
      const t = await tx.transaction.findUnique({ where: { id: req.params.id } });
      if (!t || t.isDeleted) throw new Error("Transaction not found");
      await tx.transaction.update({ where: { id: req.params.id }, data: { isDeleted: true } });
      const delta = t.type === "in" ? -t.amount : t.amount;
      if (t.mode === "cash") {
        // FIX: null-guard pool
        const pool = await tx.sharedCashPool.findFirst();
        if (!pool) throw new Error("Cash pool not initialised.");
        await tx.sharedCashPool.update({ where: { id: pool.id }, data: { balance: { increment: delta } } });
      } else {
        await tx.business.update({ where: { id: t.businessId }, data: { bankBalance: { increment: delta } } });
      }
    });
    res.json({ message: "Transaction deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to delete transaction" });
  }
});

module.exports = router;
