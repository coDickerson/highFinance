-- AlterTable
ALTER TABLE "ReimbursementRequest" ADD COLUMN     "paymentMethod" TEXT NOT NULL DEFAULT 'card',
ADD COLUMN     "venmoZelle" TEXT;
