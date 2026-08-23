import { router } from "./trpc";
import { transactionRouter } from "./routers/transaction";
import { categoryRouter } from "./routers/category";

export const appRouter = router({
  transaction: transactionRouter,
  category: categoryRouter,
});

export type AppRouter = typeof appRouter;