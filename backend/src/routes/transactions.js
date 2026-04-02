const router = require("express").Router();
const prisma = require("../db");
const { auth, adminOnly } = require("../middleware/auth");

// GET /api/transactions
router.get("/", auth, async (req, res) => {
  try {
    const {
      businessId, type, mode, category,
      search, startDate, endDate,
      page = 1, limit = 50,
    } = req.query;

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

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          business: { select: { id: true, name: true, icon: true, color: true } },
          user:     { select: { id: true, name: true } },
        },
        orderBy: { txDate: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.transaction.count({ where }),
    ]);

    res.json({ transactions, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

// POST /api/transactions
router.post("/", auth, async (req, res) => {
  try {
    const { businessId, type, amount, mode, category, description, txDate } = req.body;
    if (!businessId || !type || !amount)
      return res.status(400).json({ error: "businessId, type, and amount are required" });
    if (!["in","out"].includes(type))
      return res.status(400).json({ error: "type must be 'in' or 'out'" });
    if (!["cash","bank"].includes(mode || "cash"))
      return res.status(400).json({ error: "mode must be 'cash' or 'bank'" });

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0)
      return res.status(400).json({ error: "Amount must be a positive number" });

    // Use a transaction to update balances atomically
    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          businessId,
          userId:      req.user.id,
          type,
          amount:      amt,
          mode:        mode || "cash",
          category:    category || null,
          description: description || null,
          txDate:      txDate ? new Date(txDate) : new Date(),
        },
        include: {
          business: { select: { id: true, name: true, icon: true, color: true } },
          user:     { select: { id: true, name: true } },
        },
      });

      const delta = type === "in" ? amt : -amt;

      if ((mode || "cash") === "cash") {
        // Update shared cash pool
        const pool = await tx.sharedCashPool.findFirst();
        await tx.sharedCashPool.update({
          where: { id: pool.id },
          data:  { balance: { increment: delta } },
        });
      } else {
        // Update business bank balance
        await tx.business.update({
          where: { id: businessId },
          data:  { bankBalance: { increment: delta } },
        });
      }

      return transaction;
    });

    res.status(201).json({ transaction: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create transaction" });
  }
});

// PUT /api/transactions/:id — admin only
router.put("/:id", auth, adminOnly, async (req, res) => {
  try {
    const { category, description, txDate } = req.body;
    const transaction = await prisma.transaction.update({
      where: { id: req.params.id },
      data:  { category, description, txDate: txDate ? new Date(txDate) : undefined },
    });
    res.json({ transaction });
  } catch {
    res.status(500).json({ error: "Failed to update transaction" });
  }
});

// DELETE /api/transactions/:id — admin only (soft delete, reverses balance)
router.delete("/:id", auth, adminOnly, async (req, res) => {
  try {
    await prisma.$transaction(async (tx) => {
      const txn = await tx.transaction.findUnique({ where: { id: req.params.id } });
      if (!txn || txn.isDeleted) throw new Error("Transaction not found");

      await tx.transaction.update({ where: { id: req.params.id }, data: { isDeleted: true } });

      // Reverse the balance change
      const delta = txn.type === "in" ? -txn.amount : txn.amount;
      if (txn.mode === "cash") {
        const pool = await tx.sharedCashPool.findFirst();
        await tx.sharedCashPool.update({ where: { id: pool.id }, data: { balance: { increment: delta } } });
      } else {
        await tx.business.update({ where: { id: txn.businessId }, data: { bankBalance: { increment: delta } } });
      }
    });
    res.json({ message: "Transaction deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to delete transaction" });
  }
});

module.exports = router;
