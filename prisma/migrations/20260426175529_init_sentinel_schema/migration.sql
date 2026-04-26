-- DropForeignKey
ALTER TABLE "Finding" DROP CONSTRAINT "Finding_scanId_fkey";

-- CreateTable
CREATE TABLE "NetworkScan" (
    "id" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "startPort" INTEGER NOT NULL,
    "endPort" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NetworkScan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkPort" (
    "id" TEXT NOT NULL,
    "networkScanId" TEXT NOT NULL,
    "port" INTEGER NOT NULL,
    "service" TEXT NOT NULL,
    "banner" TEXT NOT NULL,

    CONSTRAINT "NetworkPort_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Finding" ADD CONSTRAINT "Finding_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "Scan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkPort" ADD CONSTRAINT "NetworkPort_networkScanId_fkey" FOREIGN KEY ("networkScanId") REFERENCES "NetworkScan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
