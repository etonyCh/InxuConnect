-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('NONE', 'PENDING', 'VERIFIED', 'REJECTED');

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "hasGenerator" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasKitchen" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasSecurityGuard" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasStarlink" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasWaterTank" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "surchargeGenerator" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "taxiMotoDistance" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "kycStatus" "KycStatus" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "otpCode" TEXT,
ADD COLUMN     "otpExpiresAt" TIMESTAMP(3),
ADD COLUMN     "phoneVerified" BOOLEAN NOT NULL DEFAULT false;
