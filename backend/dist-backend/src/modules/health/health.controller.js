import { checkDatabaseConnection } from "../../config/database.js";
export const getHealth = async (_req, res) => {
    const dbStatus = await checkDatabaseConnection();
    if (dbStatus.status === "disconnected") {
        return res.status(503).json({
            success: false,
            data: {
                status: "degraded",
                database: "disconnected",
                message: dbStatus.message ?? "Database unavailable.",
            },
        });
    }
    return res.json({
        success: true,
        data: {
            status: "ok",
            database: "connected",
            latencyMs: dbStatus.latencyMs ?? 0,
        },
    });
};
