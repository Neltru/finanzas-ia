import { Worker } from "bullmq";
import { createRedisConnection, QUEUE_NAMES, type SyncJobData } from "./queue";
import { syncTransactions } from "@/server/services/plaid.service";

export function createSyncWorker() {
  const worker = new Worker<SyncJobData>(
    QUEUE_NAMES.SYNC,
    async (job) => syncTransactions(job.data.bankConnectionId, job.data.triggeredBy),
    // concurrency 1: Plaid limita peticiones por item, y dos syncs del mismo
    // banco a la vez pelearían por el cursor
    { connection: createRedisConnection(), concurrency: 1 }
  );

  worker.on("completed", (job, result) => {
    console.log(`✅ Sync ${job.id} (${job.data.triggeredBy}):`, result);
  });

  worker.on("failed", (job, err) => {
    console.error(`❌ Sync ${job?.id} falló:`, err.message);
  });

  return worker;
}
