-- AlterTable
ALTER TABLE "drafts" ADD COLUMN     "contentHash" TEXT,
ADD COLUMN     "finalized" BOOLEAN NOT NULL DEFAULT true;
