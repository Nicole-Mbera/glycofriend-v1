/**
 * Shared logic for gathering the data needed to render both physician and CHW PDFs
 * from the same underlying WeeklySummary + GlucoseLog data.
 */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const foods = require("../data/foods.json");
const { getSuggestionsByIds } = require("./ruleEngine");

const foodMap = Object.fromEntries(foods.map((f) => [f.id, f]));

async function getReportData(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  // Last 4 weekly summaries
  const weeklyHistory = await prisma.weeklySummary.findMany({
    where: { userId },
    orderBy: { weekStart: "desc" },
    take: 4,
  });

  const currentWeek = weeklyHistory[0] || null;

  // 14-day trend
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
  fourteenDaysAgo.setHours(0, 0, 0, 0);

  const recentLogs = await prisma.glucoseLog.findMany({
    where: { userId, loggedAt: { gte: fourteenDaysAgo } },
    include: { mealLog: true },
    orderBy: { loggedAt: "asc" },
  });

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

  // Top foods
  const foodCount = {};
  for (const log of recentLogs) {
    if (log.mealLog?.foods) {
      for (const fid of log.mealLog.foods) {
        foodCount[fid] = (foodCount[fid] || 0) + 1;
      }
    }
  }
  const topFoods = Object.entries(foodCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, count]) => ({ ...foodMap[id], count }))
    .filter(Boolean);

  // Active suggestions
  const suggestions = currentWeek ? getSuggestionsByIds(currentWeek.suggestions) : [];

  // Last log + logging consistency (14 days, expect 2/day = 28 expected)
  const lastLog = recentLogs[recentLogs.length - 1] || null;
  const loggedCount = recentLogs.length;
  const expectedCount = 28;

  // Period string
  const period = currentWeek
    ? `Week of ${new Date(currentWeek.weekStart).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
    : "Recent Period";

  return {
    user,
    currentWeek,
    weeklyHistory,
    trendData,
    topFoods,
    suggestions,
    lastLog,
    loggedCount,
    expectedCount,
    period,
  };
}

module.exports = { getReportData };
