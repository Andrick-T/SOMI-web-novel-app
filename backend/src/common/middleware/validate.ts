import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { AppError } from "../errors/http-error.js";

export const validate = (
  schema: z.ZodTypeAny,
  source: "body" | "query" | "params" = "body",
) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const payload = req[source];
    const parsed = schema.safeParse(payload);

    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        field: issue.path.join(".") || "root",
        message: issue.message,
      }));

      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "Request validation failed.",
        details,
      );
    }

    req[source] = parsed.data;
    next();
  };
};
