import { Queue, type DefaultJobOptions } from "bullmq";
import IORedis from "ioredis";

// Productor (Vercel) y consumidor (worker en Railway) comparten este archivo.
// Las conexiones se abren al primer uso: importar el módulo durante la build
// de Next no debe intentar conectarse a Redis.

export function createRedisConnection() {
  const url = process.env.REDIS_URL;
  if (!url) throw new Error("Falta REDIS_URL");
  return new IORedis(url, {
    maxRetriesPerRequest: null, // requerido por BullMQ
    // Railway/Upstash: si el host es IPv6-only, ioredis necesita family 0
    family: 0,
  });
}

export const QUEUE_NAMES = {
  SYNC: "sync-transactions",
  CATEGORIZE: "categorize-transactions",
} as const;

export interface SyncJobData {
  bankConnectionId: string;
  triggeredBy: "webhook" | "initial" | "manual";
}

export interface CategorizeJobData {
  transactionIds: string[];
}

const defaultJobOptions: DefaultJobOptions = {
  attempts: 3,
  backoff: { type: "exponential", delay: 2000 },
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 500 },
};

let producerConnection: IORedis | undefined;
const queues = new Map<string, Queue>();

function getQueue<T>(name: string): Queue<T> {
  if (!queues.has(name)) {
    producerConnection ??= createRedisConnection();
    queues.set(name, new Queue(name, { connection: producerConnection, defaultJobOptions }));
  }
  return queues.get(name) as Queue<T>;
}

export const getSyncQueue = () => getQueue<SyncJobData>(QUEUE_NAMES.SYNC);
export const getCategorizeQueue = () => getQueue<CategorizeJobData>(QUEUE_NAMES.CATEGORIZE);

/**
 * Encola una sincronización. Deduplica por conexión: si Plaid manda varios
 * webhooks seguidos, mientras haya un sync pendiente o corriendo no se crea
 * otro. (No uso jobId fijo: BullMQ ignoraría también los adds posteriores
 * mientras el job completado siga guardado.)
 */
export function enqueueSync(bankConnectionId: string, triggeredBy: SyncJobData["triggeredBy"]) {
  return getSyncQueue().add(
    "sync",
    { bankConnectionId, triggeredBy },
    { deduplication: { id: `sync-${bankConnectionId}` } }
  );
}
