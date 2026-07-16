const PDFDocument = require("pdfkit");

const COLORS = {
  green: "#2ECC71",
  yellow: "#F1C40F",
  red: "#E74C3C",
  dark: "#2C3E50",
  muted: "#7F8C8D",
  light: "#ECF0F1",
};

const BADGE_LABEL = { green: "Green", yellow: "Yellow", red: "Red" };

function badgeCircle(doc, x, y, color, label, dateStr) {
  doc.circle(x, y, 14).fill(COLORS[color] || "#ccc");
  doc.fillColor(COLORS.muted).fontSize(9).text(dateStr, x - 20, y + 18, { width: 40, align: "center" });
}

/**
 * Generate the physician PDF report.
 * Returns a Buffer.
 */
function generatePhysicianReport(user, summary, weeklyHistory, trendData, topFoods, suggestions) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const now = new Date();
    const periodStr = summary
      ? `Week of ${new Date(summary.weekStart).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`
      : "Recent Period";

    // ── Header ──────────────────────────────────────────────────────────────
    doc.fillColor(COLORS.dark).fontSize(22).font("Helvetica-Bold").text("GlycoFriend", 40, 40);
    doc.fillColor(COLORS.muted).fontSize(12).font("Helvetica").text("Glucose Report", 40, 66);
    doc.fontSize(10).text(`Generated: ${now.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`, { align: "right" });

    doc.moveTo(40, 90).lineTo(555, 90).strokeColor(COLORS.light).lineWidth(1).stroke();

    // ── Patient Info ─────────────────────────────────────────────────────────
    doc.fillColor(COLORS.dark).fontSize(11).font("Helvetica-Bold").text("Patient", 40, 100);
    doc.font("Helvetica").fontSize(11)
      .text(`Name: ${user.name || "—"}`, 40, 116)
      .text(`Diabetes Type: ${user.diabetesType || "—"}`, 40, 132)
      .text(`Period: ${periodStr}`, 40, 148);

    doc.moveTo(40, 168).lineTo(555, 168).strokeColor(COLORS.light).stroke();

    // ── Weekly Badge Strip ────────────────────────────────────────────────────
    doc.fillColor(COLORS.dark).fontSize(11).font("Helvetica-Bold").text("Last 4 Weeks", 40, 178);
    const badgeY = 210;
    const badgeXStart = 60;
    const badgeSpacing = 120;
    const displayWeeks = weeklyHistory.slice(0, 4).reverse();
    displayWeeks.forEach((w, i) => {
      const x = badgeXStart + i * badgeSpacing;
      badgeCircle(
        doc, x, badgeY, w.colorBadge, BADGE_LABEL[w.colorBadge],
        new Date(w.weekStart).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
      );
    });

    doc.moveTo(40, 250).lineTo(555, 250).strokeColor(COLORS.light).stroke();

    // ── Summary Stats ─────────────────────────────────────────────────────────
    doc.fillColor(COLORS.dark).fontSize(11).font("Helvetica-Bold").text("Summary", 40, 260);
    if (summary) {
      doc.font("Helvetica").fontSize(11)
        .text(`Average reading this week: ${Math.round(summary.averageReading)} mg/dL`, 40, 276)
        .text(`Total readings logged: ${summary.totalReadings}`, 40, 292)
        .text(`Overall status: ${BADGE_LABEL[summary.colorBadge]}`, 40, 308);
    } else {
      doc.font("Helvetica").fontSize(11).text("No readings logged this week.", 40, 276);
    }

    doc.moveTo(40, 328).lineTo(555, 328).strokeColor(COLORS.light).stroke();

    // ── Trend (text representation — simple table) ────────────────────────────
    doc.fillColor(COLORS.dark).fontSize(11).font("Helvetica-Bold").text("14-Day Daily Averages", 40, 338);
    let trendY = 354;
    if (trendData.length === 0) {
      doc.font("Helvetica").fontSize(10).fillColor(COLORS.muted).text("No data available.", 40, trendY);
      trendY += 14;
    } else {
      doc.font("Helvetica").fontSize(9).fillColor(COLORS.muted);
      trendData.slice(-14).forEach((d, i) => {
        const col = i % 7;
        const row = Math.floor(i / 7);
        const x = 40 + col * 74;
        const y = trendY + row * 24;
        doc.text(`${d.date.slice(5)}: ${d.avg}`, x, y, { width: 70 });
      });
      trendY += Math.ceil(trendData.length / 7) * 24 + 8;
    }

    doc.moveTo(40, trendY + 4).lineTo(555, trendY + 4).strokeColor(COLORS.light).stroke();

    // ── Top Foods ──────────────────────────────────────────────────────────────
    let foodY = trendY + 14;
    doc.fillColor(COLORS.dark).fontSize(11).font("Helvetica-Bold").text("Top Foods Logged", 40, foodY);
    foodY += 16;
    if (topFoods.length === 0) {
      doc.font("Helvetica").fontSize(10).fillColor(COLORS.muted).text("No meal data available.", 40, foodY);
      foodY += 14;
    } else {
      doc.font("Helvetica").fontSize(10).fillColor(COLORS.muted);
      topFoods.slice(0, 5).forEach((f) => {
        doc.text(`• ${f.nameEn} (${f.count}×)`, 40, foodY);
        foodY += 14;
      });
    }

    // ── Suggestions ────────────────────────────────────────────────────────────
    foodY += 8;
    doc.moveTo(40, foodY).lineTo(555, foodY).strokeColor(COLORS.light).stroke();
    foodY += 10;
    doc.fillColor(COLORS.dark).fontSize(11).font("Helvetica-Bold").text("Active Suggestions", 40, foodY);
    foodY += 16;
    if (suggestions.length === 0) {
      doc.font("Helvetica").fontSize(10).fillColor(COLORS.muted).text("No suggestions this period.", 40, foodY);
    } else {
      suggestions.forEach((s) => {
        doc.font("Helvetica").fontSize(10).fillColor(COLORS.dark).text(`• ${s.suggestion.en}`, 40, foodY, { width: 515 });
        foodY += doc.heightOfString(s.suggestion.en, { width: 515 }) + 6;
      });
    }

    // ── Footer ──────────────────────────────────────────────────────────────────
    doc.fontSize(8).fillColor(COLORS.muted).font("Helvetica")
      .text("Generated by GlycoFriend  •  Not a substitute for medical advice", 40, 780, { align: "center", width: 515 });

    doc.end();
  });
}

