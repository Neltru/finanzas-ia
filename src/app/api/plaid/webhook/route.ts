import { NextResponse } from "next/server";
import { syncTransactions } from "@/server/services/plaid.service";
import { db } from "@/server/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { webhook_type, webhook_code, item_id } = body;

    console.log(`[plaid/webhook] ${webhook_type}/${webhook_code} item=${item_id}`);

    if (webhook_type !== "TRANSACTIONS") {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const conn = await db.bankConnection.findUnique({
      where: { plaidItemId: item_id },
    });

    if (!conn) {
      // Responder 200 igual: un 500 haría que Plaid reintente indefinidamente
      console.warn(`[plaid/webhook] item desconocido: ${item_id}`);
      return NextResponse.json({ ok: true, unknown: true });
    }

    if (["SYNC_UPDATES_AVAILABLE", "DEFAULT_UPDATE", "INITIAL_UPDATE"].includes(webhook_code)) {
      await syncTransactions(conn.id);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[plaid/webhook]", err);
    // 200 deliberado: el error ya quedó en SyncLog; reintentar no ayudaría
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}