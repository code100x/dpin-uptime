/*
  Warnings:

  - Added the required column `status` to the `Transactions` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('Pending', 'Success', 'Failure');

-- AlterTable
ALTER TABLE "Transactions" ADD COLUMN     "status" "TransactionStatus" NOT NULL;
