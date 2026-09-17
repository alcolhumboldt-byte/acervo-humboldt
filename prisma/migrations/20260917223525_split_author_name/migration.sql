/*
  Warnings:

  - You are about to drop the column `fullName` on the `Author` table. All the data in the column will be lost.
  - Added the required column `familyNames` to the `Author` table without a default value. This is not possible if the table is not empty.
  - Added the required column `givenNames` to the `Author` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Author" DROP COLUMN "fullName",
ADD COLUMN     "familyNames" TEXT NOT NULL,
ADD COLUMN     "givenNames" TEXT NOT NULL;
