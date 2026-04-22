-- CreateEnum
CREATE TYPE "Semester" AS ENUM ('spring', 'fall');

-- CreateEnum
CREATE TYPE "IncomeType" AS ENUM ('dues', 'rental', 'other');

-- AlterTable
ALTER TABLE "Budget" ADD COLUMN     "semester" "Semester" NOT NULL DEFAULT 'fall';

-- CreateTable
CREATE TABLE "Income" (
    "id" TEXT NOT NULL,
    "type" "IncomeType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "description" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "semester" "Semester" NOT NULL,
    "year" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Income_pkey" PRIMARY KEY ("id")
);
