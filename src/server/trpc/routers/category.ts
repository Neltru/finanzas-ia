import { router, protectedProcedure } from "../trpc";

export const categoryRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
  return ctx.db.category.findMany({
    where: {
      OR: [
        { isSystem: true },       // globales, visibles para todos
        { userId: ctx.userId },   // las propias del usuario
      ],
    },
    orderBy: { name: "asc" },
  });
  }),
});