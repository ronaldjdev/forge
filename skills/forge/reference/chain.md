# Chain

Gestiona las cadenas de dependencias entre features.

## Cuándo usarlo

- Antes de migrar un feature (para conocer sus dependencias)
- Cuando se detectan imports directos entre features
- Para determinar el orden topológico de migración
- Para diagnosticar acoplamiento excesivo

## Reglas

- Nunca imports directos entre features
- La comunicación entre features siempre via interfaces inyectadas
- Un feature puede depender de otro, pero nunca al revés (sin ciclos)
- Las interfaces compartidas se declaran en el feature que las define
- Dependencias transitivas se inyectan, no se heredan

## Orden topológico

Migrar features en orden de menor a mayor dependencia:

```
1. Features sin dependencias
2. Features que dependen solo de shared/
3. Features que dependen de features ya migrados
```

## Cómo inyectar dependencias entre features

### Entre features del mismo proyecto

```
Feature A (credit)
├── domain/ICreditRepository.ts  ← define la interfaz
└── adapters/out/CreditRepository.ts  ← implementa

Feature B (payment)  ← necesita CreditRepository
├── application/PaymentUseCase.ts
    └── @inject(ICreditRepository) creditRepo
```

### Registro en bootstrap

```typescript
container.registerSingleton<ICreditRepository>(
  ICreditRepository as symbol,
  CreditRepository
);
```

## Detectar dependencias

```bash
# Grafo de dependencias entre features (API legacy)
node .opencode/skills/forge/scripts/chain.mjs

# Grafo arquitectónico completo (nodos, edges, violaciones)
node .opencode/skills/forge/scripts/graph.mjs

# ARCHITECTURE.md con grafo incluido
node .opencode/skills/forge/scripts/architecture.mjs
```

`chain.mjs` ahora es un wrapper sobre `graph.mjs`. Produce el mismo formato de salida para compatibilidad (nodos, edges, features, orden topológico). El nuevo `graph.mjs` amplía el análisis a todos los tipos de nodo (core, feature, domain, infra, adapter) y detecta violaciones de reglas arquitectónicas (R1-R6).

## Buenas prácticas

- Mantener el grafo acíclico
- Si hay ciclo, extraer la interfaz común a shared/
- Documentar dependencias en ARCHITECTURE.md
- Revisar dependencias después de cada migración

## Ver también

- `scripts/graph.mjs` — el grafo que chain analiza topológicamente
- `reference/evolutionary-architecture.md` — fitness functions de dependencias
- `reference/modular-monolith.md` — ciclo de dependencias como señal de split
