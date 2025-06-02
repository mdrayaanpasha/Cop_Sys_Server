-- CreateTable
CREATE TABLE "CopScore" (
    "id" SERIAL NOT NULL,
    "copId" INTEGER NOT NULL,
    "version" TEXT NOT NULL DEFAULT 'v1.0',
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rank" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CopScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CopScore_copId_key" ON "CopScore"("copId");

-- AddForeignKey
ALTER TABLE "CopScore" ADD CONSTRAINT "CopScore_copId_fkey" FOREIGN KEY ("copId") REFERENCES "Cop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
