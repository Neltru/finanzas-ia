"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Landmark,
  Sparkles,
  TrendingUp,
  Plug,
  Eye,
  EyeOff,
} from "lucide-react";
import { useFiltersStore } from "../../stores/filters.store";
import { cn } from "../../lib/utils";

const NAV_ITEMS = [
  { href: "/overview", label: "Resumen", icon: LayoutDashboard },
  { href: "/transactions", label: "Transacciones", icon: ArrowLeftRight },
  { href: "/accounts", label: "Cuentas", icon: Landmark },
  { href: "/insights", label: "Insights IA", icon: Sparkles },
  { href: "/projections", label: "Proyecciones", icon: TrendingUp },
  { href: "/connect", label: "Conectar banco", icon: Plug },
];

export function Sidebar() {
  const pathname = usePathname();
  const privacyMode = useFiltersStore((s) => s.privacyMode);
  const togglePrivacyMode = useFiltersStore((s) => s.togglePrivacyMode);

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-neutral-200 bg-white">
      <div className="flex h-16 items-center gap-2 border-b border-neutral-200 px-6">
        <div className="h-7 w-7 rounded-md bg-emerald-500" />
        <span className="font-semibold tracking-tight">Finanzas</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-neutral-600 hover:bg-neutral-100"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={togglePrivacyMode}
        className="mx-3 mb-4 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
      >
        {privacyMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        {privacyMode ? "Modo privacidad activo" : "Ocultar montos"}
      </button>
    </aside>
  );
}