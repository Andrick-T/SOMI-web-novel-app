import type { Request, Response } from "express";
import { getHealth } from "./health.controller.js";

export const healthRouter = async (req: Request, res: Response) => {
  await getHealth(req, res);
};
