"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Landmark, CreditCard } from "lucide-react";
import { useTRPC } from "@/lib/trpc";
import { Amount } from "@/components/shared/amount";

export default function AccountsPage() {
  const trpc = useTRPC();
  const { data, isLoading } = useQuery(trpc.account.list.queryOptions());

  const patrimonio = data?.reduce((s, a) => s + a.balance, 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">Cuentas</h1>
        {data && (
          <div className="text-right">
            <p className="text-xs text-neutral-500">Patrimonio neto</p>
            <Amount value={patrimonio} className="text-xl font-semibold" />
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-neutral-200" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {data?.map((a) => {
            const esCredito = a.type === "credit_card";
            const Icon = esCredito ? CreditCard : Landmark;

            return (
              <div key={a.id} className="rounded-lg border border-neutral-200 bg-white p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="rounded-md bg-neutral-100 p-2">
                      <Icon className="h-4 w-4 text-neutral-600" />
                    </div>
                    <div>
                      <p className="font-medium">{a.name}</p>
                      <p className="text-xs text-neutral-500">
                        {a.institution} ••{a.mask}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                    {a.status === "ACTIVE" ? "Conectada" : a.status}
                  </span>
                </div>

                <div className="mt-4">
                  <p className="text-xs text-neutral-500">
                    {esCredito ? "Saldo utilizado" : "Balance disponible"}
                  </p>
                  <Amount
                    value={a.balance}
                    className={`text-2xl font-semibold ${
                      a.balance < 0 ? "text-red-600" : ""
                    }`}
                  />
                </div>

                <div className="mt-3 flex justify-between border-t border-neutral-100 pt-3 text-xs text-neutral-500">
                  <span>{a.transactionCount} transacciones</span>
                  {a.lastSyncedAt && (
                    <span>
                      Sincronizado {format(a.lastSyncedAt, "d MMM, HH:mm", { locale: es })}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}