-- AlterTable
ALTER TABLE "ClientSubscription" ADD COLUMN "mpPaymentId" TEXT;

-- AlterTable
ALTER TABLE "Professional"
ADD COLUMN "userId" TEXT,
ADD COLUMN "workingDays" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "SubscriptionPlan"
ADD COLUMN "imageUrl" TEXT,
ADD COLUMN "mpPlanId" TEXT;

-- CreateTable
CREATE TABLE "UnitService" (
    "unitId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,

    CONSTRAINT "UnitService_pkey" PRIMARY KEY ("unitId","serviceId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Professional_userId_key" ON "Professional"("userId");

-- AddForeignKey
ALTER TABLE "UnitService" ADD CONSTRAINT "UnitService_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitService" ADD CONSTRAINT "UnitService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Professional" ADD CONSTRAINT "Professional_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
