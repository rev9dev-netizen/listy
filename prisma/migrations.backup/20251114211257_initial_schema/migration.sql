/*
  Warnings:

  - You are about to drop the column `projectId` on the `constraints` table. All the data in the column will be lost.
  - You are about to drop the column `projectId` on the `drafts` table. All the data in the column will be lost.
  - You are about to drop the column `projectId` on the `ingests` table. All the data in the column will be lost.
  - You are about to drop the column `projectId` on the `keywords` table. All the data in the column will be lost.
  - You are about to drop the `projects` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId]` on the table `constraints` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `constraints` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `drafts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `ingests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `keywords` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "constraints" DROP CONSTRAINT "constraints_projectId_fkey";

-- DropForeignKey
ALTER TABLE "drafts" DROP CONSTRAINT "drafts_projectId_fkey";

-- DropForeignKey
ALTER TABLE "ingests" DROP CONSTRAINT "ingests_projectId_fkey";

-- DropForeignKey
ALTER TABLE "keywords" DROP CONSTRAINT "keywords_projectId_fkey";

-- DropForeignKey
ALTER TABLE "projects" DROP CONSTRAINT "projects_userId_fkey";

-- DropIndex
DROP INDEX "constraints_projectId_key";

-- DropIndex
DROP INDEX "drafts_projectId_idx";

-- DropIndex
DROP INDEX "ingests_projectId_idx";

-- DropIndex
DROP INDEX "keywords_projectId_idx";

-- AlterTable
ALTER TABLE "constraints" DROP COLUMN "projectId",
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "drafts" DROP COLUMN "projectId",
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ingests" DROP COLUMN "projectId",
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "keywords" DROP COLUMN "projectId",
ADD COLUMN     "userId" TEXT NOT NULL;

-- DropTable
DROP TABLE "projects";

-- CreateTable
CREATE TABLE "ppc_campaigns" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "marketplace" TEXT NOT NULL,
    "asin" TEXT NOT NULL,
    "campaignName" TEXT NOT NULL,
    "campaignType" TEXT NOT NULL,
    "targetingType" TEXT NOT NULL,
    "dailyBudget" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "targetAcos" DOUBLE PRECISION,

    CONSTRAINT "ppc_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ppc_ad_groups" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "defaultBid" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ppc_ad_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ppc_keywords" (
    "id" TEXT NOT NULL,
    "adGroupId" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "matchType" TEXT NOT NULL,
    "bid" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "qualityScore" DOUBLE PRECISION,
    "profitScore" DOUBLE PRECISION,
    "conversionProb" DOUBLE PRECISION,
    "lifecycle" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ppc_keywords_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ppc_targets" (
    "id" TEXT NOT NULL,
    "adGroupId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetValue" TEXT NOT NULL,
    "bid" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ppc_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ppc_campaign_metrics" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "impressions" INTEGER NOT NULL,
    "clicks" INTEGER NOT NULL,
    "spend" DOUBLE PRECISION NOT NULL,
    "sales" DOUBLE PRECISION NOT NULL,
    "orders" INTEGER NOT NULL,
    "ctr" DOUBLE PRECISION NOT NULL,
    "cpc" DOUBLE PRECISION NOT NULL,
    "acos" DOUBLE PRECISION NOT NULL,
    "roas" DOUBLE PRECISION NOT NULL,
    "conversionRate" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ppc_campaign_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ppc_ad_group_metrics" (
    "id" TEXT NOT NULL,
    "adGroupId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "impressions" INTEGER NOT NULL,
    "clicks" INTEGER NOT NULL,
    "spend" DOUBLE PRECISION NOT NULL,
    "sales" DOUBLE PRECISION NOT NULL,
    "orders" INTEGER NOT NULL,
    "ctr" DOUBLE PRECISION NOT NULL,
    "cpc" DOUBLE PRECISION NOT NULL,
    "acos" DOUBLE PRECISION NOT NULL,
    "roas" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ppc_ad_group_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ppc_keyword_metrics" (
    "id" TEXT NOT NULL,
    "keywordId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "hour" INTEGER,
    "impressions" INTEGER NOT NULL,
    "clicks" INTEGER NOT NULL,
    "spend" DOUBLE PRECISION NOT NULL,
    "sales" DOUBLE PRECISION NOT NULL,
    "orders" INTEGER NOT NULL,
    "ctr" DOUBLE PRECISION NOT NULL,
    "cpc" DOUBLE PRECISION NOT NULL,
    "acos" DOUBLE PRECISION NOT NULL,
    "roas" DOUBLE PRECISION NOT NULL,
    "conversionRate" DOUBLE PRECISION NOT NULL,
    "cpm" DOUBLE PRECISION,
    "attributedSales7d" DOUBLE PRECISION,
    "attributedUnits7d" INTEGER,

    CONSTRAINT "ppc_keyword_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ppc_bid_history" (
    "id" TEXT NOT NULL,
    "keywordId" TEXT NOT NULL,
    "oldBid" DOUBLE PRECISION NOT NULL,
    "newBid" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "changedBy" TEXT NOT NULL DEFAULT 'System',
    "ruleApplied" TEXT,
    "acos" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ppc_bid_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ppc_automation_rules" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "campaignId" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "conditions" JSONB NOT NULL,
    "actions" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "lastRun" TIMESTAMP(3),
    "runsCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ppc_automation_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ppc_dayparting_schedules" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "hour" INTEGER NOT NULL,
    "bidModifier" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ppc_dayparting_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ppc_competitor_alerts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "asin" TEXT NOT NULL,
    "competitorAsin" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ppc_competitor_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ppc_ai_bid_predictions" (
    "id" TEXT NOT NULL,
    "keywordId" TEXT NOT NULL,
    "predictedCPC" DOUBLE PRECISION NOT NULL,
    "predictedClicks" INTEGER NOT NULL,
    "predictedSales" DOUBLE PRECISION NOT NULL,
    "predictedAcos" DOUBLE PRECISION NOT NULL,
    "recommendedBid" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "reasoning" TEXT,
    "predictionDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ppc_ai_bid_predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ppc_profit_calculations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "asin" TEXT NOT NULL,
    "productCost" DOUBLE PRECISION NOT NULL,
    "amazonFees" DOUBLE PRECISION NOT NULL,
    "shippingCost" DOUBLE PRECISION NOT NULL,
    "miscCosts" DOUBLE PRECISION NOT NULL,
    "sellingPrice" DOUBLE PRECISION NOT NULL,
    "profitMargin" DOUBLE PRECISION NOT NULL,
    "breakEvenAcos" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ppc_profit_calculations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ppc_audit_reports" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "findings" JSONB NOT NULL,
    "recommendations" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ppc_audit_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ppc_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "defaultBidStrategy" TEXT NOT NULL,
    "automationThresholds" JSONB NOT NULL,
    "cogsPercentages" JSONB NOT NULL,
    "notifications" JSONB NOT NULL,
    "marketplace" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ppc_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ppc_campaigns_userId_marketplace_idx" ON "ppc_campaigns"("userId", "marketplace");

-- CreateIndex
CREATE INDEX "ppc_campaigns_asin_idx" ON "ppc_campaigns"("asin");

-- CreateIndex
CREATE INDEX "ppc_ad_groups_campaignId_idx" ON "ppc_ad_groups"("campaignId");

-- CreateIndex
CREATE INDEX "ppc_keywords_adGroupId_idx" ON "ppc_keywords"("adGroupId");

-- CreateIndex
CREATE INDEX "ppc_keywords_keyword_idx" ON "ppc_keywords"("keyword");

-- CreateIndex
CREATE INDEX "ppc_targets_adGroupId_idx" ON "ppc_targets"("adGroupId");

-- CreateIndex
CREATE INDEX "ppc_campaign_metrics_campaignId_date_idx" ON "ppc_campaign_metrics"("campaignId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ppc_campaign_metrics_campaignId_date_key" ON "ppc_campaign_metrics"("campaignId", "date");

-- CreateIndex
CREATE INDEX "ppc_ad_group_metrics_adGroupId_date_idx" ON "ppc_ad_group_metrics"("adGroupId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ppc_ad_group_metrics_adGroupId_date_key" ON "ppc_ad_group_metrics"("adGroupId", "date");

-- CreateIndex
CREATE INDEX "ppc_keyword_metrics_keywordId_date_idx" ON "ppc_keyword_metrics"("keywordId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ppc_keyword_metrics_keywordId_date_hour_key" ON "ppc_keyword_metrics"("keywordId", "date", "hour");

-- CreateIndex
CREATE INDEX "ppc_bid_history_keywordId_idx" ON "ppc_bid_history"("keywordId");

-- CreateIndex
CREATE INDEX "ppc_bid_history_createdAt_idx" ON "ppc_bid_history"("createdAt");

-- CreateIndex
CREATE INDEX "ppc_automation_rules_userId_idx" ON "ppc_automation_rules"("userId");

-- CreateIndex
CREATE INDEX "ppc_automation_rules_campaignId_idx" ON "ppc_automation_rules"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "ppc_dayparting_schedules_campaignId_dayOfWeek_hour_key" ON "ppc_dayparting_schedules"("campaignId", "dayOfWeek", "hour");

-- CreateIndex
CREATE INDEX "ppc_competitor_alerts_userId_read_idx" ON "ppc_competitor_alerts"("userId", "read");

-- CreateIndex
CREATE INDEX "ppc_competitor_alerts_createdAt_idx" ON "ppc_competitor_alerts"("createdAt");

-- CreateIndex
CREATE INDEX "ppc_ai_bid_predictions_keywordId_idx" ON "ppc_ai_bid_predictions"("keywordId");

-- CreateIndex
CREATE INDEX "ppc_ai_bid_predictions_predictionDate_idx" ON "ppc_ai_bid_predictions"("predictionDate");

-- CreateIndex
CREATE INDEX "ppc_profit_calculations_userId_idx" ON "ppc_profit_calculations"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ppc_profit_calculations_userId_asin_key" ON "ppc_profit_calculations"("userId", "asin");

-- CreateIndex
CREATE INDEX "ppc_audit_reports_userId_idx" ON "ppc_audit_reports"("userId");

-- CreateIndex
CREATE INDEX "ppc_audit_reports_campaignId_idx" ON "ppc_audit_reports"("campaignId");

-- CreateIndex
CREATE INDEX "ppc_audit_reports_createdAt_idx" ON "ppc_audit_reports"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ppc_settings_userId_key" ON "ppc_settings"("userId");

-- CreateIndex
CREATE INDEX "ppc_settings_userId_idx" ON "ppc_settings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "constraints_userId_key" ON "constraints"("userId");

-- CreateIndex
CREATE INDEX "drafts_userId_idx" ON "drafts"("userId");

-- CreateIndex
CREATE INDEX "ingests_userId_idx" ON "ingests"("userId");

-- CreateIndex
CREATE INDEX "keywords_userId_idx" ON "keywords"("userId");

-- AddForeignKey
ALTER TABLE "ingests" ADD CONSTRAINT "ingests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "keywords" ADD CONSTRAINT "keywords_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drafts" ADD CONSTRAINT "drafts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "constraints" ADD CONSTRAINT "constraints_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ppc_campaigns" ADD CONSTRAINT "ppc_campaigns_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ppc_ad_groups" ADD CONSTRAINT "ppc_ad_groups_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "ppc_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ppc_keywords" ADD CONSTRAINT "ppc_keywords_adGroupId_fkey" FOREIGN KEY ("adGroupId") REFERENCES "ppc_ad_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ppc_targets" ADD CONSTRAINT "ppc_targets_adGroupId_fkey" FOREIGN KEY ("adGroupId") REFERENCES "ppc_ad_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ppc_campaign_metrics" ADD CONSTRAINT "ppc_campaign_metrics_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "ppc_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ppc_ad_group_metrics" ADD CONSTRAINT "ppc_ad_group_metrics_adGroupId_fkey" FOREIGN KEY ("adGroupId") REFERENCES "ppc_ad_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ppc_keyword_metrics" ADD CONSTRAINT "ppc_keyword_metrics_keywordId_fkey" FOREIGN KEY ("keywordId") REFERENCES "ppc_keywords"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ppc_bid_history" ADD CONSTRAINT "ppc_bid_history_keywordId_fkey" FOREIGN KEY ("keywordId") REFERENCES "ppc_keywords"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ppc_automation_rules" ADD CONSTRAINT "ppc_automation_rules_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "ppc_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ppc_dayparting_schedules" ADD CONSTRAINT "ppc_dayparting_schedules_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "ppc_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ppc_ai_bid_predictions" ADD CONSTRAINT "ppc_ai_bid_predictions_keywordId_fkey" FOREIGN KEY ("keywordId") REFERENCES "ppc_keywords"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ppc_audit_reports" ADD CONSTRAINT "ppc_audit_reports_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "ppc_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
