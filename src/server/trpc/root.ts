import { router } from "./trpc";
import { transactionRouter } from "./routers/transaction";

export const appRouter = router({
  transaction: transactionRouter,
});

export type AppRouter = typeof appRouter;