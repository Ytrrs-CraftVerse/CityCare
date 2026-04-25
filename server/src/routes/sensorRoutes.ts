import { Router, Request, Response } from "express";
import { generateSensorData } from "../utils/sensors";

const router = Router();

router.get("/", (_req: Request, res: Response) => {
  const data = generateSensorData();
  res.json(data);
});

export default router;
