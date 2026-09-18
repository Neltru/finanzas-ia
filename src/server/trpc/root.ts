import { router } from "./trpc";
import { transactionRouter } from "./routers/transaction";
import { categoryRouter } from "./routers/category";
import { insightsRouter } from "./routers/insights";
import { accountRouter } from "./routers/account";
import { projectionRouter } from "./routers/projection";

export const appRouter = router({
  transaction: transactionRouter,
  category: categoryRouter,
  insights: insightsRouter,
  account: accountRouter,
  projection: projectionRouter,
});

export type AppRouter = typeof appRouter;