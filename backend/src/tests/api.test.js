const request = require("supertest");
const { PrismaClient } = require("@prisma/client");
const { migrateTestDb } = require("./helpers/testDb");
const app = require("./helpers/app");

const prisma = new PrismaClient();

let token;
let userId;

beforeAll(async () => {
  migrateTestDb();

  // Seed food options needed for meal log tests
  await prisma.foodOption.upsert({
    where: { id: "f001" },
    update: {},
    create: { id: "f001", nameEn: "Ugali", nameRw: "Ubugali", category: "starch", glycemicIndex: "high" },
  });
  await prisma.foodOption.upsert({
    where: { id: "f006" },
    update: {},
    create: { id: "f006", nameEn: "Beans", nameRw: "Ibishyimbo", category: "protein", glycemicIndex: "low" },
  });
});

afterAll(async () => {
  // Clean up test data
  await prisma.mealLog.deleteMany();
  await prisma.glucoseLog.deleteMany();
  await prisma.weeklySummary.deleteMany();
  await prisma.otpSession.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});

// ─── Auth ────────────────────────────────────────────────────────────────────

describe("POST /api/v1/auth/send-otp", () => {
  test("returns ok for valid phone", async () => {
    const res = await request(app)
      .post("/api/v1/auth/send-otp")
      .send({ phone: "+250780000001" });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.dev).toBe(true); // dev mode
  });

  test("returns 400 when phone is missing", async () => {
    const res = await request(app).post("/api/v1/auth/send-otp").send({});
    expect(res.status).toBe(400);
  });
});

describe("POST /api/v1/auth/verify-otp", () => {
  test("returns 401 for wrong code", async () => {
    await request(app).post("/api/v1/auth/send-otp").send({ phone: "+250780000002" });
    const res = await request(app)
      .post("/api/v1/auth/verify-otp")
      .send({ phone: "+250780000002", code: "000000" });
    expect(res.status).toBe(401);
  });

  test("returns token + isNewUser for correct code", async () => {
    const phone = "+250780000099";
    await request(app).post("/api/v1/auth/send-otp").send({ phone });

    // Grab the code directly from DB (dev mode doesn't SMS it)
    const session = await prisma.otpSession.findFirst({
      where: { phone, used: false },
      orderBy: { createdAt: "desc" },
    });

    const res = await request(app)
      .post("/api/v1/auth/verify-otp")
      .send({ phone, code: session.code });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body.isNewUser).toBe(true);

    token = res.body.token;
    userId = res.body.userId;
  });

  test("same code cannot be used twice", async () => {
    const phone = "+250780000098";
    await request(app).post("/api/v1/auth/send-otp").send({ phone });
    const session = await prisma.otpSession.findFirst({
      where: { phone, used: false },
      orderBy: { createdAt: "desc" },
    });
    await request(app).post("/api/v1/auth/verify-otp").send({ phone, code: session.code });
    const res2 = await request(app)
      .post("/api/v1/auth/verify-otp")
      .send({ phone, code: session.code });
    expect(res2.status).toBe(401);
  });
});

// ─── Users ───────────────────────────────────────────────────────────────────

describe("GET /api/v1/users/me", () => {
  test("returns 401 without token", async () => {
    const res = await request(app).get("/api/v1/users/me");
    expect(res.status).toBe(401);
  });

  test("returns user profile", async () => {
    const res = await request(app)
      .get("/api/v1/users/me")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("phone");
  });
});

describe("PUT /api/v1/users/me", () => {
  test("updates profile fields", async () => {
    const res = await request(app)
      .put("/api/v1/users/me")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Test Patient",
        diabetesType: "type2",
        physicianEmail: "doctor@clinic.rw",
        reportFrequency: "weekly",
      });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Test Patient");
    expect(res.body.physicianEmail).toBe("doctor@clinic.rw");
  });

  test("returns 401 without token", async () => {
    const res = await request(app).put("/api/v1/users/me").send({ name: "Hacker" });
    expect(res.status).toBe(401);
  });
});

// ─── Logs ────────────────────────────────────────────────────────────────────

