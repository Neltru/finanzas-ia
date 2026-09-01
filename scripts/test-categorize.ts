import { db } from "../src/server/db";
import { categorizeQueue } from "../src/server/jobs/queue";

async function main() {
  const sinClasificar = await db.category.findFirst({
    where: { name: "Sin clasificar" },
  });

  const txs = await db.transaction.findMany({
    where: { categoryId: sinClasificar?.id },
    select: { id: true, rawDescription: true },
    take: 20,
  });

  if (txs.length === 0) {
    console.log("No hay transacciones sin clasificar. Nada que hacer.");
    return;
  }

  console.log(`Encolando ${txs.length} transacciones:`);
  txs.slice(0, 5).forEach((t) => console.log(`  - ${t.rawDescription}`));

  const job = await categorizeQueue.add("categorize", {
    transactionIds: txs.map((t) => t.id),
  });

  console.log(`✅ Job ${job.id} encolado. Mira la terminal del worker.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
