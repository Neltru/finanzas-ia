// Punto de entrada del proceso worker (Railway/Render). Un solo proceso con
// los dos consumidores: en el free tier solo hay un servicio.
import { createSyncWorker } from "./sync-transactions.worker";
import { createCategorizeWorker } from "./categorize-transaction.worker";
import { db } from "@/server/db";

const REQUIRED = ["DATABASE_URL", "REDIS_URL", "PLAID_CLIENT_ID", "PLAID_SECRET", "GEMINI_API_KEY"];
const faltan = REQUIRED.filter((k) => !process.env[k]);
if (faltan.length > 0) {
  console.error(`Faltan variables de entorno: ${faltan.join(", ")}`);
  process.exit(1);
}

const workers = [createSyncWorker(), createCategorizeWorker()];
console.log("👷 Worker escuchando: sync-transactions, categorize-transactions");

// Railway/Render mandan SIGTERM al redesplegar. close() espera a que terminen
// los jobs en curso en vez de cortarlos a la mitad.
let cerrando = false;
async function shutdown(signal: string) {
  if (cerrando) return;
  cerrando = true;
  console.log(`${signal} recibido, cerrando workers...`);
  await Promise.all(workers.map((w) => w.close()));
  await db.$disconnect();
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
