/*
  Warnings:

  - Added the required column `Score` to the `CopRankLogs` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `Rank` on the `CopRankLogs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "CopRankLogs" ADD COLUMN     "Score" DOUBLE PRECISION NOT NULL,
DROP COLUMN "Rank",
ADD COLUMN     "Rank" INTEGER NOT NULL;
