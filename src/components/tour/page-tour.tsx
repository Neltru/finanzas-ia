"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { driver, type Driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import { HelpCircle } from "lucide-react";
import { useIsDemo } from "@/lib/use-is-demo";
import { TOURS, type TourStep } from "./tour-steps";

// Bump de versión = todos vuelven a ver el tutorial (útil si cambia mucho)
const STORAGE_PREFIX = "tour:v1:";

// localStorage puede no existir o lanzar (modo privado, cookies bloqueadas):
// en ese caso el tutorial simplemente se muestra otra vez, nada se rompe.
function yaVisto(page: string) {
  try {
    return localStorage.getItem(STORAGE_PREFIX + page) === "1";
  } catch {
    return false;
  }
}
function marcarVisto(page: string) {
  try {
    localStorage.setItem(STORAGE_PREFIX + page, "1");
  } catch {}
}

function visible(el: Element) {
  const r = el.getBoundingClientRect();
  // El menú lateral en móvil existe pero está desplazado fuera de pantalla
  return r.width > 0 && r.height > 0 && r.right > 0 && r.left < window.innerWidth;
}

function buscar(target: string | string[]) {
  const nombres = Array.isArray(target) ? target : [target];
  for (const n of nombres) {
    const el = document.querySelector(`[data-tour="${n}"]`);
    if (el && visible(el)) return el;
  }
  return null;
}

function construirPasos(steps: TourStep[], isDemo: boolean): DriveStep[] {
  return steps.flatMap((s) => {
    const description = typeof s.text === "function" ? s.text({ isDemo }) : s.text;
    if (!s.target) return [{ popover: { title: s.title, description } }];
    const el = buscar(s.target);
    if (!el) return []; // no está en pantalla: se omite el paso
    return [{ element: el, popover: { title: s.title, description, side: s.side ?? "bottom", align: "start" } }];
  });
}

// En una pestaña abierta en segundo plano no hay nada "visible" que medir
// (puede tener ancho 0) y nadie vería el tour: esperar a que la miren.
function esperarPestanaVisible() {
  const lista = () => !document.hidden && window.innerWidth > 0;
  if (lista()) return Promise.resolve();
  return new Promise<void>((resolve) => {
    const revisar = () => {
      if (!lista()) return;
      document.removeEventListener("visibilitychange", revisar);
      window.removeEventListener("resize", revisar);
      resolve();
    };
    document.addEventListener("visibilitychange", revisar);
    window.addEventListener("resize", revisar);
  });
}

// Las secciones aparecen cuando llegan sus datos (Proyecciones mostraba solo
// el primer paso porque el resto seguía cargando), y el layout se sigue
// acomodando unos instantes. Se espera a que no quede ninguna consulta en
// curso y a que el conjunto de elementos visibles no cambie durante 3
// lecturas seguidas (~600 ms). Máximo 8 s: si algo nunca carga, se arranca
// con lo que haya.
async function esperarElementos(steps: TourStep[], consultasEnCurso: () => number) {
  const targets = steps.flatMap((s) => (s.target ? [s.target] : []));
  if (targets.length === 0) return;
  const huella = () => targets.map((t) => (buscar(t) ? "1" : "0")).join("");
  let anterior = "";
  let estables = 0;
  for (let i = 0; i < 40 && estables < 3; i++) {
    await new Promise((r) => setTimeout(r, 200));
    const actual = huella();
    const listo = consultasEnCurso() === 0 && actual.includes("1");
    estables = listo && actual === anterior ? estables + 1 : 0;
    anterior = actual;
  }
}

/**
 * Tutorial guiado por página. Se muestra solo la primera vez que el visitante
 * entra a cada sección; el botón «?» lo repite cuando quiera.
 */
export function PageTour() {
  const pathname = usePathname();
  const isDemo = useIsDemo();
  // Ref: el arranque automático se programa antes de que llegue la sesión;
  // al armar los pasos (tras las esperas) se lee el valor ya actualizado
  const isDemoRef = useRef(isDemo);
  isDemoRef.current = isDemo;
  const activo = useRef<Driver | null>(null);
  const queryClient = useQueryClient();
  const steps = TOURS[pathname];

  const iniciar = useCallback(async () => {
    if (!steps) return;
    activo.current?.destroy();
    await esperarPestanaVisible();
    await esperarElementos(steps, () => queryClient.isFetching());
    // Si mientras esperaba se cambió de página, no mostrar el tour viejo
    if (window.location.pathname !== pathname) return;

    const pasos = construirPasos(steps, isDemoRef.current);
    if (pasos.length === 0) return;

    const tour = driver({
      steps: pasos,
      showProgress: pasos.length > 1,
      progressText: "{{current}} de {{total}}",
      nextBtnText: "Siguiente",
      prevBtnText: "Anterior",
      doneBtnText: "Entendido",
      popoverClass: "finanzas-tour",
      stagePadding: 6,
      stageRadius: 8,
    });
    activo.current = tour;
    tour.drive();
    // Se marca como visto al mostrarlo, no al cerrarlo: así cuenta igual si
    // lo termina, lo cierra con Esc, cambia de página o cierra la pestaña.
    // El objetivo es no insistir; para repetirlo está el botón «?».
    marcarVisto(pathname);
  }, [steps, pathname, queryClient]);

  // Primera visita a la página: arrancar solo
  useEffect(() => {
    if (!steps || yaVisto(pathname)) return;
    let cancelado = false;
    // Pequeña pausa antes de empezar a medir: recién navegado, la página
    // todavía está montando
    const t = setTimeout(() => !cancelado && iniciar(), 300);
    return () => {
      cancelado = true;
      clearTimeout(t);
    };
  }, [pathname, steps, iniciar]);

  // Al salir de la página, cerrar el tour que hubiera abierto
  useEffect(() => () => activo.current?.destroy(), [pathname]);

  if (!steps) return null;

  return (
    <button
      onClick={iniciar}
      data-tour="help"
      aria-label="Ver la guía de esta página"
      title="Ver la guía de esta página"
      className="shrink-0 rounded-full p-1.5 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-emerald-600"
    >
      <HelpCircle className="h-5 w-5" />
    </button>
  );
}
