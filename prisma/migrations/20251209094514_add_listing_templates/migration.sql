-- CreateTable
CREATE TABLE "listing_templates" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "titleMinChars" INTEGER NOT NULL DEFAULT 150,
    "titleMaxChars" INTEGER NOT NULL DEFAULT 200,
    "titleRequireKeyword" BOOLEAN NOT NULL DEFAULT true,
    "titleCapitalization" TEXT NOT NULL DEFAULT 'title',
    "bulletMinChars" INTEGER NOT NULL DEFAULT 180,
    "bulletMaxChars" INTEGER NOT NULL DEFAULT 220,
    "bulletCapitalizeFirst" BOOLEAN NOT NULL DEFAULT true,
    "bulletFormat" TEXT NOT NULL DEFAULT 'benefit-feature',
    "descriptionMinChars" INTEGER NOT NULL DEFAULT 1500,
    "descriptionMaxChars" INTEGER NOT NULL DEFAULT 2000,
    "useHtmlFormatting" BOOLEAN NOT NULL DEFAULT true,
    "avoidWords" TEXT[],
    "tone" TEXT NOT NULL DEFAULT 'professional',
    "includeEmojis" BOOLEAN NOT NULL DEFAULT false,
    "keywordDensity" TEXT NOT NULL DEFAULT 'medium',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listing_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "listing_templates_userId_idx" ON "listing_templates"("userId");

-- AddForeignKey
ALTER TABLE "listing_templates" ADD CONSTRAINT "listing_templates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
