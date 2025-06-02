-- CreateTable
CREATE TABLE "CopRankLogs" (
    "id" SERIAL NOT NULL,
    "copId" INTEGER NOT NULL,
    "Rank" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CopRankLogs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CopRankLogs" ADD CONSTRAINT "CopRankLogs_copId_fkey" FOREIGN KEY ("copId") REFERENCES "Cop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
