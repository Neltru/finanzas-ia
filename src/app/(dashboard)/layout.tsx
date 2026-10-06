import { Suspense } from "react";
import { Sidebar } from "../../components/layout/sidebar";
import { FilterBar } from "../../components/layout/filter-bar";
import { DemoBanner } from "../../components/layout/demo-banner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col overflow-hidden md:flex-row">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <DemoBanner />
        <header className="flex min-h-16 shrink-0 items-center border-b border-neutral-200 px-4 py-2 md:px-6">
          {/* FilterBar y las páginas leen los filtros de la URL con
              useSearchParams: Next 16 exige Suspense alrededor */}
          <Suspense>
            <FilterBar />
          </Suspense>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Suspense>{children}</Suspense>
        </main>
      </div>
    </div>
  );
}
