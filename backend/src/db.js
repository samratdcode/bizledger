const { PrismaClient } = require("@prisma/client");

const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error"] : ["error"],
});

if (process.env.NODE_ENV !== "production") global.prisma = prisma;

module.exports = prisma;
