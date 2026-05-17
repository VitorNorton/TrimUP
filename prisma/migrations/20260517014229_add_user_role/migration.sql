-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'BARBEIRO', 'CLIENTE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'CLIENTE';