describe("POST /api/v1/logs", () => {
  test("returns 400 for missing readingMgdl", async () => {
    const res = await request(app)
      .post("/api/v1/logs")
      .set("Authorization", `Bearer ${token}`)
      .send({ logType: "fasting" });
    expect(res.status).toBe(400);
  });

  test("returns 400 for invalid logType", async () => {
    const res = await request(app)
      .post("/api/v1/logs")
      .set("Authorization", `Bearer ${token}`)
      .send({ readingMgdl: 100, logType: "breakfast" });
    expect(res.status).toBe(400);
  });

  test("fasting 84 → green, no suggestions", async () => {
    const res = await request(app)
      .post("/api/v1/logs")
      .set("Authorization", `Bearer ${token}`)
      .send({ readingMgdl: 84, logType: "fasting" });
    expect(res.status).toBe(201);
    expect(res.body.color).toBe("green");
    expect(res.body.suggestions).toHaveLength(0);
  });

  test("fasting 115 → yellow", async () => {
    const res = await request(app)
      .post("/api/v1/logs")
      .set("Authorization", `Bearer ${token}`)
      .send({ readingMgdl: 115, logType: "fasting" });
    expect(res.status).toBe(201);
    expect(res.body.color).toBe("yellow");
  });

  test("fasting 140 → red, triggers high_fasting suggestion", async () => {
    const res = await request(app)
      .post("/api/v1/logs")
      .set("Authorization", `Bearer ${token}`)
      .send({ readingMgdl: 140, logType: "fasting" });
    expect(res.status).toBe(201);
    expect(res.body.color).toBe("red");
    const ids = res.body.suggestions.map((s) => s.id);
    expect(ids).toContain("high_fasting");
  });

  test("post_meal 215 + starch food → red + high_post_starch suggestion", async () => {
    const res = await request(app)
      .post("/api/v1/logs")
      .set("Authorization", `Bearer ${token}`)
      .send({ readingMgdl: 215, logType: "post_meal", foods: ["f001"] });
    expect(res.status).toBe(201);
    expect(res.body.color).toBe("red");
    const ids = res.body.suggestions.map((s) => s.id);
    expect(ids).toContain("high_post_starch");
  });

  test("post_meal 110 → green, no meal suggestion", async () => {
    const res = await request(app)
      .post("/api/v1/logs")
      .set("Authorization", `Bearer ${token}`)
      .send({ readingMgdl: 110, logType: "post_meal", foods: ["f006"] });
    expect(res.status).toBe(201);
    expect(res.body.color).toBe("green");
    expect(res.body.suggestions).toHaveLength(0);
  });

  test("meal log is stored when foods provided", async () => {
    const res = await request(app)
      .post("/api/v1/logs")
      .set("Authorization", `Bearer ${token}`)
      .send({ readingMgdl: 175, logType: "post_meal", foods: ["f001", "f006"], notes: "Big lunch" });
    expect(res.status).toBe(201);
    expect(res.body.log.mealLog).not.toBeNull();
    expect(res.body.log.mealLog.foods).toContain("f001");
    expect(res.body.log.mealLog.notes).toBe("Big lunch");
  });
});

describe("GET /api/v1/logs", () => {
  test("returns list of logs for authenticated user", async () => {
    const res = await request(app)
      .get("/api/v1/logs")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test("respects limit param", async () => {
    const res = await request(app)
      .get("/api/v1/logs?limit=2")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeLessThanOrEqual(2);
  });
});

// ─── Dashboard ───────────────────────────────────────────────────────────────

describe("GET /api/v1/dashboard/summary", () => {
  test("returns expected shape", async () => {
    const res = await request(app)
      .get("/api/v1/dashboard/summary")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("currentWeek");
    expect(res.body).toHaveProperty("weeksHistory");
    expect(res.body).toHaveProperty("trendData");
    expect(res.body).toHaveProperty("recentLogs");
    expect(res.body).toHaveProperty("activeSuggestions");
  });

  test("currentWeek has a colorBadge", async () => {
    const res = await request(app)
      .get("/api/v1/dashboard/summary")
      .set("Authorization", `Bearer ${token}`);
    expect(["green", "yellow", "red"]).toContain(res.body.currentWeek.colorBadge);
  });

  test("trendData entries have date and avg", async () => {
    const res = await request(app)
      .get("/api/v1/dashboard/summary")
      .set("Authorization", `Bearer ${token}`);
    for (const point of res.body.trendData) {
      expect(point).toHaveProperty("date");
      expect(point).toHaveProperty("avg");
      expect(typeof point.avg).toBe("number");
    }
  });
});

// ─── Foods ───────────────────────────────────────────────────────────────────

describe("GET /api/v1/foods", () => {
  test("returns food list with en + rw names", async () => {
    const res = await request(app)
      .get("/api/v1/foods")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const ugali = res.body.find((f) => f.id === "f001");
    expect(ugali).toBeDefined();
    expect(ugali.nameEn).toBeDefined();
    expect(ugali.nameRw).toBeDefined();
  });
});

// ─── Reports ─────────────────────────────────────────────────────────────────

describe("GET /api/v1/reports/preview", () => {
  test("returns a PDF buffer", async () => {
    const res = await request(app)
      .get("/api/v1/reports/preview")
      .set("Authorization", `Bearer ${token}`)
      .buffer(true)
      .parse((res, callback) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => callback(null, Buffer.concat(chunks)));
      });
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/pdf/);
    // PDF magic bytes %PDF
    expect(res.body.slice(0, 4).toString("ascii")).toBe("%PDF");
  });
});

describe("POST /api/v1/reports/send", () => {
  test("returns ok in dev mode (no real email sent)", async () => {
    const res = await request(app)
      .post("/api/v1/reports/send")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.dev).toBe(true);
  });
});
