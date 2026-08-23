import { z } from "zod";
import { router, publicProcedure } from "../trpc";

export const transactionRouter = router({
  list: publicProcedure
    .input(
      z.object({
        from: z.date().optional(),
        to: z.date().optional(),
        accountId: z.string().optional(),
        categoryId: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(200).default(50),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const items = await ctx.db.transaction.findMany({
        take: input.limit + 1, // uno extra para saber si hay más
        cursor: input.cursor ? { id: input.cursor } : undefined,
        where: {
          date: { gte: input.from, lte: input.to },
          accountId: input.accountId,
          categoryId: input.categoryId,
          ...(input.search && {
            rawDescription: { contains: input.search, mode: "insensitive" },
          }),
        },
        include: { category: true, account: { select: { name: true, mask: true } } },
        orderBy: { date: "desc" },
      });

      let nextCursor: string | undefined;
      if (items.length > input.limit) {
        nextCursor = items.pop()!.id;
      }

      return { items, nextCursor };
    }),

  updateCategory: publicProcedure
    .input(z.object({ id: z.string(), categoryId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.transaction.update({
        where: { id: input.id },
        data: {
          categoryId: input.categoryId,
          categorizationSource: "MANUAL",
        },
      });
    }),
});