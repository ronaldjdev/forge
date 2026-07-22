#!/usr/bin/env node

/**
 * rules.mjs — Anti-pattern rule registry (R1-R9 + custom).
 *
 * Centraliza todas las reglas arquitectónicas. Cada regla tiene:
 *   id, name, severity, category, description, check(deps), fix
 *
 * Uso:
 *   import { RULES, loadCustomRules, evaluateRules } from "./registry/rules.mjs";
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();

export const SEVERITY = {
  CRITICAL: "CRITICAL",
  ERROR: "ERROR",
  WARNING: "WARNING",
  INFO: "INFO",
  SUGGESTION: "SUGGESTION",
};

const CATEGORY = {
  DEPENDENCY: "dependency",
  STRUCTURE: "structure",
  NAMING: "naming",
  DECORATOR: "decorator",
  OWNERSHIP: "ownership",
};

/**
 * Core rule definition template.
 * Each rule has a `check` function receiving (graph, ctx) and returning violations[].
 */
export function defineRule({ id, name, severity, category, description, check, fix, example }) {
  return { id, name, severity, category, description, check, fix, example };
}

/**
 * R1-R9 + R13 + R14 built-in rules.
 * check(graph, ctx) → Array<{ rule, severity, from, to, file, line?, description }>
 */
