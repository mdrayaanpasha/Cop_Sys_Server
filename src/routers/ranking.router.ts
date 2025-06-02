import { Router } from "express";
import RankAlgorithm from "../controllers/ranking.controller";
const RankingRouter = Router();

// Ensure RankAlgorithm.RankCop exists and is a function
RankingRouter.get("/updateRankings", RankAlgorithm.updateCopRankings);
RankingRouter.get("/topCops", RankAlgorithm.topRankedCops);
RankingRouter.get("/:id", RankAlgorithm.RankCop);

export default RankingRouter;