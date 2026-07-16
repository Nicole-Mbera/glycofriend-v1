const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { requireAuth } = require("../middleware/auth");
const { generatePhysicianReport, generateCHWAlert } = require("../services/pdfService");
const { sendPhysicianReport, sendCHWAlert } = require("../services/emailService");
const { getReportData } = require("../services/reportBuilder");

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/v1/reports/send — manually trigger physician PDF
router.post("/send", requireAuth, async (req, res) => {
  const data = await getReportData(req.userId);

  if (!data.user.physicianEmail) {
    return res.status(400).json({ error: "No physician email configured" });
  }

  const pdf = await generatePhysicianReport(
    data.user, data.currentWeek, data.weeklyHistory,
    data.trendData, data.topFoods, data.suggestions
  );

  const result = await sendPhysicianReport(data.user.physicianEmail, data.user.name, data.period, pdf);

  await prisma.user.update({
    where: { id: req.userId },
    data: { lastReportSentAt: new Date() },
  });

  res.json({ ok: true, ...result });
});

// POST /api/v1/reports/send-chw — manually trigger CHW alert PDF
router.post("/send-chw", requireAuth, async (req, res) => {
  const data = await getReportData(req.userId);

  if (!data.user.chwEmail) {
    return res.status(400).json({ error: "No CHW email configured" });
  }

  const alertReason = req.body.alertReason || "Manual alert triggered by patient.";

  const pdf = await generateCHWAlert(
    data.user, data.currentWeek, data.weeklyHistory,
    alertReason, data.lastLog, data.loggedCount, data.expectedCount
  );

  const result = await sendCHWAlert(data.user.chwEmail, data.user.name, pdf);

  await prisma.user.update({
    where: { id: req.userId },
    data: { lastCHWAlertSentAt: new Date() },
  });

  res.json({ ok: true, ...result });
});

// GET /api/v1/reports/preview — return physician PDF as binary
router.get("/preview", requireAuth, async (req, res) => {
  const data = await getReportData(req.userId);

  const pdf = await generatePhysicianReport(
    data.user, data.currentWeek, data.weeklyHistory,
    data.trendData, data.topFoods, data.suggestions
  );

  res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": "inline; filename=report-preview.pdf",
    "Content-Length": pdf.length,
  });
  res.send(pdf);
});

// GET /api/v1/reports/preview-chw — return CHW PDF as binary
router.get("/preview-chw", requireAuth, async (req, res) => {
  const data = await getReportData(req.userId);
  const alertReason = "This is a preview of the CHW alert report.";

  const pdf = await generateCHWAlert(
    data.user, data.currentWeek, data.weeklyHistory,
    alertReason, data.lastLog, data.loggedCount, data.expectedCount
  );

  res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": "inline; filename=chw-alert-preview.pdf",
    "Content-Length": pdf.length,
  });
  res.send(pdf);
});

module.exports = router;
