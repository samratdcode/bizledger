const router = require("express").Router();
const prisma = require("../db");
const { auth } = require("../middleware/auth");

router.get("/", auth, async (req, res) => {
  try {
    const { businessId, startDate, endDate, month } = req.query;

    let txDateFilter  = {};
    let pcoDateFilter = {}; // FIX: always keep in sync with txDateFilter

    if (month) {
      const [y, m] = month.split("-").map(Number);
      txDateFilter  = { gte: new Date(y, m - 1, 1), lte: new Date(y, m, 0, 23, 59, 59) };
      pcoDateFilter = txDateFilter; // same range for personal cash outs
    } else if (startDate || endDate) {
      if (startDate) txDateFilter.gte = new Date(startDate);
      if (endDate)   txDateFilter.lte = new Date(endDate + "T23:59:59");
      pcoDateFilter = txDateFilter;
    }
    // If no date filter at all, both remain {} (fetch all — valid for admin overview)

    const txWhere = { isDeleted: false };
    if (businessId && businessId !== "all") txWhere.businessId = businessId;
    if (Object.keys(txDateFilter).length)   txWhere.txDate = txDateFilter;

    const pcoWhere = {};
    if (Object.keys(pcoDateFilter).length) pcoWhere.paymentDate = pcoDateFilter;

    const [transactions, drawings, personalOuts, pool, businesses] = await Promise.all([
      prisma.transaction.findMany({
        where: txWhere,
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

    const totalIn          = transactions.filter(t => t.type === "in" ).reduce((s, t) => s + t.amount, 0);
    const totalOut         = transactions.filter(t => t.type === "out").reduce((s, t) => s + t.amount, 0);
    const totalDrawings    = drawings.reduce((s, d) => s + d.amount, 0);
    const totalPersonalOuts = personalOuts.reduce((s, p) => s + p.amount, 0);

    const byBusiness = {};
    transactions.forEach(t => {
      if (!byBusiness[t.businessId]) byBusiness[t.businessId] = { ...t.business, income: 0, expenses: 0, count: 0 };
      if (t.type === "in")  byBusiness[t.businessId].income   += t.amount;
      if (t.type === "out") byBusiness[t.businessId].expenses += t.amount;
      byBusiness[t.businessId].count++;
    });

    const byCategory = {};
    transactions.forEach(t => {
      const cat = t.category || "Uncategorised";
      if (!byCategory[cat]) byCategory[cat] = { in: 0, out: 0, count: 0 };
      byCategory[cat][t.type] += t.amount;
      byCategory[cat].count++;
    });

    res.json({
      summary: {
        totalIn, totalOut,
        operatingProfit:  totalIn - totalOut,
        totalDrawings,
        totalPersonalOuts,
        totalPartnerOuts: totalDrawings + totalPersonalOuts,
        netAfterDrawings: totalIn - totalOut - totalDrawings - totalPersonalOuts,
      },
      byBusiness:   Object.values(byBusiness),
      byCategory,
      drawings,
      personalOuts,
      balances: {
        sharedCash: pool?.balance || 0,
        businesses: businesses.map(b => ({ id: b.id, name: b.name, icon: b.icon, color: b.color, bank: b.bankBalance })),
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
