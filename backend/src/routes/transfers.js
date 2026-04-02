const router = require("express").Router();
const prisma = require("../db");
const { auth, adminOnly } = require("../middleware/auth");

// ── POST /api/transfers/to-business ─────────────────────────────
// Shared cash pool → a business's bank account
router.post("/to-business", auth, adminOnly, async (req, res) => {
  try {
    const { businessId, amount, note } = req.body;
    if (!businessId || !amount)
      return res.status(400).json({ error: "businessId and amount required" });

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0)
      return res.status(400).json({ error: "Amount must be positive" });

    const transfer = await prisma.$transaction(async (tx) => {
      const pool = await tx.sharedCashPool.findFirst();
      if (pool.balance < amt)
        throw new Error(`Insufficient cash pool. Available: ₹${pool.balance.toLocaleString("en-IN")}`);

      await tx.sharedCashPool.update({ where: { id: pool.id }, data: { balance: { decrement: amt } } });
      await tx.business.update({ where: { id: businessId }, data: { bankBalance: { increment: amt } } });

      return tx.transfer.create({
        data: { transferType: "cash_to_business", businessId, amount: amt, note: note || null },
        include: { business: { select: { id: true, name: true, icon: true } } },
      });
    });

    res.status(201).json({ transfer });
  } catch (err) {
    res.status(400).json({ error: err.message || "Transfer failed" });
  }
});

// ── POST /api/transfers/to-partner ──────────────────────────────
// Shared cash pool → partner monthly drawing
router.post("/to-partner", auth, adminOnly, async (req, res) => {
  try {
    const { partnerId, amount, month, note } = req.body;
    if (!partnerId || !amount || !month)
      return res.status(400).json({ error: "partnerId, amount, and month required" });

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0)
      return res.status(400).json({ error: "Amount must be positive" });

    const transfer = await prisma.$transaction(async (tx) => {
      const pool = await tx.sharedCashPool.findFirst();
      if (pool.balance < amt)
        throw new Error(`Insufficient cash pool. Available: ₹${pool.balance.toLocaleString("en-IN")}`);

      await tx.sharedCashPool.update({ where: { id: pool.id }, data: { balance: { decrement: amt } } });

      await tx.drawing.upsert({
        where:  { partnerId_month: { partnerId, month } },
        update: { paid: true, amount: amt, paidDate: new Date() },
        create: { partnerId, month, amount: amt, paid: true, paidDate: new Date() },
      });

      return tx.transfer.create({
        data: { transferType: "cash_to_partner", partnerId, amount: amt, note: note || null },
      });
    });

    res.status(201).json({ transfer });
  } catch (err) {
    res.status(400).json({ error: err.message || "Transfer failed" });
  }
});

// ── POST /api/transfers/pay-all-partners ────────────────────────
// Pay all unpaid partners for a given month in one shot
router.post("/pay-all-partners", auth, adminOnly, async (req, res) => {
  try {
    const { month, amountPerPartner } = req.body;
    if (!month) return res.status(400).json({ error: "month required" });

    const amt = parseFloat(amountPerPartner) || 100000;

    const result = await prisma.$transaction(async (tx) => {
      const [pool, partners, existingDrawings] = await Promise.all([
        tx.sharedCashPool.findFirst(),
        tx.partner.findMany({ where: { isActive: true } }),
        tx.drawing.findMany({ where: { month, paid: true } }),
      ]);

      const paidIds       = new Set(existingDrawings.map((d) => d.partnerId));
      const unpaid        = partners.filter((p) => !paidIds.has(p.id));
      const totalRequired = unpaid.length * amt;

      if (pool.balance < totalRequired)
        throw new Error(`Insufficient cash pool. Need ₹${totalRequired.toLocaleString("en-IN")}, have ₹${pool.balance.toLocaleString("en-IN")}`);

      await tx.sharedCashPool.update({ where: { id: pool.id }, data: { balance: { decrement: totalRequired } } });

      for (const partner of unpaid) {
        await tx.drawing.upsert({
          where:  { partnerId_month: { partnerId: partner.id, month } },
          update: { paid: true, amount: amt, paidDate: new Date() },
          create: { partnerId: partner.id, month, amount: amt, paid: true, paidDate: new Date() },
        });
        await tx.transfer.create({
          data: { transferType: "cash_to_partner", partnerId: partner.id, amount: amt },
        });
      }

      return { paidCount: unpaid.length, totalPaid: totalRequired };
    });

    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message || "Bulk payment failed" });
  }
});

// ── POST /api/transfers/personal-cash-out ───────────────────────
// Ad-hoc cash payment to a partner from shared pool
// Entirely separate from monthly drawing — no month tracking
router.post("/personal-cash-out", auth, adminOnly, async (req, res) => {
  try {
    const { partnerId, amount, description } = req.body;

    if (!partnerId)           return res.status(400).json({ error: "partnerId required" });
    if (!description?.trim()) return res.status(400).json({ error: "description required" });
    if (!amount)              return res.status(400).json({ error: "amount required" });

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return res.status(400).json({ error: "Amount must be positive" });

    const result = await prisma.$transaction(async (tx) => {
      const pool = await tx.sharedCashPool.findFirst();
      if (pool.balance < amt)
        throw new Error(`Insufficient cash pool. Available: ₹${pool.balance.toLocaleString("en-IN")}`);

      await tx.sharedCashPool.update({
        where: { id: pool.id },
        data:  { balance: { decrement: amt } },
      });

      return tx.personalCashOut.create({
        data: {
          partnerId,
          amount:      amt,
          description: description.trim(),
          paymentDate: new Date(),
        },
        include: {
          partner: { select: { id: true, name: true, initials: true, note: true } },
        },
      });
    });

    res.status(201).json({ personalCashOut: result });
  } catch (err) {
    res.status(400).json({ error: err.message || "Personal cash out failed" });
  }
});

// ── GET /api/transfers ──────────────────────────────────────────
router.get("/", auth, async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const transfers = await prisma.transfer.findMany({
      include: { business: { select: { id: true, name: true, icon: true } } },
      orderBy: { createdAt: "desc" },
      skip:    (parseInt(page) - 1) * parseInt(limit),
      take:    parseInt(limit),
    });
    res.json({ transfers });
  } catch {
    res.status(500).json({ error: "Failed to fetch transfers" });
  }
});

// ── GET /api/transfers/personal-cash-outs ───────────────────────
router.get("/personal-cash-outs", auth, async (req, res) => {
  try {
    const { partnerId, startDate, endDate, limit = 100, page = 1 } = req.query;

    const where = {};
    if (partnerId) where.partnerId = partnerId;
    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) where.paymentDate.gte = new Date(startDate);
      if (endDate)   where.paymentDate.lte = new Date(endDate + "T23:59:59");
    }

    const [records, total] = await Promise.all([
      prisma.personalCashOut.findMany({
        where,
        include: { partner: { select: { id: true, name: true, initials: true, note: true } } },
        orderBy: { paymentDate: "desc" },
        skip:    (parseInt(page) - 1) * parseInt(limit),
        take:    parseInt(limit),
      }),
      prisma.personalCashOut.count({ where }),
    ]);

    res.json({ personalCashOuts: records, total });
  } catch {
    res.status(500).json({ error: "Failed to fetch personal cash outs" });
  }
});

module.exports = router;
