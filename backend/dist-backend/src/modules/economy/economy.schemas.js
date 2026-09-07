import { z } from "zod";
export const paginationSchema = z.object({
    limit: z.coerce.number().int().min(1).max(100).default(25),
    offset: z.coerce.number().int().min(0).default(0),
});
export const purchaseSchema = z.object({
    amountCfa: z.coerce.number().int().min(100).max(1000000),
});
