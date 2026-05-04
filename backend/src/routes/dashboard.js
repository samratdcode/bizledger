const router = require("express").Router();
const prisma = require("../db");
const { auth } = require("../middleware/auth");

router.get("/", auth, async (req, res) => {
  try {
    // FIX: Calculate "today" in IST (UTC+5:30) not server UTC
    // Without this, transactions before 5:30 AM IST appear in "yesterday"
    const IST_OFFSET_MS  = 5.5 * 60 * 60 * 1000;
    const nowIST         = new Date(Date.now() + IST_OFFSET_MS);
    const todayStartIST  = new Date(Date.UTC(nowIST.getUTCFullYear(), nowIST.getUTCMonth(), nowIST.getUTCDate()));
    const todayEndIST    = new Date(todayStartIST.getTime() + 86400000 - 1);
    const monthStartIST  = new Date(Date.UTC(nowIST.getUTCFullYear(), nowIST.getUTCMonth(), 1));

    const [pool, businesses, todayTxs, monthTxs] = await Promise.all([
      prisma.sharedCashPool.findFirst(),
      prisma.business.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
      prisma.transaction.findMany({
        where:   { isDeleted: false, txDate: { gte: todayStartIST, lte: todayEndIST } },
        include: { business: { select: { id: true, name: true, icon: true, color: true } } },
        orderBy: { txDate: "desc" },
      }),
      prisma.transaction.findMany({
        where: { isDeleted: false, txDate: { gte: monthStartIST } },
      }),
    ]);

    const todayIn  = todayTxs.filter(t => t.type === "in" ).reduce((s, t) => s + t.amount, 0);
    const todayOut = todayTxs.filter(t => t.type === "out").reduce((s, t) => s + t.amount, 0);
    const monthIn  = monthTxs.filter(t => t.type === "in" ).reduce((s, t) => s + t.amount, 0);
    const monthOut = monthTxs.filter(t => t.type === "out").reduce((s, t) => s + t.amount, 0);
    const totalBank = businesses.reduce((s, b) => s + b.bankBalance, 0);

    res.json({
      sharedCash:   pool?.balance || 0,
      totalBank,
      totalBalance: (pool?.balance || 0) + totalBank,
      today:  { in: todayIn, out: todayOut, net: todayIn - todayOut, transactions: todayTxs },
      month:  { in: monthIn, out: monthOut, net: monthIn - monthOut },
      businesses,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load dashboard" });
  }
});

module.exports = router;
