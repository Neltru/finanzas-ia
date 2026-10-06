import { create } from "zustand";
import { persist } from "zustand/middleware";

// Rango de fechas y cuenta viven en la URL (lib/use-dashboard-filters.ts).
// Aquí solo queda la preferencia local del visitante.
interface FiltersState {
  privacyMode: boolean;
  togglePrivacyMode: () => void;
}

export const useFiltersStore = create<FiltersState>()(
  persist(
    (set) => ({
      privacyMode: false,
      togglePrivacyMode: () => set((s) => ({ privacyMode: !s.privacyMode })),
    }),
    { name: "finance-dashboard-filters" }
  )
);
