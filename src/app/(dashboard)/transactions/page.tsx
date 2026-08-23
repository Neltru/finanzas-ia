"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "../../../lib/trpc";
import { useFiltersStore } from "../../../stores/filters.store";
import { DataTable, TableSkeleton } from "../../../components/transactions/data-table";

export default function TransactionsPage() {
  const trpc = useTRPC();
  const dateRange = useFiltersStore((s) => s.dateRange);
  const selectedAccountId = useFiltersStore((s) => s.selectedAccountId);

  const { data, isLoading } = useQuery(
    trpc.transaction.list.queryOptions({
      from: dateRange.from,
      to: dateRange.to,
      accountId: selectedAccountId ?? undefined,
      limit: 50,
    })
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Transacciones</h1>
      {isLoading ? <TableSkeleton /> : <DataTable data={(data?.items ?? []) as any} />}
    </div>
  );
}