# Smelt

Funde y extrae código reutilizable de un feature a la capa `shared/` del proyecto.

## Cuándo usarlo

- El mismo código aparece en 2+ features
- Una interfaz es claramente transversal (ILogger, IHttpClient, IEmail)
- Un tipo o utilidad es usado por múltiples features
- Un mapper tiene lógica que no es específica del dominio

## ¿Qué va en shared/?

```
src/shared/
├── errors/          # Errores reutilizables (AppError, DomainError, etc.)
├── port/            # Puertos externos globales (ILogger, IHttpClient, IEmail, IWhatsapp)
├── utils/           # Utilidades puras (constants, crypto, date, etc.)
├── types/           # Tipos globales compartidos
└── middleware/      # Middleware transversal (auth, logging, error handler)
```

## ¿Qué NO va en shared/?

- Lógica de negocio de un feature específico
- Interfaces de repositorio de un feature
- Schemas o modelos de BD
- Configuración de un feature
- Tests de integración de un feature

## Flujo

1. Identificar el código duplicado o transversal
2. Verificar que no contiene lógica de negocio específica
3. Moverlo a la ubicación correspondiente en `src/shared/`
4. Actualizar todos los imports en los features que lo usan
5. Actualizar `ARCHITECTURE.md` si hay nuevas dependencias compartidas

## Reglas

- shared/ nunca depende de features/
- shared/ nunca contiene lógica de negocio
- shared/ nunca accede a infraestructura (BD, APIs externas)
- Los puertos en shared/port/ solo definen interfaces, no implementaciones
- Las implementaciones de puertos globales van en src/adapters/out/
