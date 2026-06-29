```typescript
// src/platform/scheduler/OutboxRelayer.ts
import { injectable, inject } from "tsyringe";
import type { IEventBus } from "@/platform/events/IEventBus.js";
import type { ILogger } from "@/platform/logger/ILogger.js";

type OutboxEntry = {
  id: string;
  eventType: string;
  payload: Record<string, unknown>;
  retryCount: number;
};

@injectable()
export class OutboxRelayer {
  private readonly POLL_INTERVAL_MS = 1000;
  private readonly MAX_RETRIES = 10;
  private readonly BATCH_SIZE = 50;
  private running = false;

  constructor(
    @inject(IEventBus) private readonly eventBus: IEventBus,
    @inject(ILogger) private readonly logger: ILogger,
  ) {}

  async start(): Promise<void> {
    this.running = true;
    this.logger.info("OutboxRelayer started");
    while (this.running) {
      await this.processBatch();
      await this.sleep(this.POLL_INTERVAL_MS);
    }
  }

  stop(): void {
    this.running = false;
    this.logger.info("OutboxRelayer stopped");
  }

  private async processBatch(): Promise<void> {
    const batch = await this.fetchUnprocessed();
    for (const entry of batch) {
      try {
        await this.eventBus.publish(entry.payload);
        await this.markProcessed(entry.id);
      } catch (error) {
        this.logger.error(`Outbox ${entry.id}: publish failed — ${error.message}`);
        await this.incrementRetry(entry.id, error.message);
        if (entry.retryCount >= this.MAX_RETRIES) {
          await this.sendToDLQ(entry);
        }
      }
    }
  }

  private async fetchUnprocessed(): Promise<OutboxEntry[]> {
    // SELECT * FROM outbox WHERE processed_at IS NULL
    //   AND retry_count < $1 ORDER BY occurred_at ASC LIMIT $2
    return [];
  }

  private async markProcessed(id: string): Promise<void> {
    // UPDATE outbox SET processed_at = NOW() WHERE id = $1
  }

  private async incrementRetry(id: string, error: string): Promise<void> {
    // UPDATE outbox SET retry_count = retry_count + 1, last_error = $1 WHERE id = $2
  }

  private async sendToDLQ(entry: OutboxEntry): Promise<void> {
    this.logger.error(`Outbox ${entry.id}: moved to DLQ after ${this.MAX_RETRIES} retries`);
    // INSERT INTO outbox_dlq SELECT * FROM outbox WHERE id = $1
    // DELETE FROM outbox WHERE id = $1
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
```
