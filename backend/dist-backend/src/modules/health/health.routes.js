import { getHealth } from "./health.controller.js";
export const healthRouter = async (req, res) => {
    await getHealth(req, res);
};
