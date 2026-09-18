import { router, publicProcedure } from "../trpc";

export const accountRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    const accounts = await ctx.db.account.findMany({
      include: {
        bankConnection: {
          select: { institutionName: true, status: true, lastSyncedAt: true },
        },
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