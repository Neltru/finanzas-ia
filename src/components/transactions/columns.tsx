"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Amount } from "../../components/shared/amount";
import { CategorySelect } from "./category-select";

export type TransactionRow = {
  id: string;
  date: Date;
  rawDescription: string;
  merchantName: string | null;
  amount: unknown; // Decimal de Prisma
  categorizationSource: string;
  category: { id: string; name: string; color: string | null } | null;
  account: { name: string; mask: string | null };
};

export const columns: ColumnDef<TransactionRow>[] = [
  {
    accessorKey: "date",
    header: "Fecha",
    cell: ({ row }) => (
      <span className="text-neutral-500">
        {format(row.original.date, "d MMM yyyy", { locale: es })}
      </span>
    ),
  },
  {
    accessorKey: "rawDescription",
    header: "Descripción",
    cell: ({ row }) => (
      <div>
        <p className="font-medium">
          {row.original.merchantName ?? row.original.rawDescription}
        </p>
        <p className="text-xs text-neutral-400">
          {row.original.account.name} ••{row.original.account.mask}
        </p>
      </div>
    ),
  },
  {
    accessorKey: "category",
    header: "Categoría",
    cell: ({ row }) => (
      <CategorySelect
        transactionId={row.original.id}
        currentCategoryId={row.original.category?.id ?? null}
      />
    ),
  },
  {
    accessorKey: "amount",
    header: () => <div className="text-right">Monto</div>,
    cell: ({ row }) => {
      const monto = Number(row.original.amount);
      return (
        <div className="text-right">
          <Amount
            value={Math.abs(monto)}
            className={monto < 0 ? "font-medium text-emerald-600" : "font-medium"}
          />
        </div>
      );
    },
  },
];