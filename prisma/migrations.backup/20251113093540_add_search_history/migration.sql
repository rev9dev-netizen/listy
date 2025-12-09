-- CreateTable
CREATE TABLE "search_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "asins" TEXT[],
    "marketplace" TEXT NOT NULL,
    "keywords" JSONB NOT NULL,
    "productInfo" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "search_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "search_history_userId_idx" ON "search_history"("userId");

-- CreateIndex
CREATE INDEX "search_history_createdAt_idx" ON "search_history"("createdAt");
