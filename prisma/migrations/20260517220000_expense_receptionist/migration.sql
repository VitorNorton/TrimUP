-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('ALUGUEL', 'UTILIDADES', 'PRODUTOS', 'PESSOAL', 'MARKETING', 'OUTROS');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'RECEPCIONISTA';

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "category" "ExpenseCategory" NOT NULL DEFAULT 'OUTROS',
    "date" TIMESTAMP(3) NOT NULL,
    "unitId" TEXT,
    "recurring" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
