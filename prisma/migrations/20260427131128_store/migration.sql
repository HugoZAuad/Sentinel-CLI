-- AlterTable
ALTER TABLE "Scan" ADD COLUMN     "duration" TEXT,
ADD COLUMN     "endpointsAnalyzed" INTEGER,
ADD COLUMN     "endpointsDiscovered" INTEGER,
ADD COLUMN     "headersAnalyzed" INTEGER,
ADD COLUMN     "portsScanned" INTEGER;
