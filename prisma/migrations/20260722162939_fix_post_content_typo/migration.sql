/*
  Warnings:

  - You are about to drop the column `contet` on the `Post` table. All the data in the column will be lost.
  - Added the required column `excerpt` to the `Post` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Post" DROP COLUMN "contet",
ADD COLUMN     "content" TEXT,
ADD COLUMN     "excerpt" TEXT NOT NULL;
