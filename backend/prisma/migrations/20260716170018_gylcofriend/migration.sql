-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "diabetesType" TEXT NOT NULL,
    "medications" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "physicianEmail" TEXT,
    "reportFrequency" TEXT,
    "lastReportSentAt" TIMESTAMP(3),
    "chwEmail" TEXT,
    "lastCHWAlertSentAt" TIMESTAMP(3),
    "consentSharedWithPhysician" BOOLEAN NOT NULL DEFAULT true,
    "consentSharedWithCHW" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GlucoseLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readingMgdl" DOUBLE PRECISION NOT NULL,
    "logType" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GlucoseLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealLog" (
    "id" TEXT NOT NULL,
    "glucoseLogId" TEXT NOT NULL,
    "foods" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MealLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklySummary" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "averageReading" DOUBLE PRECISION NOT NULL,
    "colorBadge" TEXT NOT NULL,
    "totalReadings" INTEGER NOT NULL,
    "suggestions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeeklySummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodOption" (
    "id" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameRw" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "glycemicIndex" TEXT NOT NULL,

    CONSTRAINT "FoodOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpSession" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "MealLog_glucoseLogId_key" ON "MealLog"("glucoseLogId");

-- AddForeignKey
ALTER TABLE "GlucoseLog" ADD CONSTRAINT "GlucoseLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealLog" ADD CONSTRAINT "MealLog_glucoseLogId_fkey" FOREIGN KEY ("glucoseLogId") REFERENCES "GlucoseLog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklySummary" ADD CONSTRAINT "WeeklySummary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
