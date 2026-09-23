-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "documentPath" TEXT,
ADD COLUMN     "documentSize" INTEGER,
ADD COLUMN     "documentUploadedAt" TIMESTAMP(3);
