import { PrismaClient } from '@prisma/client';
import type { Request, Response } from 'express';

const prisma = new PrismaClient();

class RankAlgorithm {

    normalize(value: number, max: number, min = 0) {
        if (max === min) return 0;
        return Math.max(0, Math.min((value - min) / (max - min), 1));
    }

    calculateCopScoreV1(profile: any) {
        const maxVals = {
            body_cam_percent: 100,
            patrol_feedback: 5,
            complaint_count: 10,
            arrests_made: 30,
            use_of_force_incidents: 5,
            training_score: 1,
            avg_response_time_peak_hrs: 30,
            geo_patrol_coverage_index: 1,
            public_feedback_score: 5,
            officer_absenteeism_rate: 0.25,
        };

        const score =
            0.1 * this.normalize(profile.bodyCamPercent, maxVals.body_cam_percent) +
            0.15 * this.normalize(profile.patrolFeedback, maxVals.patrol_feedback) +
            0.15 * (1 - this.normalize(profile.complaintCount, maxVals.complaint_count)) +
            0.1 * this.normalize(profile.arrestsMade, maxVals.arrests_made) +
            0.05 * (1 - this.normalize(profile.useOfForceIncidents, maxVals.use_of_force_incidents)) +
            0.1 * this.normalize(profile.trainingScore, maxVals.training_score) +
            0.15 * (1 - this.normalize(profile.avgResponseTimePeakHrs, maxVals.avg_response_time_peak_hrs, 2)) +
            0.1 * this.normalize(profile.geoPatrolCoverageIndex, maxVals.geo_patrol_coverage_index) +
            0.05 * this.normalize(profile.publicFeedbackScore, maxVals.public_feedback_score) +
            0.05 * (1 - this.normalize(profile.officerAbsenteeismRate, maxVals.officer_absenteeism_rate));

        return Math.round(Math.min(Math.max(score, 0), 1) * 1000) / 1000;
    }

    // This is the reusable core logic to calculate + save score
    async calculateAndUpsertScore(copId: number): Promise<number> {
        const cop = await prisma.cop.findUnique({ where: { id: copId } });
        if (!cop) throw new Error(`Cop with ID ${copId} not found`);

        const score = this.calculateCopScoreV1(cop); // Use the cop object here

        await prisma.copScore.upsert({
            where: { copId },
            update: { score },
            create: { copId, score, rank: 0 }, // rank 0 means unranked for now
        });

        return score;
    }

    // Express handler: get score for 1 cop and respond
    RankCop = async (req: Request, res: Response): Promise<any> => { // Changed to arrow function
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

        try {
            const score = await this.calculateAndUpsertScore(id); // Now correctly calls calculateAndUpsertScore
            const cop = await prisma.cop.findUnique({ where: { id } });
            return res.json({ copInfo: cop, score });
        } catch (err) {
            console.error('[RankCop] Error:', err);
            return res.status(404).json({ error: 'Internal server error' });
        }
    }

    // Express handler: update all cop rankings based on scores
    updateCopRankings = async (req: Request, res: Response): Promise<any> => {
        try {
            const cops = await prisma.cop.findMany();

            if (!cops || cops.length === 0) {
                return res.status(404).json({ error: 'No cops found' });
            }

            const scoresWithCopId = await Promise.all(
                cops.map(async (cop) => ({
                    copId: cop.id,
                    score: await this.calculateAndUpsertScore(cop.id),
                    bodyCamPercent: cop.bodyCamPercent,
                    trainingScore: cop.trainingScore,
                    avgResponseTimePeakHrs: cop.avgResponseTimePeakHrs,
                    geoPatrolCoverageIndex: cop.geoPatrolCoverageIndex,
                    publicFeedbackScore: cop.publicFeedbackScore,
                    officerAbsenteeismRate: cop.officerAbsenteeismRate,
                    patrolFeedback: cop.patrolFeedback,
                    complaintCount: cop.complaintCount,
                    arrestsMade: cop.arrestsMade,
                    useOfForceIncidents: cop.useOfForceIncidents
                }))
            );

            scoresWithCopId.sort((a, b) => b.score - a.score);

            if (scoresWithCopId.length === 0) {
                return res.status(404).json({ error: 'No scores found after calculation' });
            }

            for (let i = 0; i < scoresWithCopId.length; i++) {
                const copData = scoresWithCopId[i];

                const lastLog = await prisma.copRankLogs.findFirst({
                    where: { copId: copData.copId },
                    orderBy: { timestamp: 'desc' }
                });

                const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

                if (lastLog && new Date(lastLog.timestamp).getTime() > thirtyDaysAgo) {
                    continue; // Skip logging if recent log exists
                }

                await prisma.copRankLogs.create({
                    data: {
                        copId: copData.copId,
                        Rank: i + 1,
                        bodyCamPercent: copData.bodyCamPercent,
                        trainingScore: copData.trainingScore,
                        avgResponseTimePeakHrs: copData.avgResponseTimePeakHrs,
                        geoPatrolCoverageIndex: copData.geoPatrolCoverageIndex,
                        publicFeedbackScore: copData.publicFeedbackScore,
                        officerAbsenteeismRate: copData.officerAbsenteeismRate,
                        patrolFeedback: copData.patrolFeedback,
                        complaintCount: copData.complaintCount,
                        arrestsMade: copData.arrestsMade,
                        useOfForceIncidents: copData.useOfForceIncidents,
                        Score: copData.score,
                        timestamp: new Date()
                    }
                });

                await prisma.copScore.upsert({
                    where: { copId: copData.copId },
                    update: {
                        rank: i + 1,
                        score: copData.score
                    },
                    create: {
                        copId: copData.copId,
                        rank: i + 1,
                        score: copData.score
                    }
                });
            }

            return res.status(200).json({ message: 'Cop rankings updated successfully' });
        } catch (err) {
            console.error('[updateCopRankings] Error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    };


    // Express handler: get top 10 ranked cops
    topRankedCops = async (req: Request, res: Response): Promise<any> => { // Changed to arrow function
        try {
            const topCops = await prisma.copScore.findMany({
                orderBy: { rank: 'asc' },
                take: 10,
                include: {
                    cop: true, // include cop info if you want
                },
            });
            return res.json(topCops);
        } catch (err) {
            console.error('[topRankedCops] Error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
}

export default new RankAlgorithm();