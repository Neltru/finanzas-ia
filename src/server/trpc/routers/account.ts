import { router, publicProcedure, protectedProcedure } from "../trpc";

export const accountRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
  const accounts = await ctx.db.account.findMany({
    where: { bankConnection: { userId: ctx.userId } },
    include: {
      bankConnection: true,
      _count: { select: { transactions: true } },
    },
    orderBy: { name: "asc" },
  });

    return accounts.map((a) => ({
      id: a.id,
      name: a.name,
      mask: a.mask,
      type: a.type,
      balance: Number(a.currentBalance),
      institution: a.bankConnection.institutionName,
      status: a.bankConnection.status,
      lastSyncedAt: a.bankConnection.lastSyncedAt,
      transactionCount: a._count.transactions,
    }));
  }),
});