const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendOtp(phone) {
  const code = generateCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Invalidate any previous unused OTPs for this phone
  await prisma.otpSession.updateMany({
    where: { phone, used: false },
    data: { used: true },
  });

  await prisma.otpSession.create({
    data: { phone, code, expiresAt },
  });

  if (process.env.NODE_ENV === "development") {
    console.log(`[DEV OTP] Phone: ${phone}  Code: ${code}`);
    return { delivered: true, dev: true, mockCode: code };
  }

  // Africa's Talking production send
  const AfricasTalking = require("africastalking");
  const at = AfricasTalking({
    apiKey: process.env.AFRICAS_TALKING_API_KEY,
    username: process.env.AFRICAS_TALKING_USERNAME,
  });
  await at.SMS.send({
    to: [phone],
    message: `Your GlycoFriend code is ${code}. Valid for 10 minutes.`,
  });

  return { delivered: true, dev: false };
}

async function verifyOtp(phone, code) {
  const session = await prisma.otpSession.findFirst({
    where: {
      phone,
      code,
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!session) return false;

  await prisma.otpSession.update({
    where: { id: session.id },
    data: { used: true },
  });

  return true;
}

module.exports = { sendOtp, verifyOtp };
