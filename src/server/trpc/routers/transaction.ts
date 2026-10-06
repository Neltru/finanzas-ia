import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, writeProcedure } from "../trpc";

export const transactionRouter = router({
  list: protectedProcedure
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
          account: { bankConnection: { userId: ctx.userId } },
          date: { gte: input.from, lte: input.to },
          accountId: input.accountId,
          categoryId: input.categoryId,
          ...(input.search && {
            rawDescription: { contains: input.search, mode: "insensitive" },
          }),
        },
        include: { category: true, account: { select: { name: true, mask: true } } },
        // El id desempata: muchas transacciones comparten fecha, y con un orden
        // no único el cursor repetía unas filas y se saltaba otras entre páginas
        orderBy: [{ date: "desc" }, { id: "desc" }],
      });

      let nextCursor: string | undefined;
      if (items.length > input.limit) {
        nextCursor = items.pop()!.id;
      }

      return { items, nextCursor };
    }),

  updateCategory: writeProcedure
    .input(z.object({ id: z.string(), categoryId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // La transacción debe ser del usuario, y la categoría global o suya
      const [tx, category] = await Promise.all([
        ctx.db.transaction.findFirst({
          where: { id: input.id, account: { bankConnection: { userId: ctx.userId } } },
          select: { id: true },
        }),
        ctx.db.category.findFirst({
          where: {
            id: input.categoryId,
            OR: [{ isSystem: true }, { userId: ctx.userId }],
          },
          select: { id: true },
        }),
      ]);
      if (!tx || !category) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.db.transaction.update({
        where: { id: input.id },
        data: {
          categoryId: input.categoryId,
          categorizationSource: "MANUAL",
        },
      });
    }),
});
