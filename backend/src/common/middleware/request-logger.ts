import type { NextFunction, Request, Response } from "express";
import { logger } from "../../config/logger.js";

export const requestLogger = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  logger.info("api-request", {
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
  });
  next();
};
