import { Queue } from "bullmq";
import IORedis from "ioredis";

export const connection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null, // requerido por BullMQ
});

export const QUEUE_NAMES = {
  CATEGORIZE: "categorize-transactions",
} as const;

export interface CategorizeJobData {
  transactionIds: string[];
}

export const categorizeQueue = new Queue<CategorizeJobData>(
  QUEUE_NAMES.CATEGORIZE,
  {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 500 },
    },
  }
);