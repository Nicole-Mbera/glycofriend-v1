const cron = require("node-cron");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { generatePhysicianReport, generateCHWAlert } = require("./pdfService");
const { sendPhysicianReport, sendCHWAlert } = require("./emailService");
const { getReportData } = require("./reportBuilder");
const { alerts } = require("../rules/alerts.json");

/**
 * Generic dispatch function — looks up recipient + template by role.
 * Add new recipientRoles here for Phase 2 without touching caller code.
 */
async function dispatchAlert(userId, alertId, recipientRole, alertReason) {
  const data = await getReportData(userId);

  if (recipientRole === "chw") {
    if (!data.user.chwEmail || !data.user.consentSharedWithCHW) return;

    const pdf = await generateCHWAlert(
      data.user, data.currentWeek, data.weeklyHistory,
      alertReason, data.lastLog, data.loggedCount, data.expectedCount
    );
    await sendCHWAlert(data.user.chwEmail, data.user.name, pdf);
    await prisma.user.update({
      where: { id: userId },
      data: { lastCHWAlertSentAt: new Date() },
    });
    console.log(`[Scheduler] CHW alert '${alertId}' dispatched for user ${userId}`);
  }

  if (recipientRole === "physician") {
    if (!data.user.physicianEmail || !data.user.consentSharedWithPhysician) return;

    const pdf = await generatePhysicianReport(
      data.user, data.currentWeek, data.weeklyHistory,
      data.trendData, data.topFoods, data.suggestions
    );
    await sendPhysicianReport(data.user.physicianEmail, data.user.name, data.period, pdf);
    await prisma.user.update({
      where: { id: userId },
      data: { lastReportSentAt: new Date() },
    });
    console.log(`[Scheduler] Physician report dispatched for user ${userId}`);
  }
}

async function runCHWAlertChecks() {
  const users = await prisma.user.findMany({
    where: { chwEmail: { not: null }, consentSharedWithCHW: true },
    include: { weeklySummaries: { orderBy: { weekStart: "desc" }, take: 4 }, glucoseLogs: { orderBy: { loggedAt: "desc" }, take: 1 } },
  });

  for (const user of users) {
    // Cooldown: skip if alert sent within last 7 days
    if (user.lastCHWAlertSentAt) {
      const daysSince = (Date.now() - user.lastCHWAlertSentAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) continue;
    }

    const summaries = user.weeklySummaries;
    const lastLog = user.glucoseLogs[0];

    for (const alertDef of alerts) {
      let triggered = false;
      let alertReason = alertDef.alertReason.en;

      if (alertDef.id === "consecutive_red_weeks") {
        const redCount = summaries.filter((s) => s.colorBadge === "red").length;
        if (redCount >= 2) triggered = true;
      }

      if (alertDef.id === "no_logs_5_days") {
        if (!lastLog) {
          triggered = true;
        } else {
          const daysSince = (Date.now() - lastLog.loggedAt.getTime()) / (1000 * 60 * 60 * 24);
          if (daysSince >= 5) triggered = true;
        }
      }

      if (alertDef.id === "critically_high_week") {
        const current = summaries[0];
        if (current && current.averageReading >= 200) triggered = true;
      }

      if (triggered) {
        await dispatchAlert(user.id, alertDef.id, alertDef.recipientRole, alertReason);
        break; // one alert per user per cycle
      }
    }
  }
}

async function runPhysicianReports() {
  const now = new Date();
  const users = await prisma.user.findMany({
    where: {
      physicianEmail: { not: null },
      reportFrequency: { not: null },
      consentSharedWithPhysician: true,
    },
  });

  for (const user of users) {
    const last = user.lastReportSentAt ? new Date(user.lastReportSentAt) : null;
    let shouldSend = false;

    if (!last) {
      shouldSend = true;
    } else {
      const daysSince = (now - last) / (1000 * 60 * 60 * 24);
      if (user.reportFrequency === "weekly" && daysSince >= 7) shouldSend = true;
      if (user.reportFrequency === "biweekly" && daysSince >= 14) shouldSend = true;
      if (user.reportFrequency === "monthly" && daysSince >= 28) shouldSend = true;
    }

    if (shouldSend) {
      await dispatchAlert(user.id, "physician_report", "physician", null);
    }
  }
}

function startScheduler() {
  // Run every day at 08:00
  cron.schedule("0 8 * * *", async () => {
    console.log("[Scheduler] Running daily jobs...");
    await runPhysicianReports();
    await runCHWAlertChecks();
  });
  console.log("[Scheduler] Cron jobs registered (daily at 08:00).");
}

module.exports = { startScheduler, dispatchAlert };
