-- CreateEnum
CREATE TYPE "CopRank" AS ENUM ('Constable', 'seniorConstable', 'HeadConstable', 'AssistantSubInspector', 'SubInspector', 'Inspector', 'DeputySuperintendent', 'AdditionalSuperintendent', 'Superintendent', 'SeniorSuperintendent', 'DirectorInspectorGeneral', 'InspectorGeneral', 'DirectorGeneralPolice');

-- CreateTable
CREATE TABLE "Cop" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "badgeNumber" TEXT NOT NULL,
    "rank" "CopRank" NOT NULL,
    "bodyCamPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "patrolFeedback" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "complaintCount" INTEGER NOT NULL DEFAULT 0,
    "arrestsMade" INTEGER NOT NULL DEFAULT 0,
    "useOfForceIncidents" INTEGER NOT NULL DEFAULT 0,
    "trainingScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgResponseTimePeakHrs" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "geoPatrolCoverageIndex" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "publicFeedbackScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "officerAbsenteeismRate" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "Cop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shift" (
    "id" SERIAL NOT NULL,
    "copId" INTEGER NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CamLog" (
    "id" SERIAL NOT NULL,
    "shiftId" INTEGER NOT NULL,
    "event" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CamLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cop_badgeNumber_key" ON "Cop"("badgeNumber");

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_copId_fkey" FOREIGN KEY ("copId") REFERENCES "Cop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CamLog" ADD CONSTRAINT "CamLog_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
