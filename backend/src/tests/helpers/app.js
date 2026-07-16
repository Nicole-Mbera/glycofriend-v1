/**
 * Returns the Express app without starting the server or scheduler.
 * Import this in tests instead of app.js.
 */
require("dotenv").config();
require("./testDb"); // sets test env vars before anything else loads

const express = require("express");
const cors = require("cors");

const authRoutes = require("../../routes/auth");
const userRoutes = require("../../routes/users");
const logRoutes = require("../../routes/logs");
const dashboardRoutes = require("../../routes/dashboard");
const reportRoutes = require("../../routes/reports");
const foodRoutes = require("../../routes/foods");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/logs", logRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/reports", reportRoutes);
app.use("/api/v1/foods", foodRoutes);

module.exports = app;
