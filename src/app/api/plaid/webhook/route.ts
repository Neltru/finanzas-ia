import { NextResponse } from "next/server";
import { enqueueSync } from "@/server/jobs/queue";
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

    // Solo encolar y responder: Plaid espera respuesta rápida, y el sync
    // completo lo hace el worker
    if (["SYNC_UPDATES_AVAILABLE", "DEFAULT_UPDATE", "INITIAL_UPDATE"].includes(webhook_code)) {
      await enqueueSync(conn.id, "webhook");
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[plaid/webhook]", err);
    // 500 a propósito: si no se pudo encolar (p. ej. Redis caído), que Plaid
    // reintente. Los errores del sync en sí quedan en SyncLog, no llegan aquí.
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}