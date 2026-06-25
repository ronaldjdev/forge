# AGENTS.md — page-app

## Idioma
Responder siempre en español.

## Scripts
- `pnpm dev` — servidor de desarrollo con HMR
- `pnpm build` — `tsc -b && vite build` (typecheck antes de build)
- `pnpm lint` — `oxlint` (no eslint)
- `pnpm preview` — previsualizar build

## Stack
- React 19 + TypeScript ~6.0
- Vite 8 + Tailwind CSS v4
- Oxlint para linting
- Gestor de paquetes: pnpm

## Configuración
- `vite.config.ts` — plugins: react() y tailwindcss()
- `.oxlintrc.json` — reglas: react/rules-of-hooks (error), react/only-export-components (warn)
- `tsconfig.json` — usa project references (`tsconfig.app.json`, `tsconfig.node.json`)
- `tsconfig.app.json` — `verbatimModuleSyntax: true`, `noEmit: true`
