-- CreateEnum
CREATE TYPE "Status" AS ENUM ('PENDING', 'SCANNED', 'EMAILED', 'CONVERTED');

-- CreateTable
CREATE TABLE "ScannedSite" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "companyName" TEXT,
    "email" TEXT,
    "screenshotUrl" TEXT,
    "hasSSL" BOOLEAN NOT NULL DEFAULT false,
    "hasCookieBanner" BOOLEAN NOT NULL DEFAULT false,
    "hasPrivacyPage" BOOLEAN NOT NULL DEFAULT false,
    "hasContactForm" BOOLEAN NOT NULL DEFAULT false,
    "contactFormHasConsent" BOOLEAN NOT NULL DEFAULT false,
    "avgScore" INTEGER NOT NULL DEFAULT 0,
    "status" "Status" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScannedSite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ScannedSite_url_key" ON "ScannedSite"("url");
