-- CreateEnum
CREATE TYPE "CommissionType" AS ENUM ('PERCENTAGE', 'FIXED', 'PER_SERVICE');

-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('BASICO', 'PRO', 'ENTERPRISE');

-- AlterTable
ALTER TABLE "Professional" ADD COLUMN     "commissionFixed" DECIMAL(10,2),
ADD COLUMN     "commissionType" "CommissionType" NOT NULL DEFAULT 'PERCENTAGE';

-- CreateTable
CREATE TABLE "ProfessionalService" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "commissionRate" DOUBLE PRECISION,
    "commissionFixed" DECIMAL(10,2),

    CONSTRAINT "ProfessionalService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "plan" "PlanTier" NOT NULL DEFAULT 'BASICO',
    "status" TEXT NOT NULL DEFAULT 'active',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProfessionalService_professionalId_serviceId_key" ON "ProfessionalService"("professionalId", "serviceId");

-- AddForeignKey
ALTER TABLE "ProfessionalService" ADD CONSTRAINT "ProfessionalService_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalService" ADD CONSTRAINT "ProfessionalService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
