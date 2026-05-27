-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "surchargeGenerator" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "taxiMotoDistance" INTEGER;
