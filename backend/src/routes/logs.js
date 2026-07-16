const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { requireAuth } = require("../middleware/auth");
const { computeColor } = require("../services/colorEngine");
const { evaluateLogRules } = require("../services/ruleEngine");

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/v1/logs
router.post("/", requireAuth, async (req, res) => {
  const { readingMgdl, logType, foods = [], notes } = req.body;

  if (!readingMgdl || !logType) {
    return res.status(400).json({ error: "readingMgdl and logType are required" });
  }

  const validTypes = ["fasting", "pre_meal", "post_meal"];
  if (!validTypes.includes(logType)) {
    return res.status(400).json({ error: `logType must be one of: ${validTypes.join(", ")}` });
  }

  const color = computeColor(readingMgdl, logType);

  const log = await prisma.glucoseLog.create({
    data: {
      userId: req.userId,
      readingMgdl,
      logType,
      color,
      ...(foods.length > 0 || notes
        ? {
            mealLog: {
              create: { foods, notes: notes || null },
            },
          }
        : {}),
    },
    include: { mealLog: true },
  });

  const suggestions = evaluateLogRules(log, foods);

  res.status(201).json({ log, color, suggestions });
});

// GET /api/v1/logs
router.get("/", requireAuth, async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = parseInt(req.query.offset) || 0;

  const logs = await prisma.glucoseLog.findMany({
    where: { userId: req.userId },
    include: { mealLog: true },
    orderBy: { loggedAt: "desc" },
    take: limit,
    skip: offset,
  });

  res.json(logs);
});

module.exports = router;
