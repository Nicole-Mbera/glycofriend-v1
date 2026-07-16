const express = require("express");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const { sendOtp, verifyOtp } = require("../services/otp");

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/v1/auth/send-otp
router.post("/send-otp", async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: "phone is required" });

  try {
    const result = await sendOtp(phone);
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error("send-otp error:", err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

// POST /api/v1/auth/verify-otp
router.post("/verify-otp", async (req, res) => {
  const { phone, code } = req.body;
  if (!phone || !code) return res.status(400).json({ error: "phone and code are required" });

  const valid = await verifyOtp(phone, code);
  if (!valid) return res.status(401).json({ error: "Invalid or expired code" });

  let user = await prisma.user.findUnique({ where: { phone } });
  const isNewUser = !user;

  if (isNewUser) {
    user = await prisma.user.create({
      data: { phone, name: "", diabetesType: "type2" },
    });
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "90d" });

  res.json({ token, isNewUser, userId: user.id });
});

module.exports = router;
