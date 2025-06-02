
import express from 'express';
import { DateTime } from 'luxon'; // Using luxon for easier date manipulation
import cors from "cors";
// Initialize Prisma Client
const app = express();
const port = process.env.PORT || 3000; // Use port from environment or default to 3000

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cors())
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

import RankingRouter from './routers/ranking.router';

// Helper function to generate random data
const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomFloat = (min: number, max: number) => parseFloat((Math.random() * (max - min) + min).toFixed(2));
const getRandomItem = (arr: any) => arr[Math.floor(Math.random() * arr.length)];

// Define the available CopRanks (must match your Prisma enum exactly)
const copRanks = [
    "Constable", "seniorConstable", "HeadConstable", "AssistantSubInspector",
    "SubInspector", "Inspector", "DeputySuperintendent",
    "AdditionalSuperintendent", "Superintendent", "SeniorSuperintendent",
    "DirectorInspectorGeneral", "InspectorGeneral", "DirectorGeneralPolice"
];

/**
 * @route GET /seed-data
 * @description Endpoint to seed the database with dummy data.
 * This will create new data every time it's called.
 */
import type { Request, Response } from 'express';

app.get('/seed-data', async (req: Request, res: Response): Promise<any> => {
    try {
        console.log('Starting dummy data creation...');

        const createdCops = [];

        // Create 10 dummy Cops
        for (let i = 0; i < 10; i++) {
            const cop = await prisma.cop.create({
                data: {
                    name: `Cop ${i + 1}`,
                    badgeNumber: `BADGE${1000 + i}`,
                    rank: getRandomItem(copRanks),
                    bodyCamPercent: getRandomFloat(50, 100),
                    patrolFeedback: getRandomFloat(2, 5),
                    complaintCount: getRandomInt(0, 5),
                    arrestsMade: getRandomInt(5, 50),
                    useOfForceIncidents: getRandomInt(0, 3),
                    trainingScore: getRandomFloat(0.7, 1),
                    avgResponseTimePeakHrs: getRandomFloat(5, 20),
                    geoPatrolCoverageIndex: getRandomFloat(0.5, 1),
                    publicFeedbackScore: getRandomFloat(3, 5),
                    officerAbsenteeismRate: getRandomFloat(0, 0.15),
                },
            });
            createdCops.push(cop);
            console.log(`Created Cop: ${cop.name} (ID: ${cop.id})`);
        }

        // For each created cop, create 5-15 shifts and associated cam logs
        for (const cop of createdCops) {
            const numShifts = getRandomInt(5, 15);
            console.log(`Creating ${numShifts} shifts for Cop ${cop.name}...`);

            for (let j = 0; j < numShifts; j++) {
                const startTime = DateTime.now().minus({
                    days: getRandomInt(1, 30),
                    hours: getRandomInt(1, 24)
                }).toJSDate(); // Convert Luxon DateTime to native Date object for Prisma
                const endTime = DateTime.fromJSDate(startTime).plus({
                    hours: getRandomInt(6, 12)
                }).toJSDate();

                const shift = await prisma.shift.create({
                    data: {
                        copId: cop.id,
                        startTime: startTime,
                        endTime: endTime,
                    },
                });
                console.log(`  Created Shift for Cop ${cop.name} (ID: ${shift.id})`);

                // Create CamLogs for the shift
                const camLogsData = [];
                let currentCamTime = DateTime.fromJSDate(startTime);

                while (currentCamTime < DateTime.fromJSDate(endTime)) {
                    // 'ON' event
                    camLogsData.push({
                        shiftId: shift.id,
                        event: "ON",
                        timestamp: currentCamTime.toJSDate()
                    });
                    currentCamTime = currentCamTime.plus({
                        minutes: getRandomInt(30, 180)
                    }); // Cam on for 30-180 mins

                    // 'OFF' event
                    if (currentCamTime < DateTime.fromJSDate(endTime)) {
                        camLogsData.push({
                            shiftId: shift.id,
                            event: "OFF",
                            timestamp: currentCamTime.toJSDate()
                        });
                        currentCamTime = currentCamTime.plus({
                            minutes: getRandomInt(15, 60)
                        }); // Cam off for 15-60 mins
                    }
                }

                // Ensure the last event is 'OFF' if the shift ended with 'ON'
                if (camLogsData.length > 0 && camLogsData[camLogsData.length - 1].event === 'ON' && DateTime.fromJSDate(camLogsData[camLogsData.length - 1].timestamp) > DateTime.fromJSDate(endTime)) {
                    camLogsData[camLogsData.length - 1].timestamp = endTime;
                } else if (camLogsData.length > 0 && camLogsData[camLogsData.length - 1].event === 'ON' && DateTime.fromJSDate(camLogsData[camLogsData.length - 1].timestamp) < DateTime.fromJSDate(endTime)) {
                    camLogsData.push({
                        shiftId: shift.id,
                        event: "OFF",
                        timestamp: endTime
                    });
                }

                if (camLogsData.length > 0) {
                    await prisma.camLog.createMany({
                        data: camLogsData
                    });
                    console.log(`    Created ${camLogsData.length} CamLogs for Shift ${shift.id}`);
                }
            }
        }

        console.log('Dummy data creation complete, fam! 🎉');
        res.status(200).send('Dummy data created successfully! Go check your DB!');
    } catch (error) {
        console.error('Error creating dummy data:', error);
        res.status(500).send('Failed to create dummy data. Check server logs for details.');
    } finally {
        await prisma.$disconnect(); // Disconnect Prisma Client after operation
    }
});


app.use("/api/ranking", RankingRouter);
// Middleware to handle 404 errors
app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
});


// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    console.log(`Visit http://localhost:${port}/seed-data to seed your database.`);
});

