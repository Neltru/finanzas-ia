import { router, protectedProcedure } from "../trpc";
import { detectSubscriptions, detectAnomalies } from "@/server/services/insights.service";

export const insightsRouter = router({
  subscriptions: protectedProcedure.query(async ({ ctx }) => {
    return detectSubscriptions(ctx.userId);
  }),

  anomalies: protectedProcedure.query(async ({ ctx }) => {
    return detectAnomalies(ctx.userId);
  }),

  aiSavings: protectedProcedure.query(async ({ ctx }) => {
    const cache = await ctx.db.categorizationCache.findMany({
      select: { hitCount: true },
    });

    const llamadasAhorradas = cache.reduce((s, c) => s + c.hitCount, 0);

    return {
      descripcionesCacheadas: cache.length,
      llamadasAhorradas,
    };
  }),
});