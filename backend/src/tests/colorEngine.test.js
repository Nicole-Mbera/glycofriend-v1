const { computeColor } = require("../services/colorEngine");

describe("colorEngine — fasting / pre_meal", () => {
  test("< 100 is green", () => {
    expect(computeColor(99, "fasting")).toBe("green");
    expect(computeColor(84, "pre_meal")).toBe("green");
    expect(computeColor(99.9, "fasting")).toBe("green");
  });

  test("100–125 is yellow", () => {
    expect(computeColor(100, "fasting")).toBe("yellow");
    expect(computeColor(115, "pre_meal")).toBe("yellow");
    expect(computeColor(125.9, "fasting")).toBe("yellow");
  });

  test(">= 126 is red", () => {
    expect(computeColor(126, "fasting")).toBe("red");
    expect(computeColor(200, "pre_meal")).toBe("red");
  });
});

describe("colorEngine — post_meal", () => {
  test("< 140 is green", () => {
    expect(computeColor(139, "post_meal")).toBe("green");
    expect(computeColor(80, "post_meal")).toBe("green");
  });

  test("140–199 is yellow", () => {
    expect(computeColor(140, "post_meal")).toBe("yellow");
    expect(computeColor(180, "post_meal")).toBe("yellow");
    expect(computeColor(199.9, "post_meal")).toBe("yellow");
  });

  test(">= 200 is red", () => {
    expect(computeColor(200, "post_meal")).toBe("red");
    expect(computeColor(350, "post_meal")).toBe("red");
  });
});

describe("colorEngine — boundary values", () => {
  test("exactly at each boundary", () => {
    expect(computeColor(100, "fasting")).toBe("yellow");
    expect(computeColor(126, "fasting")).toBe("red");
    expect(computeColor(140, "post_meal")).toBe("yellow");
    expect(computeColor(200, "post_meal")).toBe("red");
  });
});
