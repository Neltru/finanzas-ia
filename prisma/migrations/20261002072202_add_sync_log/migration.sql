-- CreateTable
CREATE TABLE "sync_logs" (
    "id" TEXT NOT NULL,
    "bankConnectionId" TEXT NOT NULL,
    "triggeredBy" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "transactionsAdded" INTEGER NOT NULL DEFAULT 0,
    "transactionsModified" INTEGER NOT NULL DEFAULT 0,
    "transactionsRemoved" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sync_logs_bankConnectionId_startedAt_idx" ON "sync_logs"("bankConnectionId", "startedAt");

-- AddForeignKey
ALTER TABLE "sync_logs" ADD CONSTRAINT "sync_logs_bankConnectionId_fkey" FOREIGN KEY ("bankConnectionId") REFERENCES "bank_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