export const RULES = [
  defineRule({
    id: "R1",
    name: "Feature no importa infraestructura",
    severity: SEVERITY.CRITICAL,
    category: CATEGORY.DEPENDENCY,
    description: "Un feature no debe importar directamente de infra/",
    fix: "Crear un adapter en el feature y delegar en la implementación de infra vía interfaz inyectada.",
    example: "✘ features/auth/adapters/out/persistence/PrismaAuthRepo.ts importa de infra/prisma/",
    check: (graph) => {
      const violations = [];
      for (const edge of graph.edges || []) {
        if (edge.fromLayer === "feature" && edge.toLayer === "infra") {
          violations.push({
            rule: "R1", severity: SEVERITY.CRITICAL,
            from: edge.from, to: edge.to, file: edge.file,
            description: `Feature "${edge.from}" importa infraestructura "${edge.to}"`,
          });
        }
      }
      return violations;
    },
  }),

  defineRule({
    id: "R2",
    name: "Platform no importa features",
    severity: SEVERITY.CRITICAL,
    category: CATEGORY.DEPENDENCY,
    description: "Platform no puede depender de features de negocio.",
    fix: "Extraer la lógica necesaria a shared/ o inyectar la dependencia.",
    example: "✘ platform/logger.ts importa de features/users/",
    check: (graph) => {
      const violations = [];
      for (const edge of graph.edges || []) {
        if (edge.fromLayer === "platform" && edge.toLayer === "feature") {
          violations.push({
            rule: "R2", severity: SEVERITY.CRITICAL,
            from: edge.from, to: edge.to, file: edge.file,
            description: `Platform "${edge.from}" importa feature "${edge.to}"`,
          });
        }
      }
      return violations;
    },
  }),

  defineRule({
    id: "R3",
    name: "Shared no importa features",
    severity: SEVERITY.CRITICAL,
    category: CATEGORY.DEPENDENCY,
    description: "Shared es código puro sin dependencias de negocio.",
    fix: "Mover la lógica al feature que la necesita en lugar de a shared/.",
    example: "✘ shared/utils/helper.ts importa de features/auth/",
    check: (graph) => {
      const violations = [];
      for (const edge of graph.edges || []) {
        if (edge.fromLayer === "shared" && edge.toLayer === "feature") {
          violations.push({
            rule: "R3", severity: SEVERITY.CRITICAL,
            from: edge.from, to: edge.to, file: edge.file,
            description: `Shared "${edge.from}" importa feature "${edge.to}"`,
          });
        }
      }
      return violations;
    },
  }),

  defineRule({
    id: "R4",
    name: "Shared no importa infraestructura",
    severity: SEVERITY.CRITICAL,
    category: CATEGORY.DEPENDENCY,
    description: "Shared no debe acoplarse a implementaciones concretas.",
    fix: "Mover la implementación a infra/ y la interfaz a shared/contracts/.",
    example: "✘ shared/errors/AppError.ts importa de infra/prisma/",
    check: (graph) => {
      const violations = [];
      for (const edge of graph.edges || []) {
        if (edge.fromLayer === "shared" && edge.toLayer === "infra") {
          violations.push({
            rule: "R4", severity: SEVERITY.CRITICAL,
            from: edge.from, to: edge.to, file: edge.file,
            description: `Shared "${edge.from}" importa infra "${edge.to}"`,
          });
        }
      }
      return violations;
    },
  }),

  defineRule({
    id: "R5",
    name: "Domain no importa infraestructura",
    severity: SEVERITY.CRITICAL,
    category: CATEGORY.DEPENDENCY,
    description: "El dominio debe estar completamente aislado de la infraestructura.",
    fix: "Invertir la dependencia: interfaz en domain, implementación en infra/adapter.",
    example: "✘ features/users/domain/UserEntity.ts importa de infra/prisma/",
    check: (graph) => {
      const violations = [];
      for (const edge of graph.edges || []) {
        if (edge.fromLayer === "domain" && edge.toLayer === "infra") {
          violations.push({
            rule: "R5", severity: SEVERITY.CRITICAL,
            from: edge.from, to: edge.to, file: edge.file,
            description: `Domain "${edge.from}" importa infra "${edge.to}"`,
          });
        }
      }
      return violations;
    },
  }),

  defineRule({
    id: "R6",
    name: "Domain no importa platform",
    severity: SEVERITY.ERROR,
    category: CATEGORY.DEPENDENCY,
    description: "El dominio no debe acoplarse a la plataforma técnica.",
    fix: "Inyectar la dependencia de platform como interfaz en lugar de import directo.",
    example: "✘ features/users/domain/UserEntity.ts importa de platform/config/",
    check: (graph) => {
      const violations = [];
      for (const edge of graph.edges || []) {
        if (edge.fromLayer === "domain" && edge.toLayer === "platform") {
          violations.push({
            rule: "R6", severity: SEVERITY.ERROR,
            from: edge.from, to: edge.to, file: edge.file,
            description: `Domain "${edge.from}" importa platform "${edge.to}"`,
          });
        }
      }
      return violations;
    },
  }),

  defineRule({
    id: "R7",
    name: "Infra no importa features",
    severity: SEVERITY.ERROR,
    category: CATEGORY.DEPENDENCY,
    description: "Infraestructura no debe conocer features de negocio.",
    fix: "Si infra necesita datos del feature, crear un adapter o evento.",
    example: "✘ infra/prisma/client.ts importa de features/users/",
    check: (graph) => {
      const violations = [];
      for (const edge of graph.edges || []) {
        if (edge.fromLayer === "infra" && edge.toLayer === "feature") {
          violations.push({
            rule: "R7", severity: SEVERITY.ERROR,
            from: edge.from, to: edge.to, file: edge.file,
            description: `Infra "${edge.from}" importa feature "${edge.to}"`,
          });
        }
      }
      return violations;
    },
  }),

  defineRule({
    id: "R8",
    name: "Sin imports directos entre features",
    severity: SEVERITY.ERROR,
    category: CATEGORY.DEPENDENCY,
    description: "Un feature no debe importar directamente otro feature.",
    fix: "Extraer interfaz compartida a shared/contracts/ o inyectar vía DI.",
    example: "✘ features/products/ usa clases de features/users/ directamente",
    check: (graph) => {
      const violations = [];
      for (const edge of graph.edges || []) {
        if (edge.fromLayer === "feature" && edge.toLayer === "feature") {
          violations.push({
            rule: "R8", severity: SEVERITY.ERROR,
            from: edge.from, to: edge.to, file: edge.file,
            description: `Feature "${edge.from}" importa otro feature "${edge.to}" directamente`,
          });
        }
      }
      return violations;
    },
  }),

  defineRule({
    id: "R9",
    name: "Sin ciclos de dependencias",
    severity: SEVERITY.ERROR,
    category: CATEGORY.DEPENDENCY,
    description: "No deben existir ciclos en el grafo de dependencias.",
    fix: "Extraer interfaz común a shared/ y romper la dependencia circular.",
    example: "features/users → features/products → features/users",
    check: (graph) => {
      const violations = [];
      if (graph?.stats?.hasCycles) {
        violations.push({
          rule: "R9", severity: SEVERITY.ERROR,
          from: "(multiple)", to: "(cycle)",
          description: "Ciclo de dependencias detectado en el grafo arquitectónico",
          fix: "Extraer interfaz compartida a shared/ y romper el ciclo",
        });
      }
      return violations;
    },
  }),

  defineRule({
    id: "R13",
    name: "Platform no contiene lógica de dominio",
    severity: SEVERITY.CRITICAL,
    category: CATEGORY.STRUCTURE,
    description: "Platform es backbone técnico y no debe contener entidades, casos de uso, mappers de dominio, schemas de entidades, repositorios de dominio ni ninguna otra lógica de negocio.",
    fix: "Mover el archivo con lógica de dominio a src/features/<name>/domain/, src/features/<name>/application/, o src/features/<name>/adapters/ según corresponda.",
    example: "✘ platform/User.entity.ts, platform/payments/ creando lógica de dominio en platform/",
    check: (graph, ctx) => {
      const violations = [];
      if (!ctx || !ctx.platform || !ctx.platform.exists) return violations;
      for (const comp of (ctx.platform.components || [])) {
        const lower = comp.toLowerCase();
        if (lower.endsWith(".entity") || lower.endsWith(".uc") || lower.endsWith(".mapper") || lower.endsWith(".port")) {
          violations.push({
            rule: "R13", severity: SEVERITY.CRITICAL,
            from: `platform:${comp}`, to: "(domain)",
            description: `Platform contiene artefacto de dominio: "${comp}"`,
          });
        }
      }
      return violations;
    },
  }),

  defineRule({
    id: "R14",
    name: "Shared no importa domain de features",
    severity: SEVERITY.CRITICAL,
    category: CATEGORY.DEPENDENCY,
    description: "Shared no debe depender de entidades o lógica de dominio de features específicos. Shared es código puro reutilizable sin acoplamiento a features.",
    fix: "Mover la lógica compartida a shared/ como interfaz o tipo puro, o crear un contrato en shared/contracts/ que los features implementen.",
    example: "✘ shared/contracts/ICampaign.repository.ts importa Campaign de features/campaign/domain/",
    check: (graph) => {
      const violations = [];
      for (const edge of graph.edges || []) {
        if (edge.fromLayer === "shared" && edge.toLayer === "domain") {
          violations.push({
            rule: "R14", severity: SEVERITY.CRITICAL,
            from: edge.from, to: edge.to, file: edge.file,
            description: `Shared "${edge.from}" importa domain "${edge.to}"`,
          });
        }
      }
      return violations;
    },
  }),
];

