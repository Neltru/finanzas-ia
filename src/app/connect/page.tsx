"use client";

import { useState, useCallback } from "react";
import { usePlaidLink } from "react-plaid-link";
import { useRouter } from "next/navigation";
import { Landmark, Loader2 } from "lucide-react";

export default function ConnectPage() {
  const router = useRouter();
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [estado, setEstado] = useState<"idle" | "cargando" | "conectando" | "error">("idle");
  const [mensaje, setMensaje] = useState("");

  const iniciar = useCallback(async () => {
    setEstado("cargando");
    try {
      const res = await fetch("/api/plaid/link-token", { method: "POST" });
      if (!res.ok) throw new Error("No se pudo iniciar la conexión");
      const { linkToken } = await res.json();
      setLinkToken(linkToken);
      setEstado("idle");
    } catch (e: any) {
      setEstado("error");
      setMensaje(e.message);
    }
  }, []);

  const onSuccess = useCallback(
    async (publicToken: string, metadata: any) => {
      setEstado("conectando");
      try {
        const res = await fetch("/api/plaid/exchange-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            publicToken,
            institutionName: metadata.institution?.name,
          }),
        });
        if (!res.ok) throw new Error("Falló el intercambio de tokens");
        router.push("/accounts");
      } catch (e: any) {
        setEstado("error");
        setMensaje(e.message);
      }
    },
    [router]
  );

  const { open, ready } = usePlaidLink({ token: linkToken, onSuccess });

  return (
    <div className="mx-auto max-w-lg space-y-6 py-12">
      <div className="text-center">
        <div className="mx-auto mb-4 w-fit rounded-full bg-emerald-50 p-4">
          <Landmark className="h-7 w-7 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-semibold">Conecta tu banco</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Tus transacciones se sincronizan y categorizan automáticamente.
          Las credenciales nunca pasan por nuestros servidores.
        </p>
      </div>

      {estado === "error" && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {mensaje}
        </div>
      )}

      <button
        onClick={() => (linkToken ? open() : iniciar())}
        disabled={estado === "cargando" || estado === "conectando" || (!!linkToken && !ready)}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 font-medium text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
      >
        {(estado === "cargando" || estado === "conectando") && (
          <Loader2 className="h-4 w-4 animate-spin" />
        )}
        {estado === "cargando"
          ? "Preparando..."
          : estado === "conectando"
          ? "Sincronizando transacciones..."
          : linkToken
          ? "Abrir Plaid Link"
          : "Conectar cuenta bancaria"}
      </button>

      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-500">
        <p className="font-medium text-neutral-700">Modo sandbox</p>
        <p className="mt-1">
          Usa cualquier banco de la lista con usuario <code className="rounded bg-white px-1">user_good</code> y
          contraseña <code className="rounded bg-white px-1">pass_good</code>.
        </p>
      </div>
    </div>
  );
}