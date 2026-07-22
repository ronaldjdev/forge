# Testing Patterns — Tests en arquitectura hexagonal

## Pirámide de tests

```
     ╱╲
    ╱ E2E ╲          (2-5%) — happy paths críticos
   ╱────────╲
  ╱ Integration ╲    (15-25%) — adapters, rutas, repositorios
 ╱────────────────╲
╱   Unit Tests     ╲  (70-80%) — use cases, entidades, mappers
```

## Qué testear en cada capa

| Capa | Tipo | Qué testear |
|------|------|-------------|
| `domain/entity` | Unit | Reglas de negocio, invariantes, validaciones |
| `application/use-cases` | Unit | Flujo completo con mocks de repositorios |
| `application/mappers` | Unit | Mapeo dominio ↔ DTO |
| `adapters/in/http/controllers` | Integration | HTTP requests, status codes, payloads |
| `adapters/out/persistence/repositories` | Integration | Queries reales (test DB) |
| `shared/errors` | Unit | Mensajes, códigos, instanceof |
| `platform/` | Integration | Middleware, server, logger, cache |

## Unit: Use case con mocks

```ts
// test/features/users/CreateUser.uc.test.ts
import { CreateUserUseCase } from "@/features/users/application/use-cases/CreateUser.uc.js";

const mockRepo = {
  findByEmail: vi.fn(),
  save: vi.fn(),
};

const uc = new CreateUserUseCase(mockRepo);

it("creates a user successfully", async () => {
  mockRepo.findByEmail.mockResolvedValue(null);
  mockRepo.save.mockResolvedValue({ id: "1", email: "test@test.com" });

  const result = await uc.execute({ email: "test@test.com", name: "Test" });
  expect(result).toHaveProperty("id");
});
```

## Integration: Controller

```ts
// test/features/users/User.controller.test.ts
import supertest from "supertest";

it("POST /users returns 201", async () => {
  const res = await request(app)
    .post("/users")
    .send({ email: "test@test.com", name: "Test" });
  expect(res.status).toBe(201);
});
```

## Buenas prácticas

- No testear frameworks, solo tu código
- Mocks en el puerto (interfaz), no en la implementación
- Tests de integración contra BD real o testcontainers
- Nombrar tests como unidades de comportamiento, no métodos
- Coverage mínimo sugerido: 85% use cases, 75% adapters
- Los mappers se testean con fixtures: entrada conocida → salida esperada

## Ver también

- `reference/anti-corruption-layer.md` — tests de ACL y traducción entre contexts
- `reference/di-strategies.md` — DI testing con mocks manuales
- `reference/temper.md` — DI disciplinada que habilita testabilidad
