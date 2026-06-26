# Security Patterns — Autenticación, autorización, rate limiting, validación

## Principios arquitectónicos

- La seguridad es **infraestructura transversal**, no dominio de negocio.
- AuthN/AuthZ se implementan en `platform/security/` y se inyectan como middleware o decoradores.
- El dominio nunca contiene lógica de autenticación. Solo recibe `userId` si el caso de uso lo necesita.
- Validación de entrada en el controller o middleware de validación, nunca en la entidad de dominio.

## Capas de seguridad

| Capa | Responsabilidad | Ubicación |
|------|----------------|-----------|
| Transport | TLS, HSTS, CORS, CSRF | platform/http/ |
| AuthN | Verificar quién es el usuario | platform/security/ |
| AuthZ | Verificar qué puede hacer | platform/security/ + features |
| Input validation | Sanitizar entrada | platform/http/ middleware |
| Rate limiting | Proteger contra abuso | platform/http/ middleware |
| Audit logging | Registrar acciones sensibles | platform/observability/ |

## AuthN: Estrategias

| Estrategia | Cuándo usarla |
|------------|---------------|
| JWT (access + refresh) | SPAs, mobile, APIs stateless |
| Session + cookie | SSR tradicional, apps server-side |
| API Key | Service-to-service, CLIs |
| OAuth2 / OIDC | Delegación a terceros (Google, GitHub) |

```ts
// platform/security/Auth.middleware.ts
export class AuthMiddleware {
  async authenticate(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.replace("Bearer ", "");
    const payload = await this.jwtService.verify(token);
    req.user = payload;
    next();
  }
}
```

## AuthZ: RBAC y Policy-based

```ts
// features/users/application/use-cases/DeleteUser.uc.ts
export class DeleteUserUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly authz: IAuthorizationService,
  ) {}

  async execute(actorId: string, targetId: string): Promise<void> {
    await this.authz.require(actorId, "user:delete", { targetId });
    // … lógica del caso de uso
  }
}
```

## Rate limiting

```ts
// platform/http/RateLimiter.middleware.ts
// Por IP, por ruta, por rol. Almacenamiento en Redis.
// Headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
```

## Validación

```ts
// shared/contracts/schemas.ts (zod)
export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  role: z.enum(["admin", "user"]).default("user"),
});
```

## Buenas prácticas

- Jamás almacenar passwords en texto plano. Usar bcrypt/argon2.
- JWT con corta expiración (15min access, 7d refresh)
- Refresh token rotation al usarse
- Rate limit por endpoint según criticidad: login (5/min), register (3/min), GET (100/min)
- CORS whitelist de origins conocidos, nunca `*`
- Helmet para headers de seguridad (CSP, X-Frame-Options, etc.)
- Secretos en variables de entorno, nunca en código
- Auditoría de acciones sensibles: login, delete, role change, export
