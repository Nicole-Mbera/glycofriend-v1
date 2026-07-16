const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/v1/foods
router.get("/", requireAuth, async (_req, res) => {
  const foods = await prisma.foodOption.findMany({ orderBy: { nameEn: "asc" } });
  res.json(foods);
});

module.exports = router;
