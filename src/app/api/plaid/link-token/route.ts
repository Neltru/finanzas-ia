import { NextResponse } from "next/server";
import { createLinkToken } from "@/server/services/plaid.service";
import { getServerSession } from "next-auth";
import { authOptions, isDemoSession } from "@/server/auth";

export async function POST() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (isDemoSession(session)) {
    return NextResponse.json({ error: "La cuenta demo es de solo lectura" }, { status: 403 });
  }

  try {
    const linkToken = await createLinkToken(userId);
    return NextResponse.json({ linkToken });
  } catch (err: any) {
    console.error("[plaid/link-token]", err?.response?.data ?? err);
    return NextResponse.json(
      { error: "No se pudo crear el link token" },
      { status: 500 }
    );
  }
}