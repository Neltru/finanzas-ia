"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc";
import { useIsDemo } from "@/lib/use-is-demo";
import { DEMO_READONLY_MESSAGE } from "@/lib/demo";

type Tx = { id: string; categoryId: string | null };
type Page = { items: Tx[] };

// La lista puede estar en caché como query normal ({ items }) o paginada
// ({ pages: [{ items }] }): el update optimista cubre ambas formas.
function mapItems(old: any, fn: (t: Tx) => Tx) {
  if (old?.pages) return { ...old, pages: old.pages.map((p: Page) => ({ ...p, items: p.items.map(fn) })) };
  if (old?.items) return { ...old, items: old.items.map(fn) };
  return old;
}

export function CategorySelect({
  transactionId,
  currentCategoryId,
}: {
  transactionId: string;
  currentCategoryId: string | null;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const isDemo = useIsDemo();

  const { data: categories } = useQuery(trpc.category.list.queryOptions());

  // pathKey abarca todas las variantes de transaction.list (normal e infinita)
  const listKey = trpc.transaction.list.pathKey();

  const mutation = useMutation(
    trpc.transaction.updateCategory.mutationOptions({
      // 1. Antes de que salga la petición: actualizar la UI ya
      onMutate: async ({ id, categoryId }) => {
        await queryClient.cancelQueries({ queryKey: listKey });

        const previous = queryClient.getQueriesData({ queryKey: listKey });
        const nueva = categories?.find((c) => c.id === categoryId) ?? null;

        queryClient.setQueriesData({ queryKey: listKey }, (old: any) =>
          mapItems(old, (t) =>
            t.id === id ? { ...t, categoryId, category: nueva, categorizationSource: "MANUAL" } : t
          )
        );

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
    <div>
      <select
        data-tour="category-select"
        value={currentCategoryId ?? ""}
        onChange={(e) => mutation.mutate({ id: transactionId, categoryId: e.target.value })}
        // El servidor ya rechaza la escritura del demo (403); deshabilitarlo
        // evita el cambio optimista que luego se revertía sin explicación
        disabled={mutation.isPending || isDemo}
        title={isDemo ? DEMO_READONLY_MESSAGE : undefined}
        className="max-w-full rounded-full border-0 bg-neutral-100 px-2.5 py-1 text-xs focus:ring-1 focus:ring-emerald-500 disabled:cursor-not-allowed"
      >
        <option value="" disabled>Sin clasificar</option>
        {categories?.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      {mutation.isError && (
        <p className="mt-1 text-xs text-red-600">No se pudo guardar el cambio</p>
      )}
    </div>
  );
}
