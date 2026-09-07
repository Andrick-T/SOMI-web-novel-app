import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { errorHandler } from "./common/errors/error-handler.js";
import { notFoundHandler } from "./common/middleware/not-found.js";
import { requestLogger } from "./common/middleware/request-logger.js";
import { healthRouter } from "./modules/health/health.routes.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { contentRouter } from "./modules/content/content.routes.js";
import { libraryRouter } from "./modules/library/library.routes.js";
import { economyRouter } from "./modules/economy/economy.routes.js";
export const createApp = () => {
    const app = express();
    app.use(helmet({
        contentSecurityPolicy: false,
    }));
    app.use(cors({
        origin: env.CORS_ORIGIN ?? true,
        credentials: true,
    }));
    app.use(express.json({ limit: "1mb" }));
    app.use(requestLogger);
    app.get("/api/v1/health", healthRouter);
    app.use("/api/v1/auth", authRouter);
    app.use("/api/v1", contentRouter);
    app.use("/api/v1", libraryRouter);
    app.use("/api/v1", economyRouter);
    app.use(notFoundHandler);
    app.use(errorHandler);
    return app;
};
