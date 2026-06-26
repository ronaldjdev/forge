# Observability — Logging, tracing, métricas, health checks

## Principios

- Observabilidad es infraestructura, no dominio. Toda instrumentación está en `platform/` o `adapters/`.
- El dominio nunca escribe logs ni emite métricas directamente.
- Usar OpenTelemetry como estándar unificado.

## Estructura recomendada

```
src/platform/observability/
  ├── Metrics.ts         → Contadores, histogramas (Prometheus / OTel)
  ├── Tracing.ts         → Trazas distribuidas (OpenTelemetry)
  ├── Health.ts          → Health checks agregados
  ├── Logger.service.ts  → Logger estructurado (pino, winston)
  └── Logger.config.ts   → Niveles, formatos, transports
```

## Logging estructurado

```ts
// platform/observability/Logger.service.ts
export class LoggerService {
  info(msg: string, ctx?: Record<string, unknown>): void {
    pino.info({ msg, ...ctx });
  }
  error(msg: string, err?: Error, ctx?: Record<string, unknown>): void {
    pino.error({ msg, err: { message: err?.message, stack: err?.stack }, ...ctx });
  }
}
```

Inyectar en use cases solo si es estrictamente necesario (auditoría). Preferir middlewares de logging.

## Health checks

```ts
// platform/observability/Health.ts
export interface IHealthCheck {
  name: string;
  check(): Promise<{ status: "ok" | "degraded" | "down"; detail?: string }>;
}

// GET /health → { status: "ok", checks: [{ name: "db", status: "ok" }, ...] }
// GET /health/ready → readiness (dependencias listas)
// GET /health/live → liveness (proceso vivo)
```

## Métricas clave

| Métrica | Tipo | Descripción |
|---------|------|-------------|
| `http_requests_total` | Counter | Total requests por método, ruta, status |
| `http_request_duration_seconds` | Histogram | Latencia por ruta |
| `db_query_duration_seconds` | Histogram | Latencia de queries por repositorio |
| `feature_uc_execution_seconds` | Histogram | Duración de use cases por feature |

## Buenas prácticas

- Correlation ID en cada request (inyectado en platform/http/)
- Logs en JSON siempre. Nivel info para flujo normal, debug para detalle, warn/error para anomalías.
- No loggear datos sensibles (PII, passwords, tokens)
- Tracing distribuido con baggage contextual
- Health checks sin autenticación (solo para orquestadores)
- Alertas basadas en métricas, no en logs
