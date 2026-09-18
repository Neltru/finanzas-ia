import { router, publicProcedure } from "../trpc";
import { detectSubscriptions, detectAnomalies } from "@/server/services/insights.service";

export const insightsRouter = router({
  subscriptions: publicProcedure.query(async () => {
    return detectSubscriptions();
  }),

  anomalies: publicProcedure.query(async () => {
    return detectAnomalies();
  }),

  aiSavings: publicProcedure.query(async ({ ctx }) => {
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