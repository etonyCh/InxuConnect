-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "b2bCompanyId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "b2bCompanyId" TEXT;

-- CreateTable
CREATE TABLE "B2bCompany" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "saasFee" INTEGER NOT NULL,
    "maxPricePerNight" INTEGER NOT NULL DEFAULT 100000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "B2bCompany_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_b2bCompanyId_fkey" FOREIGN KEY ("b2bCompanyId") REFERENCES "B2bCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_b2bCompanyId_fkey" FOREIGN KEY ("b2bCompanyId") REFERENCES "B2bCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;
