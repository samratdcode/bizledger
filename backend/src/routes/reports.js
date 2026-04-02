const router = require("express").Router();
const prisma = require("../db");
const { auth } = require("../middleware/auth");

// GET /api/reports?businessId=&startDate=&endDate=&month=
router.get("/", auth, async (req, res) => {
  try {
    const { businessId, startDate, endDate, month } = req.query;

    let dateFilter = {};
    if (month) {
      const [y, m] = month.split("-").map(Number);
      dateFilter = { gte: new Date(y, m - 1, 1), lte: new Date(y, m, 0, 23, 59, 59) };
    } else if (startDate || endDate) {
      if (startDate) dateFilter.gte = new Date(startDate);
      if (endDate)   dateFilter.lte = new Date(endDate + "T23:59:59");
    }

    const where = { isDeleted: false };
    if (businessId && businessId !== "all") where.businessId = businessId;
    if (Object.keys(dateFilter).length) where.txDate = dateFilter;

    // Build personal cash out date filter using paymentDate
    const pcoWhere = {};
    if (Object.keys(dateFilter).length) pcoWhere.paymentDate = dateFilter;

    const [transactions, drawings, personalOuts, pool, businesses] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: { business: { select: { id: true, name: true, icon: true, color: true } } },
        orderBy: { txDate: "desc" },
      }),
      month
        ? prisma.drawing.findMany({
            where:   { month, paid: true },
            include: { partner: { select: { id: true, name: true, initials: true } } },
          })
        : Promise.resolve([]),
      prisma.personalCashOut.findMany({
        where:   pcoWhere,
        include: { partner: { select: { id: true, name: true, initials: true } } },
        orderBy: { paymentDate: "desc" },
      }),
      prisma.sharedCashPool.findFirst(),
      prisma.business.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    ]);

    // Totals
    const totalIn  = transactions.filter((t) => t.type === "in" ).reduce((s, t) => s + t.amount, 0);
    const totalOut = transactions.filter((t) => t.type === "out").reduce((s, t) => s + t.amount, 0);
    const totalDrawings     = drawings.reduce((s, d) => s + d.amount, 0);
    const totalPersonalOuts = personalOuts.reduce((s, p) => s + p.amount, 0);
    const totalPartnerOuts  = totalDrawings + totalPersonalOuts;

    // By business
    const byBusiness = {};
    transactions.forEach((t) => {
      if (!byBusiness[t.businessId]) {
        byBusiness[t.businessId] = { ...t.business, income: 0, expenses: 0, count: 0 };
      }
      if (t.type === "in")  byBusiness[t.businessId].income   += t.amount;
      if (t.type === "out") byBusiness[t.businessId].expenses += t.amount;
      byBusiness[t.businessId].count++;
    });

    // By category
    const byCategory = {};
    transactions.forEach((t) => {
      const cat = t.category || "Uncategorised";
      if (!byCategory[cat]) byCategory[cat] = { in: 0, out: 0, count: 0 };
      byCategory[cat][t.type] += t.amount;
      byCategory[cat].count++;
    });

    res.json({
      summary: {
        totalIn,
        totalOut,
        operatingProfit:  totalIn - totalOut,
        totalDrawings,
        totalPersonalOuts,
        totalPartnerOuts,
        netAfterDrawings: totalIn - totalOut - totalPartnerOuts,
      },
      byBusiness:   Object.values(byBusiness),
      byCategory,
      drawings,
      personalOuts,
      balances: {
        sharedCash: pool?.balance || 0,
        businesses: businesses.map((b) => ({ id: b.id, name: b.name, icon: b.icon, color: b.color, bank: b.bankBalance })),
        totalBank:  businesses.reduce((s, b) => s + b.bankBalance, 0),
      },
      transactions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

module.exports = router;
