"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "../../lib/trpc";

export function CategorySelect({
  transactionId,
  currentCategoryId,
}: {
  transactionId: string;
  currentCategoryId: string | null;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: categories } = useQuery(trpc.category.list.queryOptions());

  const listKey = trpc.transaction.list.queryKey();

  const mutation = useMutation(
    trpc.transaction.updateCategory.mutationOptions({
      // 1. Antes de que salga la petición: actualizar la UI ya
      onMutate: async ({ id, categoryId }) => {
        await queryClient.cancelQueries({ queryKey: listKey });

        const previous = queryClient.getQueriesData({ queryKey: listKey });
        const nueva = categories?.find((c) => c.id === categoryId) ?? null;

        queryClient.setQueriesData({ queryKey: listKey }, (old: any) => {
          if (!old?.items) return old;
          return {
            ...old,
            items: old.items.map((t: any) =>
              t.id === id
                ? { ...t, categoryId, category: nueva, categorizationSource: "MANUAL" }
                : t
            ),
          };
        });

        return { previous }; // se pasa a onError como contexto
      },

      // 2. Si falla: revertir al estado anterior
      onError: (_err, _vars, context) => {
        context?.previous?.forEach(([key, data]: any) => {
          queryClient.setQueryData(key, data);
        });
      },

      // 3. Pase lo que pase: resincronizar con el servidor
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: listKey });
      },
    })
  );

  return (
    <select
      value={currentCategoryId ?? ""}
      onChange={(e) =>
        mutation.mutate({ id: transactionId, categoryId: e.target.value })
      }
      disabled={mutation.isPending}
      className="rounded-full border-0 bg-neutral-100 px-2.5 py-1 text-xs focus:ring-1 focus:ring-emerald-500"
    >
      <option value="" disabled>Sin clasificar</option>
      {categories?.map((c) => (
        <option key={c.id} value={c.id}>{c.name}</option>
      ))}
    </select>
  );
}