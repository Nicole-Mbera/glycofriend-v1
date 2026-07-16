const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { requireAuth } = require("../middleware/auth");
const { computeColor } = require("../services/colorEngine");
const { evaluateWeeklyRules, getSuggestionsByIds } = require("../services/ruleEngine");

const router = express.Router();
const prisma = new PrismaClient();

function getMondayOf(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon...
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function getOrBuildWeeklySummary(userId, weekStart) {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const existing = await prisma.weeklySummary.findFirst({
    where: { userId, weekStart },
  });
  if (existing) return existing;

  const logs = await prisma.glucoseLog.findMany({
    where: {
      userId,
      loggedAt: { gte: weekStart, lt: weekEnd },
    },
  });

  if (logs.length === 0) return null;

  const avg = logs.reduce((s, l) => s + l.readingMgdl, 0) / logs.length;
  const colorBadge = computeColor(avg, "fasting");

  // Count consecutive red weeks for rule evaluation
  const prevSummaries = await prisma.weeklySummary.findMany({
    where: { userId, weekStart: { lt: weekStart } },
    orderBy: { weekStart: "desc" },
    take: 10,
  });
  let consecutiveRed = colorBadge === "red" ? 1 : 0;
  for (const s of prevSummaries) {
    if (s.colorBadge === "red") consecutiveRed++;
    else break;
  }

  const ruleIds = await evaluateWeeklyRules(userId, colorBadge, consecutiveRed);

  const summary = await prisma.weeklySummary.create({
    data: {
      userId,
      weekStart,
      averageReading: avg,
      colorBadge,
      totalReadings: logs.length,
      suggestions: ruleIds,
    },
  });

  return summary;
}

// GET /api/v1/dashboard/summary
router.get("/summary", requireAuth, async (req, res) => {
  const userId = req.userId;
  const now = new Date();
  const currentWeekStart = getMondayOf(now);

  // Build/fetch last 4 weekly summaries
  const weeks = [];
  for (let i = 0; i < 4; i++) {
    const weekStart = new Date(currentWeekStart);
    weekStart.setDate(weekStart.getDate() - i * 7);
    const summary = await getOrBuildWeeklySummary(userId, weekStart);
    if (summary) weeks.push(summary);
  }

  // 14-day trend: daily average readings
  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
  fourteenDaysAgo.setHours(0, 0, 0, 0);

  const recentLogs = await prisma.glucoseLog.findMany({
    where: { userId, loggedAt: { gte: fourteenDaysAgo } },
    orderBy: { loggedAt: "asc" },
  });

  // Group by date string
  const dailyMap = {};
  for (const log of recentLogs) {
    const key = log.loggedAt.toISOString().slice(0, 10);
    if (!dailyMap[key]) dailyMap[key] = [];
    dailyMap[key].push(log.readingMgdl);
  }
  const trendData = Object.entries(dailyMap).map(([date, readings]) => ({
    date,
    avg: Math.round(readings.reduce((s, r) => s + r, 0) / readings.length),
  }));

  // Recent logs (last 10)
  const latestLogs = await prisma.glucoseLog.findMany({
    where: { userId },
    include: { mealLog: true },
    orderBy: { loggedAt: "desc" },
    take: 10,
  });

  // Active suggestions from current week
  const currentWeek = weeks[0] || null;
  const activeSuggestions = currentWeek
    ? getSuggestionsByIds(currentWeek.suggestions)
    : [];

  res.json({
    currentWeek,
    weeksHistory: weeks,
    trendData,
    recentLogs: latestLogs,
    activeSuggestions,
  });
});

module.exports = router;
