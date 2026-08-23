import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DateRangePreset = "7d" | "30d" | "90d" | "12m" | "ytd";

interface DateRange {
  from: Date;
  to: Date;
  preset: DateRangePreset;
}

interface FiltersState {
  selectedAccountId: string | null; // null = todas las cuentas
  setSelectedAccountId: (id: string | null) => void;

  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;

  privacyMode: boolean;
  togglePrivacyMode: () => void;
}

function defaultRange(): DateRange {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return { from, to, preset: "30d" };
}

export const useFiltersStore = create<FiltersState>()(
  persist(
    (set) => ({
      selectedAccountId: null,
      setSelectedAccountId: (id) => set({ selectedAccountId: id }),

      dateRange: defaultRange(),
      setDateRange: (range) => set({ dateRange: range }),

      privacyMode: false,
      togglePrivacyMode: () => set((s) => ({ privacyMode: !s.privacyMode })),
    }),
    {
      name: "finance-dashboard-filters",
      partialize: (state) => ({ privacyMode: state.privacyMode }),
    }
  )
);