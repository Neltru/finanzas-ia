import { router, publicProcedure } from "../trpc";

export const categoryRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.category.findMany({ orderBy: { name: "asc" } });
  }),
});