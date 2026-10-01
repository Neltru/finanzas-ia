import { NextResponse } from "next/server";
import { z } from "zod";
import { exchangePublicToken, syncTransactions } from "@/server/services/plaid.service";
import { db } from "@/server/db";
import { getServerSession } from "next-auth";
import { authOptions, isDemoSession } from "@/server/auth";

const BodySchema = z.object({
  publicToken: z.string(),
  institutionName: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (isDemoSession(session)) {
    return NextResponse.json({ error: "La cuenta demo es de solo lectura" }, { status: 403 });
  }

  try {
    const { publicToken, institutionName } = BodySchema.parse(await req.json());

    const { accessToken, itemId } = await exchangePublicToken(publicToken);

    // Idempotente: si el usuario reconecta el mismo banco, no duplica la conexión
    const conn = await db.bankConnection.upsert({
      where: { plaidItemId: itemId },
      create: {
        userId,
        plaidItemId: itemId,
        plaidAccessToken: accessToken,
        institutionName: institutionName ?? "Banco",
        status: "ACTIVE",
      },
      update: {
        plaidAccessToken: accessToken,
        status: "ACTIVE",
      },
    });

    // Primera sincronización, sin bloquear la respuesta
    syncTransactions(conn.id).catch((e) =>
      console.error("[plaid] sync inicial falló:", e)
    );

    return NextResponse.json({ ok: true, connectionId: conn.id });
  } catch (err: any) {
    console.error("[plaid/exchange-token]", err?.response?.data ?? err);
    return NextResponse.json({ error: "Fallo el intercambio" }, { status: 500 });
  }
}