/**
 * Map of rule id → rule for quick lookup.
 */
export const RULES_BY_ID = Object.fromEntries(RULES.map(r => [r.id, r]));

/**
 * Load custom rules from .forge/rules.json.
 */
export function loadCustomRules() {
  const path = join(ROOT, ".forge", "rules.json");
  try {
    const raw = readFileSync(path, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Evaluate all built-in + custom rules against a graph.
 * Returns violations[] compatible with detect.mjs / inspect.mjs.
 */
export function evaluateRules(graph, ctx = {}) {
  const violations = [];

  for (const rule of RULES) {
    try {
      const hits = rule.check(graph, ctx);
      for (const h of hits) {
        violations.push({
          ...h,
          rule: h.rule || rule.id,
          severity: h.severity || rule.severity,
          name: rule.name,
        });
      }
    } catch {
      // skip rules that error
    }
  }

  const customRules = loadCustomRules();
  for (const rule of customRules) {
    if (!rule.id || !rule.pattern) continue;
    try {
      const sev = rule.severity || SEVERITY.WARNING;
      const re = new RegExp(rule.pattern);
      const fileRe = rule.files ? new RegExp(rule.files) : null;
      for (const node of graph.nodes || []) {
        if (fileRe && !fileRe.test(node.id)) continue;
        if (re.test(node.id)) {
          violations.push({
            rule: rule.id,
            severity: sev,
            from: node.id,
            to: "",
            description: rule.message || `Violación de regla custom: ${rule.id}`,
            fix: rule.fix || null,
          });
        }
      }
    } catch {
      // skip invalid custom rules
    }
  }

  return violations;
}

if (process.argv[1]?.endsWith("rules.mjs")) {
  const args = process.argv.slice(2);
  if (args.includes("--list")) {
    console.log("── Built-in Rules ──");
    for (const r of RULES) {
      console.log(`  ${r.id} [${r.severity}] ${r.name}`);
      console.log(`       ${r.description}`);
      console.log(`       Fix: ${r.fix}`);
      if (r.example) console.log(`       Ej: ${r.example}`);
      console.log();
    }
  }
  if (args.includes("--test")) {
    const mockGraph = {
      nodes: [{ id: "features/auth", layer: "feature" }, { id: "infra/prisma", layer: "infra" }],
      edges: [{ from: "features/auth", fromLayer: "feature", to: "infra/prisma", toLayer: "infra", file: "src/features/auth/repo.ts" }],
      stats: { hasCycles: false },
    };
    const violations = evaluateRules(mockGraph);
    console.log(JSON.stringify(violations, null, 2));
  }
}
