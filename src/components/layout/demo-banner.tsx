"use client";

import { Info } from "lucide-react";
import { useIsDemo } from "@/lib/use-is-demo";
import { DEMO_READONLY_MESSAGE } from "@/lib/demo";

export function DemoBanner() {
  if (!useIsDemo()) return null;
  return (
    <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800 md:px-6">
      <Info className="h-3.5 w-3.5 shrink-0" />
      <span>Estás viendo datos de ejemplo. {DEMO_READONLY_MESSAGE}</span>
    </div>
  );
}
