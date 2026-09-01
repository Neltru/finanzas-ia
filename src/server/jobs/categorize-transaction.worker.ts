import { Worker } from "bullmq";
import { connection, QUEUE_NAMES, type CategorizeJobData } from "./queue";
import { db } from "@/server/db";
import { resolveFromCache, categorizeWithAI } from "@/server/services/categorization.service";

const worker = new Worker<CategorizeJobData>(
  QUEUE_NAMES.CATEGORIZE,
  async (job) => {
    const { transactionIds } = job.data;

    const txs = await db.transaction.findMany({
      where: { id: { in: transactionIds } },
      select: { id: true, normalizedDescription: true },
    });
    if (txs.length === 0) return { skipped: true };

    const categories = await db.category.findMany();
    const catByName = new Map(categories.map((c) => [c.name, c]));
    const sinClasificar = catByName.get("Sin clasificar")!;

    const unicas = [...new Set(txs.map((t) => t.normalizedDescription))];

    // 1. Cache primero — cero costo
    const cache = await resolveFromCache(unicas);
    const faltantes = unicas.filter((d) => !cache.has(d));

    // 2. Solo lo que falta va a la IA, en un solo batch
    const aiResults = await categorizeWithAI(
      faltantes,
      categories.map((c) => c.name)
    );

    // 3. Guardar lo nuevo en cache
    for (const [desc, result] of aiResults) {
      const cat = catByName.get(result.category);
      if (!cat) continue;
      await db.categorizationCache.upsert({
        where: { normalizedDescription: desc },
        create: {
          normalizedDescription: desc,
          categoryId: cat.id,
          confidence: result.confidence,
        },
        update: { lastUsedAt: new Date() },
      });
    }

    // 4. Aplicar a cada transacción
    let desdeCache = 0, desdeIA = 0, sinResolver = 0;

    for (const tx of txs) {
      const desc = tx.normalizedDescription;
      let categoryId: string;
      let source: string;

      const hit = cache.get(desc);
      const ai = aiResults.get(desc);

      if (hit) {
        categoryId = hit.categoryId;
        source = "CACHE";
        desdeCache++;
      } else if (ai && catByName.has(ai.category)) {
        categoryId = catByName.get(ai.category)!.id;
        source = "AI";
        desdeIA++;
      } else {
        categoryId = sinClasificar.id;
        source = "UNCLASSIFIED";
        sinResolver++;
      }

      await db.transaction.update({
        where: { id: tx.id },
        data: { categoryId, categorizationSource: source },
      });
    }

    // Contabilizar los hits de cache
    if (cache.size > 0) {
      await db.categorizationCache.updateMany({
        where: { normalizedDescription: { in: [...cache.keys()] } },
        data: { hitCount: { increment: 1 }, lastUsedAt: new Date() },
      });
    }

    return { desdeCache, desdeIA, sinResolver, llamadasIA: faltantes.length > 0 ? 1 : 0 };
  },
  { connection, concurrency: 2 }
);

worker.on("completed", (job, result) => {
  console.log(`✅ Job ${job.id}:`, result);
});

worker.on("failed", (job, err) => {
  console.error(`❌ Job ${job?.id} falló:`, err.message);
});

console.log("👷 Worker de categorización escuchando...");