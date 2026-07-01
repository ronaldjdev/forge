```typescript
// src/features/<domain>/adapters/out/saga/SagaOrchestrator.ts
import { injectable, inject } from "tsyringe";
import type { SagaInstance, SagaStatus } from "../../domain/entities/SagaInstance.entity.js";
import type { ISagaRepository } from "../../domain/repositories/ISagaRepository.repository.js";
import type { IEventBus } from "@/platform/events/IEventBus.js";
import type { ILogger } from "@/platform/logger/ILogger.js";

export interface SagaStep {
  name: string;
  execute(ctx: Record<string, unknown>): Promise<void>;
  compensate(ctx: Record<string, unknown>): Promise<void>;
}

@injectable()
export class SagaOrchestrator {
  constructor(
    @inject(ISagaRepository) private readonly sagaRepo: ISagaRepository,
    @inject(IEventBus) private readonly eventBus: IEventBus,
    @inject(ILogger) private readonly logger: ILogger,
  ) {}

  async execute(
    sagaType: string,
    steps: SagaStep[],
    initialContext: Record<string, unknown>,
  ): Promise<string> {
    const saga = SagaInstance.start(sagaType, initialContext);
    await this.sagaRepo.save(saga);

    for (const step of steps) {
      try {
        this.logger.info(`Saga ${saga.id}: executing step ${step.name}`);
        await step.execute(saga.context);
        saga.advance(step.name);
        await this.sagaRepo.save(saga);
      } catch (error) {
        this.logger.error(
          `Saga ${saga.id}: step ${step.name} failed — ${error.message}`,
        );
        await this.compensate(saga, steps);
        return saga.id;
      }
    }

    saga.complete();
    await this.sagaRepo.save(saga);
    this.eventBus.publish({ type: "saga.completed", sagaId: saga.id });
    return saga.id;
  }

  private async compensate(
    saga: SagaInstance,
    steps: SagaStep[],
  ): Promise<void> {
    const executed = steps.slice(0, saga.currentStepIndex);
    for (const step of executed.reverse()) {
      try {
        this.logger.info(`Saga ${saga.id}: compensating step ${step.name}`);
        await step.compensate(saga.context);
      } catch (err) {
        this.logger.error(
          `Saga ${saga.id}: compensation failed for ${step.name} — requiere intervención manual`,
        );
        saga.requireManualIntervention(step.name, err.message);
      }
    }
    saga.fail();
    await this.sagaRepo.save(saga);
  }
}
```
