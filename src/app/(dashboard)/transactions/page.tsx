"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useTRPC } from "@/lib/trpc";
import { useDashboardFilters } from "@/lib/use-dashboard-filters";
import { DataTable, TableSkeleton } from "@/components/transactions/data-table";

export default function TransactionsPage() {
  const trpc = useTRPC();
  const { from, to, accountId } = useDashboardFilters();

  // Paginación por cursor: el router devuelve nextCursor cuando hay más
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useInfiniteQuery(
    trpc.transaction.list.infiniteQueryOptions(
      { from, to, accountId: accountId ?? undefined, limit: 50 },
      { getNextPageParam: (last) => last.nextCursor }
    )
  );

  const items = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">Transacciones</h1>
        {!isLoading && (
          <span className="text-sm text-neutral-500">
            {items.length}
            {hasNextPage ? "+" : ""} transacciones
          </span>
        )}
      </div>

      {isLoading ? <TableSkeleton /> : <DataTable data={items as any} />}

      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="mx-auto flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
        >
          {isFetchingNextPage && <Loader2 className="h-4 w-4 animate-spin" />}
          {isFetchingNextPage ? "Cargando..." : "Cargar más"}
        </button>
      )}
    </div>
  );
}
