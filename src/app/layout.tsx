import type { Metadata } from "next";
import "./globals.css";
import { TRPCReactProvider } from "../lib/trpc";

export const metadata: Metadata = {
  title: "Finanzas — Dashboard personal",
  description: "Dashboard de finanzas personales con categorización por IA",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-neutral-50 text-neutral-900">
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}