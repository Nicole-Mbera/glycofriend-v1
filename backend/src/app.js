require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const logRoutes = require("./routes/logs");
const dashboardRoutes = require("./routes/dashboard");
const reportRoutes = require("./routes/reports");
const foodRoutes = require("./routes/foods");
const { startScheduler } = require("./services/scheduler");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/logs", logRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/reports", reportRoutes);
app.use("/api/v1/foods", foodRoutes);

app.get("/api/v1/health", (_req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`GlycoFriend API running on port ${PORT}`);
  startScheduler();
});
