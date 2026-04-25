import { Router, Request, Response, NextFunction } from "express";
import { fetchRealSensorData } from "../utils/sensors";

const router = Router();

router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await fetchRealSensorData();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
