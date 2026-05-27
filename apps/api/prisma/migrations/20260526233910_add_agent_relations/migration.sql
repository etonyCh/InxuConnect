-- AlterTable
ALTER TABLE "User" ADD COLUMN     "referredByAgentId" TEXT;

-- CreateTable
CREATE TABLE "AgentCommission" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentCommission_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_referredByAgentId_fkey" FOREIGN KEY ("referredByAgentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
