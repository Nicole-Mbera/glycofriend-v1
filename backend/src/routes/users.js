const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/v1/users/me
router.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

// PUT /api/v1/users/me
router.put("/me", requireAuth, async (req, res) => {
  const {
    name,
    diabetesType,
    medications,
    physicianEmail,
    reportFrequency,
    chwEmail,
    consentSharedWithPhysician,
    consentSharedWithCHW,
  } = req.body;

  const data = {};
  if (name !== undefined) data.name = name;
  if (diabetesType !== undefined) data.diabetesType = diabetesType;
  if (medications !== undefined) data.medications = medications;
  if (physicianEmail !== undefined) data.physicianEmail = physicianEmail;
  if (reportFrequency !== undefined) data.reportFrequency = reportFrequency;
  if (chwEmail !== undefined) data.chwEmail = chwEmail;
  if (consentSharedWithPhysician !== undefined) data.consentSharedWithPhysician = consentSharedWithPhysician;
  if (consentSharedWithCHW !== undefined) data.consentSharedWithCHW = consentSharedWithCHW;

  const user = await prisma.user.update({ where: { id: req.userId }, data });
  res.json(user);
});

module.exports = router;
