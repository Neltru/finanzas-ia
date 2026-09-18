import { NextResponse } from "next/server";
import { createLinkToken } from "@/server/services/plaid.service";
import { db } from "@/server/db";

export async function POST() {
  try {
    // TODO: reemplazar por el usuario de la sesión cuando exista auth
    const user = await db.user.findFirstOrThrow();

    const linkToken = await createLinkToken(user.id);
    return NextResponse.json({ linkToken });
  } catch (err: any) {
    console.error("[plaid/link-token]", err?.response?.data ?? err);
    return NextResponse.json(
      { error: "No se pudo crear el link token" },
      { status: 500 }
    );
  }
}