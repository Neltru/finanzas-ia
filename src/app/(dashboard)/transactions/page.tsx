"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "../../../lib/trpc";
import { DataTable } from "../../../components/transactions/data-table";

export default function TransactionsPage() {
  const trpc = useTRPC();
  const { data, isLoading } = useQuery(
    trpc.transaction.list.queryOptions({ limit: 50 })
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Transacciones</h1>
      {isLoading ? (
        <TableSkeleton />
      ) : (
        <DataTable data={(data?.items ?? []) as any} />
      )}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
      <div className="h-10 border-b border-neutral-200 bg-neutral-50" />
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-neutral-100 px-4 py-3 last:border-0">
          <div className="h-4 w-24 animate-pulse rounded bg-neutral-200" />
          <div className="h-4 flex-1 animate-pulse rounded bg-neutral-200" />
          <div className="h-5 w-28 animate-pulse rounded-full bg-neutral-200" />
          <div className="h-4 w-20 animate-pulse rounded bg-neutral-200" />
        </div>
      ))}
    </div>
  );
}