-- AlterTable
ALTER TABLE "User" ADD COLUMN     "microSavingsEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "savingsBalance" INTEGER NOT NULL DEFAULT 0;
