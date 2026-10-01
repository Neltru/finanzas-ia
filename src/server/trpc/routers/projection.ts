import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { projectBalance } from "@/server/services/projection.service";

export const projectionRouter = router({
  balance: protectedProcedure
    .input(
      z
        .object({
          months: z.number().min(1).max(12).default(6),
          accountId: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      return projectBalance(ctx.userId, input?.months ?? 6, input?.accountId);
    }),
});