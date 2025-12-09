-- CreateTable
CREATE TABLE "keyword_research" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "asin" TEXT NOT NULL,
    "marketplace" TEXT NOT NULL DEFAULT 'US',
    "keyword" TEXT NOT NULL,
    "searchVolume" INTEGER,
    "organicRank" INTEGER,
    "sponsoredRank" INTEGER,
    "competingProducts" INTEGER,
    "titleDensity" INTEGER,
    "searchVolumeTrend" DOUBLE PRECISION,
    "matchType" TEXT,
    "cerebro_iq_score" INTEGER,
    "suggested_ppc_bid" DOUBLE PRECISION,
    "keyword_sales" INTEGER,
    "cpr" INTEGER,
    "sponsored_asins" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "keyword_research_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "keyword_research_userId_idx" ON "keyword_research"("userId");

-- CreateIndex
CREATE INDEX "keyword_research_asin_marketplace_idx" ON "keyword_research"("asin", "marketplace");

-- CreateIndex
CREATE INDEX "keyword_research_keyword_idx" ON "keyword_research"("keyword");
