const { evaluateLogRules, evaluateWeeklyRules, getSuggestionsByIds } = require("../services/ruleEngine");

describe("ruleEngine — per-log rules", () => {
  const redPostMealLog = { logType: "post_meal", color: "red" };
  const yellowPostMealLog = { logType: "post_meal", color: "yellow" };
  const redFastingLog = { logType: "fasting", color: "red" };
  const greenFastingLog = { logType: "fasting", color: "green" };

  test("red post_meal + starch food triggers high_post_starch", () => {
    const results = evaluateLogRules(redPostMealLog, ["f001"]); // f001 = Ugali (starch)
    const ids = results.map((r) => r.id);
    expect(ids).toContain("high_post_starch");
  });

  test("red post_meal without starch does NOT trigger high_post_starch", () => {
    const results = evaluateLogRules(redPostMealLog, ["f011"]); // f011 = Eggs (protein)
    const ids = results.map((r) => r.id);
    expect(ids).not.toContain("high_post_starch");
  });

  test("red post_meal triggers high_post_meal_generic regardless of food", () => {
    const results = evaluateLogRules(redPostMealLog, []);
    const ids = results.map((r) => r.id);
    expect(ids).toContain("high_post_meal_generic");
  });

  test("yellow post_meal triggers yellow_post_meal suggestion", () => {
    const results = evaluateLogRules(yellowPostMealLog, []);
    const ids = results.map((r) => r.id);
    expect(ids).toContain("yellow_post_meal");
  });

  test("red fasting triggers high_fasting suggestion", () => {
    const results = evaluateLogRules(redFastingLog, []);
    const ids = results.map((r) => r.id);
    expect(ids).toContain("high_fasting");
  });

  test("green fasting triggers no per-log suggestions", () => {
    const results = evaluateLogRules(greenFastingLog, []);
    expect(results).toHaveLength(0);
  });

  test("weekly-only rules are never returned for log evaluation", () => {
    const results = evaluateLogRules(redPostMealLog, []);
    const ids = results.map((r) => r.id);
    expect(ids).not.toContain("consistent_red_week");
    expect(ids).not.toContain("good_week");
  });

  test("each result has id and suggestion with en + rw", () => {
    const results = evaluateLogRules(redPostMealLog, ["f001"]);
    for (const r of results) {
      expect(r).toHaveProperty("id");
      expect(r.suggestion).toHaveProperty("en");
      expect(r.suggestion).toHaveProperty("rw");
    }
  });
});

describe("ruleEngine — weekly rules", () => {
  test("green week triggers good_week", async () => {
    const ids = await evaluateWeeklyRules("user1", "green", 0);
    expect(ids).toContain("good_week");
  });

  test("red week with 2+ consecutive reds triggers consistent_red_week", async () => {
    const ids = await evaluateWeeklyRules("user1", "red", 2);
    expect(ids).toContain("consistent_red_week");
  });

  test("red week with only 1 consecutive red does NOT trigger consistent_red_week", async () => {
    const ids = await evaluateWeeklyRules("user1", "red", 1);
    expect(ids).not.toContain("consistent_red_week");
  });

  test("yellow week triggers no weekly rules", async () => {
    const ids = await evaluateWeeklyRules("user1", "yellow", 0);
    expect(ids).toHaveLength(0);
  });
});

describe("ruleEngine — getSuggestionsByIds", () => {
  test("returns correct suggestions for given ids", () => {
    const results = getSuggestionsByIds(["good_week", "high_fasting"]);
    const ids = results.map((r) => r.id);
    expect(ids).toContain("good_week");
    expect(ids).toContain("high_fasting");
    expect(results).toHaveLength(2);
  });

  test("ignores unknown ids", () => {
    const results = getSuggestionsByIds(["nonexistent_rule"]);
    expect(results).toHaveLength(0);
  });
});
