"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Landmark,
  Sparkles,
  TrendingUp,
  Plug,
  Eye,
  EyeOff,
  LogOut,
  LineChart,
  Menu,
  X,
} from "lucide-react";
import { useFiltersStore } from "../../stores/filters.store";
import { cn } from "../../lib/utils";
import { useSession, signOut } from "next-auth/react";

const NAV_ITEMS = [
  { href: "/overview", label: "Resumen", icon: LayoutDashboard },
  { href: "/transactions", label: "Transacciones", icon: ArrowLeftRight },
  { href: "/accounts", label: "Cuentas", icon: Landmark },
  { href: "/insights", label: "Insights IA", icon: Sparkles },
  { href: "/projections", label: "Proyecciones", icon: TrendingUp },
  { href: "/connect", label: "Conectar banco", icon: Plug },
];

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="rounded-md bg-emerald-500 p-1.5">
        <LineChart className="h-4 w-4 text-white" />
      </div>
      <span className="font-semibold tracking-tight">Finanzas</span>
    </div>
  );
}

function NavLinks({ qs, onNavigate }: { qs: string; onNavigate: () => void }) {
  const pathname = usePathname();
  return (
    <>
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname?.startsWith(href);
        return (
          <Link
            key={href}
            href={`${href}${qs}`}
            onClick={onNavigate}
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
    </>
  );
}

// Los filtros viven en la URL: los enlaces los conservan al cambiar de página.
// Va aparte porque useSearchParams necesita Suspense, y así el resto de la
// barra se pinta en el HTML inicial.
function NavLinksConFiltros({ onNavigate }: { onNavigate: () => void }) {
  const searchParams = useSearchParams();
  const filtros = new URLSearchParams();
  for (const k of ["range", "account"]) {
    const v = searchParams.get(k);
    if (v) filtros.set(k, v);
  }
  const qs = filtros.toString() ? `?${filtros}` : "";
  return <NavLinks qs={qs} onNavigate={onNavigate} />;
}

export function Sidebar() {
  const privacyMode = useFiltersStore((s) => s.privacyMode);
  const togglePrivacyMode = useFiltersStore((s) => s.togglePrivacyMode);
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Barra superior en móvil */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-4 md:hidden">
        <Logo />
        <button
          data-tour="menu"
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          className="rounded-md p-2 text-neutral-600 hover:bg-neutral-100"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Fondo oscuro detrás del menú en móvil */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/30 md:hidden" onClick={() => setOpen(false)} />
      )}

      {/* En escritorio: columna fija. En móvil: panel deslizable */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-neutral-200 bg-white transition-transform md:static md:h-screen md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-neutral-200 px-6">
          <Logo />
          <button
            onClick={() => setOpen(false)}
            aria-label="Cerrar menú"
            className="rounded-md p-1 text-neutral-500 hover:bg-neutral-100 md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav data-tour="nav" className="flex-1 space-y-1 px-3 py-4">
          <Suspense fallback={<NavLinks qs="" onNavigate={() => setOpen(false)} />}>
            <NavLinksConFiltros onNavigate={() => setOpen(false)} />
          </Suspense>
        </nav>

        {session?.user && (
          <div className="mx-3 mb-2 flex items-center gap-2.5 rounded-lg px-3 py-2">
            {session.user.image && (
              <img src={session.user.image} alt="" className="h-7 w-7 rounded-full" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{session.user.name}</p>
              <p className="truncate text-xs text-neutral-500">{session.user.email}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
              title="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
        <button
          data-tour="privacy"
          onClick={togglePrivacyMode}
          className="mx-3 mb-4 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
        >
          {privacyMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {privacyMode ? "Modo privacidad activo" : "Ocultar montos"}
        </button>
      </aside>
    </>
  );
}
