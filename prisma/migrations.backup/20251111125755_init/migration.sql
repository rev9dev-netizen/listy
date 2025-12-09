-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "marketplace" TEXT NOT NULL DEFAULT 'US',
    "brand" TEXT,
    "productType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingests" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "asin" TEXT NOT NULL,
    "rawJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ingests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "keywords" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "clusterId" TEXT,
    "class" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "included" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "keywords_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drafts" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "bullets" JSONB NOT NULL,
    "description" TEXT NOT NULL,
    "backendTerms" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "constraints" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "titleLimit" INTEGER NOT NULL DEFAULT 180,
    "bulletLimit" INTEGER NOT NULL DEFAULT 220,
    "descLimit" INTEGER NOT NULL DEFAULT 1500,
    "disallowed" JSONB NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en-US',

    CONSTRAINT "constraints_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_clerkId_key" ON "users"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "projects_userId_idx" ON "projects"("userId");

-- CreateIndex
CREATE INDEX "ingests_projectId_idx" ON "ingests"("projectId");

-- CreateIndex
CREATE INDEX "keywords_projectId_idx" ON "keywords"("projectId");

-- CreateIndex
CREATE INDEX "keywords_class_idx" ON "keywords"("class");

-- CreateIndex
CREATE INDEX "drafts_projectId_idx" ON "drafts"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "constraints_projectId_key" ON "constraints"("projectId");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingests" ADD CONSTRAINT "ingests_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "keywords" ADD CONSTRAINT "keywords_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drafts" ADD CONSTRAINT "drafts_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "constraints" ADD CONSTRAINT "constraints_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
