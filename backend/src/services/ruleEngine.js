const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { rules } = require("../rules/suggestions.json");
const foods = require("../data/foods.json");

const foodMap = Object.fromEntries(foods.map((f) => [f.id, f]));

/**
 * Evaluate per-log rules after a new glucose log is saved.
 * Returns array of matching suggestion objects { id, suggestion: { en, rw } }
 */
function evaluateLogRules(log, mealFoodIds = []) {
  const loggedCategories = new Set(
    mealFoodIds.map((id) => foodMap[id]?.category).filter(Boolean)
  );

  return rules
    .filter((rule) => {
      const c = rule.conditions;
      if (c.weeklyColor || c.consecutiveRedWeeks) return false; // weekly-only rules
      if (c.logType && c.logType !== log.logType) return false;
      if (c.readingColor && c.readingColor !== log.color) return false;
      if (c.foodCategories) {
        const hasMatch = c.foodCategories.some((cat) => loggedCategories.has(cat));
        if (!hasMatch) return false;
      }
      return true;
    })
    .map((r) => ({ id: r.id, suggestion: r.suggestion }));
}

/**
 * Evaluate weekly rules against a WeeklySummary + consecutive red week count.
 * Returns array of triggered rule IDs (stored in WeeklySummary.suggestions).
 */
async function evaluateWeeklyRules(userId, weeklyColor, consecutiveRedWeeks) {
  return rules
    .filter((rule) => {
      const c = rule.conditions;
      if (!c.weeklyColor) return false;
      if (c.weeklyColor !== weeklyColor) return false;
      if (c.consecutiveRedWeeks && consecutiveRedWeeks < c.consecutiveRedWeeks) return false;
      return true;
    })
    .map((r) => r.id);
}

/**
 * Get suggestion objects for a list of rule IDs.
 */
function getSuggestionsByIds(ruleIds) {
  return rules
    .filter((r) => ruleIds.includes(r.id))
    .map((r) => ({ id: r.id, suggestion: r.suggestion }));
}

module.exports = { evaluateLogRules, evaluateWeeklyRules, getSuggestionsByIds };
