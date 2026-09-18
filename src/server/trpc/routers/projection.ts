import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { projectBalance } from "@/server/services/projection.service";

export const projectionRouter = router({
  balance: publicProcedure
    .input(
      z
        .object({
          months: z.number().min(1).max(12).default(6),
          accountId: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      return projectBalance(input?.months ?? 6, input?.accountId);
    }),
});