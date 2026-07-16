/**
 * Compute the color badge for a glucose reading.
 * Thresholds per spec:
 *   Fasting / Pre-meal:  green < 100, yellow 100-125, red >= 126
 *   Post-meal:           green < 140, yellow 140-199, red >= 200
 *   Weekly average:      fasting thresholds applied to the mean
 */
function computeColor(readingMgdl, logType) {
  if (logType === "post_meal") {
    if (readingMgdl < 140) return "green";
    if (readingMgdl < 200) return "yellow";
    return "red";
  }
  // fasting + pre_meal + weekly average
  if (readingMgdl < 100) return "green";
  if (readingMgdl < 126) return "yellow";
  return "red";
}

module.exports = { computeColor };
