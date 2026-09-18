import {
  Configuration,
  PlaidApi,
  PlaidEnvironments,
  Products,
  CountryCode,
} from "plaid";
import { db } from "@/server/db";
import { normalizeDescription } from "@/lib/format";
import { categorizeQueue } from "@/server/jobs/queue";

// ──────────────────────────────────────────────
// Cliente
// ──────────────────────────────────────────────

const config = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV ?? "sandbox"],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
      "PLAID-SECRET": process.env.PLAID_SECRET,
    },
  },
});

export const plaid = new PlaidApi(config);

// ──────────────────────────────────────────────
// Flujo de tokens
// ──────────────────────────────────────────────

export async function createLinkToken(userId: string) {
  const res = await plaid.linkTokenCreate({
    user: { client_user_id: userId },
    client_name: "Dashboard de Finanzas",
    products: [Products.Transactions],
    country_codes: [CountryCode.Us],
    language: "es",
  });
  return res.data.link_token;
}

export async function exchangePublicToken(publicToken: string) {
  const res = await plaid.itemPublicTokenExchange({
    public_token: publicToken,
  });
  return {
    accessToken: res.data.access_token,
    itemId: res.data.item_id,
  };
}

// ──────────────────────────────────────────────
// Sincronización incremental e idempotente
// ──────────────────────────────────────────────

export async function syncTransactions(bankConnectionId: string) {
  const conn = await db.bankConnection.findUniqueOrThrow({
    where: { id: bankConnectionId },
  });

  // The generated Prisma client may not expose this delegate until it is regenerated.
  const syncLog = (db as typeof db & { syncLog: typeof db extends { syncLog: infer T } ? T : any }).syncLog;
  const log = await syncLog.create({
    data: {
      bankConnectionId,
      triggeredBy: "webhook",
      status: "running",
    },
  });

  try {
    let cursor = conn.lastSyncCursor ?? undefined;
    let hasMore = true;

    const nuevas: string[] = [];
    let added = 0;
    let modified = 0;
    let removed = 0;

    while (hasMore) {
      const res = await plaid.transactionsSync({
        access_token: conn.plaidAccessToken,
        cursor,
      });

      // Cuentas primero: las transacciones dependen de ellas
      for (const acc of res.data.accounts) {
        await db.account.upsert({
          where: { plaidAccountId: acc.account_id },
          create: {
            bankConnectionId,
            plaidAccountId: acc.account_id,
            name: acc.name,
            mask: acc.mask,
            type: acc.type,
            currentBalance: acc.balances.current ?? 0,
          },
          update: {
            currentBalance: acc.balances.current ?? 0,
          },
        });
      }

      const cuentas = await db.account.findMany({
        where: { bankConnectionId },
        select: { id: true, plaidAccountId: true },
      });
      const idPorPlaidId = new Map(
        cuentas.map((c) => [c.plaidAccountId, c.id])
      );

      for (const t of [...res.data.added, ...res.data.modified]) {
        const accountId = idPorPlaidId.get(t.account_id);
        if (!accountId) continue;

        const desc = t.name ?? "";

        // Idempotencia: upsert por transaction_id de Plaid.
        // Un webhook duplicado actualiza en vez de duplicar.
        const saved = await db.transaction.upsert({
          where: { plaidTransactionId: t.transaction_id },
          create: {
            accountId,
            plaidTransactionId: t.transaction_id,
            amount: t.amount,
            date: new Date(t.date),
            merchantName: t.merchant_name,
            rawDescription: desc,
            normalizedDescription: normalizeDescription(desc),
          },
          update: {
            amount: t.amount,
            date: new Date(t.date),
            merchantName: t.merchant_name,
          },
        });

        // Solo encolar las que aún no tienen categoría:
        // un reenvío no vuelve a gastar llamadas de IA.
        if (saved.categoryId === null) nuevas.push(saved.id);
      }

      added += res.data.added.length;
      modified += res.data.modified.length;

      for (const r of res.data.removed) {
        await db.transaction.deleteMany({
          where: { plaidTransactionId: r.transaction_id },
        });
        removed++;
      }

      cursor = res.data.next_cursor;
      hasMore = res.data.has_more;
    }

    await db.bankConnection.update({
      where: { id: bankConnectionId },
      data: {
        lastSyncCursor: cursor,
        lastSyncedAt: new Date(),
      },
    });

    // Encolar categorización en lotes de 50
    for (let i = 0; i < nuevas.length; i += 50) {
      await categorizeQueue.add("categorize", {
        transactionIds: nuevas.slice(i, i + 50),
      });
    }

    await syncLog.update({
      where: { id: log.id },
      data: {
        status: "success",
        transactionsAdded: added,
        transactionsModified: modified,
        transactionsRemoved: removed,
        finishedAt: new Date(),
      },
    });

    return { added, modified, removed, encoladas: nuevas.length };
  } catch (err: any) {
    await syncLog.update({
      where: { id: log.id },
      data: {
        status: "error",
        errorMessage: err.message,
        finishedAt: new Date(),
      },
    });
    throw err;
  }
}