# Architecture State

- Project Name: <name>
- Framework: <detectado>
- Runtime: <detectado>
- Database: <detectado>
- ORM: <detectado>
- DI Strategy: <detectado>
- Profile: <detectado>
- Architecture: hexagonal-feature (Platform + Features + Shared + Infra)
- Last Audit: <fecha> (score: <puntaje>)

## Platform
- platform/config/
- platform/server/
...

## Features
- features/users/
...

## Shared
- shared/errors/
...

## Infrastructure
- infra/prisma/
...

## Ownership
- Health: healthy | degraded | critical
- Score: 0-100
- Orphans: 0
- Duplicates: 0
- Misplaced: 0

## Architecture Graph
...

## Dependency Health
...