/**
 * Generate the CHW alert PDF.
 * Returns a Buffer.
 */
function generateCHWAlert(user, summary, weeklyHistory, alertReason, lastLog, loggedCount, expectedCount) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const now = new Date();

    // ── Header ──────────────────────────────────────────────────────────────
    doc.fillColor(COLORS.red).fontSize(20).font("Helvetica-Bold").text("GlycoFriend CHW Alert", 40, 40);
    doc.fillColor(COLORS.muted).fontSize(10).font("Helvetica")
      .text(`Generated: ${now.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`, { align: "right" });

    doc.moveTo(40, 80).lineTo(555, 80).strokeColor(COLORS.light).lineWidth(1).stroke();

    // ── Patient Info ─────────────────────────────────────────────────────────
    doc.fillColor(COLORS.dark).fontSize(11).font("Helvetica-Bold").text("Patient", 40, 90);
    doc.font("Helvetica").fontSize(11)
      .text(`Name: ${user.name || "—"}`, 40, 106)
      .text(`Phone: ${user.phone}`, 40, 122)
      .text(`Diabetes Type: ${user.diabetesType || "—"}`, 40, 138);

    doc.moveTo(40, 158).lineTo(555, 158).strokeColor(COLORS.light).stroke();

    // ── Alert Reason ─────────────────────────────────────────────────────────
    doc.fillColor(COLORS.red).fontSize(12).font("Helvetica-Bold").text("Alert Reason", 40, 168);
    doc.fillColor(COLORS.dark).fontSize(11).font("Helvetica").text(alertReason, 40, 186, { width: 515 });

    doc.moveTo(40, 216).lineTo(555, 216).strokeColor(COLORS.light).stroke();

    // ── Last 4 Weeks Badge Strip ──────────────────────────────────────────────
    doc.fillColor(COLORS.dark).fontSize(11).font("Helvetica-Bold").text("Last 4 Weeks", 40, 226);
    const badgeY = 258;
    const displayWeeks = weeklyHistory.slice(0, 4).reverse();
    displayWeeks.forEach((w, i) => {
      badgeCircle(
        doc, 60 + i * 120, badgeY, w.colorBadge, BADGE_LABEL[w.colorBadge],
        new Date(w.weekStart).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
      );
    });

    doc.moveTo(40, 294).lineTo(555, 294).strokeColor(COLORS.light).stroke();

    // ── Last Log + Consistency ────────────────────────────────────────────────
    doc.fillColor(COLORS.dark).fontSize(11).font("Helvetica-Bold").text("Recent Activity", 40, 304);
    if (lastLog) {
      doc.font("Helvetica").fontSize(11)
        .text(`Last reading: ${Math.round(lastLog.readingMgdl)} mg/dL on ${new Date(lastLog.loggedAt).toLocaleDateString("en-GB")}`, 40, 320);
    } else {
      doc.font("Helvetica").fontSize(11).text("No recent readings found.", 40, 320);
    }
    doc.fontSize(11).text(`Logging consistency: ${loggedCount} of ${expectedCount} expected readings logged`, 40, 336);

    doc.moveTo(40, 356).lineTo(555, 356).strokeColor(COLORS.light).stroke();

    // ── Suggested Action ──────────────────────────────────────────────────────
    doc.fillColor(COLORS.dark).fontSize(11).font("Helvetica-Bold").text("Suggested Action", 40, 366);
    doc.font("Helvetica").fontSize(11)
      .text("Consider a home visit or phone check-in with this patient.", 40, 382);

    // ── Footer ────────────────────────────────────────────────────────────────
    doc.fontSize(8).fillColor(COLORS.muted).font("Helvetica")
      .text(`Sent by GlycoFriend on behalf of ${user.name || "patient"}  •  Confidential`, 40, 780, { align: "center", width: 515 });

    doc.end();
  });
}

module.exports = { generatePhysicianReport, generateCHWAlert };
