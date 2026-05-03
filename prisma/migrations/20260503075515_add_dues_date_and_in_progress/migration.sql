-- AlterEnum
ALTER TYPE "DuesStatus" ADD VALUE 'in_progress';

-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "dueDate" TIMESTAMP(3);
