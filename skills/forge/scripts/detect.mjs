#!/usr/bin/env node

import { join, relative, basename } from "path";
import { readFileSync, existsSync, readdirSync, statSync, writeFileSync, renameSync, mkdirSync } from "fs";
import { buildGraph } from "./graph.mjs";
import { buildOwnershipReport } from "./armorer.mjs";
import { parseImportsWithLines } from "./parse-imports.mjs";
import { detectNamingViolations, computeExpectedName } from "./rename.mjs";
import { formatViolation, formatCheck, GREEN, RED, YELLOW, CYAN, BOLD, RESET, DIM, GRAY } from "./formatter.mjs";

const ROOT = process.cwd();
const SRC = join(ROOT, "src");
const FEATURES = join(SRC, "features");

const LEGACY_DIRS = [
  ["src/domain/entities", "Entidades legacy"],
  ["src/domain/repositories", "Repository interfaces legacy"],
  ["src/application/use-cases", "Casos de uso legacy (subcarpetas)"],
  ["src/adapters/in/http/controllers", "Controllers legacy"],
  ["src/adapters/out/database/repositories", "Repository impls legacy"],
  ["src/adapters/out/database/schemas", "Schemas legacy"],
  ["src/adapters/out/database/mappers", "Mappers legacy"],
  ["src/setting/dependencies", "DI wiring legacy (.di.ts)"],
];
const INJECTABLE_RE = /@injectable\s*\(\)/g;
const INJECT_RE = /@inject\s*\([^)]+\)/g;
const BD_MODEL_RE = /\b\w+Model\s*\.\s*(find|findOne|findById|create|insertMany|updateOne|updateMany|deleteOne|deleteMany|aggregate|save|lean)\s*\(/g;
const LOGIC_KEYWORDS_RE = /\b(if|for|while|switch|catch|throw|return)\s*\(/g;

const SEVERITY = {
  CRITICAL: "CRITICAL",
  ERROR: "ERROR",
  WARNING: "WARNING",
  INFO: "INFO",
  SUGGESTION: "SUGGESTION",
};

function read(path) {
  try {
    return readFileSync(path, "utf-8");
  } catch {
    return null;
  }
}

function exists(path) {
  return existsSync(path);
}

function isDir(path) {
  return existsSync(path) && statSync(path).isDirectory();
}

function listDir(path) {
  try {
    return readdirSync(path);
  } catch {
    return [];
  }
}

function findFiles(dir, ext, maxDepth = 5) {
  const results = [];
  function walk(d, depth) {
    if (depth > maxDepth) return;
    try {
      for (const entry of readdirSync(d)) {
        const full = join(d, entry);
        if (statSync(full).isDirectory()) {
          walk(full, depth + 1);
        } else if (entry.endsWith(ext)) {
          results.push(full);
        }
      }
    } catch { /* skip */ }
  }
  if (existsSync(dir)) walk(dir, 0);
  return results;
}

export function detectFeaturesOnSrc() {
  if (!isDir(FEATURES)) return [];
  return listDir(FEATURES).filter((f) => isDir(join(FEATURES, f)));
}

function detectLegacyFeatures() {
  const legacy = [];
  const ucBase = join(SRC, "application", "use-cases");
  const ctrlDir = join(SRC, "adapters", "in", "http", "controllers");
  const seen = new Set();
  for (const sub of listDir(ucBase)) {
    if (isDir(join(ucBase, sub))) { legacy.push(sub); seen.add(sub); }
  }
  for (const file of listDir(ctrlDir)) {
    const m = file.match(/^(.+)\.controller\.(ts|js)$/);
    if (m && !seen.has(m[1])) { legacy.push(m[1]); seen.add(m[1]); }
  }
  return legacy;
}

function parseImports(content, filePath) {
  return parseImportsWithLines(content, filePath);
}

function hasDecorator(content, decoratorRe) {
  decoratorRe.lastIndex = 0;
  return decoratorRe.test(content);
}

function hasFile(dir, pattern) {
  return listDir(dir).some((f) => f.match(pattern));
}

function hasSubdir(dir, sub) {
  return isDir(join(dir, sub));
}

function severity(label, sev) {
  return { severity: sev, label };
}

// ── Inline Ignores ──

/**
 * Parse all forge-ignore comments in a file.
 * Returns a Set of rule IDs that should be ignored for each line.
 */
export function parseInlineIgnores(content) {
  const ignores = {}; // lineNumber → Set<ruleId>
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    // // forge-ignore-next-line
    if (trimmed.includes("// forge-ignore-next-line")) {
      const targetLine = i + 2; // next line is 1-indexed
      if (!ignores[targetLine]) ignores[targetLine] = new Set();
      ignores[targetLine].add("*");
      continue;
    }

    // // forge-ignore: R1, R3  (applies to current line)
    const match = trimmed.match(/\/\/\s*forge-ignore:\s*(.+)/);
    if (match) {
      if (!ignores[i + 1]) ignores[i + 1] = new Set();
      const rules = match[1].split(",").map(r => r.trim().toUpperCase());
      for (const r of rules) ignores[i + 1].add(r);
    }
  }

  return ignores;
}

/**
 * Load inline ignores for all .ts/.mjs files in a directory (recursive).
 * Returns Map<filePath, Map<lineNumber, Set<ruleId>>>
 */
export function loadAllInlineIgnores(dir, maxDepth = 10) {
  const allIgnores = new Map();

  function walk(d, depth) {
    if (depth > maxDepth) return;
    try {
      for (const entry of readdirSync(d, { withFileTypes: true })) {
        const full = join(d, entry.name);
        if (entry.isDirectory()) {
          walk(full, depth + 1);
        } else if (entry.name.endsWith(".ts") || entry.name.endsWith(".mjs") || entry.name.endsWith(".js")) {
          const content = read(full);
          if (!content) continue;
          const ignores = parseInlineIgnores(content);
          if (Object.keys(ignores).length > 0) {
            allIgnores.set(full, ignores);
          }
        }
      }
    } catch { /* skip */ }
  }

  if (existsSync(dir)) walk(dir, 0);
  return allIgnores;
}

/**
 * Check if a violation should be ignored based on inline ignores.
 */
export function isIgnored(violation, allIgnores) {
  if (!violation.detail) return false;
  const filePath = violation.detail.split(":")[0];
  const lineMatch = violation.detail.match(/:(\d+)/);
  if (!lineMatch) return false;

  const line = parseInt(lineMatch[1], 10);
  const fileIgnores = allIgnores.get(filePath);
  if (!fileIgnores) return false;

  const lineIgnores = fileIgnores[line];
  if (!lineIgnores) return false;

  if (lineIgnores.has("*")) return true;

  const ruleMatch = violation.label.match(/\[([^\]]+)\]/);
  if (ruleMatch) {
    const ruleId = ruleMatch[1].toUpperCase();
    if (lineIgnores.has(ruleId)) return true;
  }

  // Also check if the violation's rule id is in the ignores
  if (violation.rule && lineIgnores.has(violation.rule.toUpperCase())) return true;

  return false;
}

/* ── Checks ── */

export function checkStructure(features) {
  const checks = [];
  let score = 0;

  if (isDir(FEATURES)) {
    checks.push({ ...severity("src/features/ existe", SEVERITY.INFO), pass: true });
    score += 2;
  } else {
    checks.push({ ...severity("src/features/ no existe", SEVERITY.ERROR), pass: false, fix: "Crear src/features/ directorio" });
  }

  for (const feat of features) {
    const fDir = join(FEATURES, feat);
    let featScore = 0;

    if (hasSubdir(fDir, "domain")) {
      const dDir = join(fDir, "domain");
      if (hasFile(dDir, /\.entity\.ts$/)) {
        checks.push({ ...severity(`${feat}: domain/<Name>.entity.ts`, SEVERITY.INFO), pass: true });
        featScore += 3;
      } else {
        checks.push({ ...severity(`${feat}: falta entity en domain/`, SEVERITY.ERROR), pass: false, fix: `Crear ${feat}.entity.ts en ${feat}/domain/` });
      }
      if (hasFile(dDir, /^I[A-Z]/)) {
        checks.push({ ...severity(`${feat}: domain/I<Name>Repository.ts`, SEVERITY.INFO), pass: true });
        featScore += 2;
      } else {
        checks.push({ ...severity(`${feat}: falta repository interface en domain/`, SEVERITY.WARNING), pass: false, fix: `Crear I${feat.charAt(0).toUpperCase() + feat.slice(1)}Repository.ts` });
      }
    } else {
      checks.push({ ...severity(`${feat}: falta domain/`, SEVERITY.ERROR), pass: false, fix: `Crear ${feat}/domain/` });
    }

    if (hasSubdir(fDir, "application/use-cases")) {
      if (hasFile(join(fDir, "application/use-cases"), /\.ts$/)) {
        checks.push({ ...severity(`${feat}: application/use-cases/`, SEVERITY.INFO), pass: true });
        featScore += 3;
      } else {
        checks.push({ ...severity(`${feat}: application/use-cases/ vacío`, SEVERITY.WARNING), pass: false, fix: `Migrar casos de uso a ${feat}/application/use-cases/` });
      }
    } else {
      checks.push({ ...severity(`${feat}: falta application/use-cases/`, SEVERITY.ERROR), pass: false, fix: `Crear ${feat}/application/use-cases/` });
    }

    if (hasSubdir(fDir, "application/mappers")) {
      if (hasFile(join(fDir, "application/mappers"), /\.mapper\.ts$/)) {
        checks.push({ ...severity(`${feat}: application/mappers/`, SEVERITY.INFO), pass: true });
        featScore += 2;
      } else {
        checks.push({ ...severity(`${feat}: application/mappers/ sin mappers`, SEVERITY.SUGGESTION), pass: false, fix: `Migrar mapper a ${feat}/application/mappers/` });
      }
    }

    if (hasSubdir(fDir, "adapters/in/http")) {
      const httpDir = join(fDir, "adapters/in/http");
      if (hasFile(httpDir, /Controller\.ts$/)) {
        checks.push({ ...severity(`${feat}: adapters/in/http/<Name>Controller.ts`, SEVERITY.INFO), pass: true });
        featScore += 3;
      } else {
        checks.push({ ...severity(`${feat}: falta controller en adapters/in/http/`, SEVERITY.ERROR), pass: false, fix: `Crear controller en ${feat}/adapters/in/http/` });
      }
      if (hasFile(httpDir, /\.routes\.ts$/)) {
        checks.push({ ...severity(`${feat}: adapters/in/http/<name>.routes.ts`, SEVERITY.INFO), pass: true });
        featScore += 2;
      } else {
        checks.push({ ...severity(`${feat}: falta routes en adapters/in/http/`, SEVERITY.WARNING), pass: false, fix: `Crear routes en ${feat}/adapters/in/http/` });
      }
    } else {
      checks.push({ ...severity(`${feat}: falta adapters/in/http/`, SEVERITY.ERROR), pass: false, fix: `Crear ${feat}/adapters/in/http/` });
    }

    if (hasSubdir(fDir, "adapters/out/persistence")) {
      const pDir = join(fDir, "adapters/out/persistence");
      if (hasFile(pDir, /Repository\.ts$/)) {
        checks.push({ ...severity(`${feat}: adapters/out/persistence/<Name>Repository.ts`, SEVERITY.INFO), pass: true });
        featScore += 3;
      } else {
        checks.push({ ...severity(`${feat}: falta repository impl en persistence/`, SEVERITY.ERROR), pass: false, fix: `Migrar repository a ${feat}/adapters/out/persistence/` });
      }
      if (hasFile(pDir, /Schema\.ts$/)) {
        checks.push({ ...severity(`${feat}: adapters/out/persistence/<Name>Schema.ts`, SEVERITY.INFO), pass: true });
        featScore += 2;
      } else {
        checks.push({ ...severity(`${feat}: falta schema en persistence/`, SEVERITY.WARNING), pass: false, fix: `Migrar schema a ${feat}/adapters/out/persistence/` });
      }
    } else {
      checks.push({ ...severity(`${feat}: falta adapters/out/persistence/`, SEVERITY.ERROR), pass: false, fix: `Crear ${feat}/adapters/out/persistence/` });
    }

    score += Math.min(featScore, 20);
  }

  if (features.length === 0) {
    const legacy = detectLegacyFeatures();
    if (legacy.length > 0) {
      checks.push({ ...severity("Ningún feature migrado a src/features/", SEVERITY.ERROR), pass: false, fix: `Migrar: ${legacy.join(", ")}` });
    } else {
      checks.push({ ...severity("No se encontraron features", SEVERITY.INFO), pass: false, fix: "Crear primer feature en src/features/" });
    }
  }

  return { score: Math.min(score, 30), checks };
}

export function checkLayers(features) {
  const checks = [];
  let score = 0;

  if (features.length === 0) {
    checks.push({ ...severity("Sin features para analizar capas", SEVERITY.WARNING), pass: false, fix: "Migrar al menos un feature primero" });
    return { score: 0, checks };
  }

  for (const feat of features) {
    const fDir = join(FEATURES, feat);

    /* Domain layer */
    const domainFiles = findFiles(join(fDir, "domain"), ".ts", 3);
    let domainOk = true;
    for (const f of domainFiles) {
      const content = read(f);
      if (!content) continue;
      const imports = parseImports(content, f);
      for (const imp of imports) {
        if (imp.source.startsWith("@/adapters") || imp.source.startsWith("../adapters") || imp.source.includes("adapters")) {
          checks.push({
            ...severity(`${feat}: domain importa de adapters`, SEVERITY.CRITICAL),
            pass: false,
            detail: `${relative(ROOT, f)}:${imp.line}`,
            fix: "Eliminar import de adapters en archivos de dominio",
          });
          domainOk = false;
          score -= 3;
        }
      }
    }
    if (domainOk && domainFiles.length > 0) {
      checks.push({ ...severity(`${feat}: domain/ sin imports prohibidos`, SEVERITY.INFO), pass: true });
      score += 3;
    }

    /* Application layer */
    const appFiles = findFiles(join(fDir, "application"), ".ts", 5);
    let appOk = true;
    for (const f of appFiles) {
      const content = read(f);
      if (!content) continue;
      const imports = parseImports(content, f);
      for (const imp of imports) {
        if (imp.source.startsWith("@/adapters") || imp.source.includes("/adapters/") || imp.source.startsWith("@/setting")) {
          checks.push({
            ...severity(`${feat}: application importa de adapters/setting`, SEVERITY.ERROR),
            pass: false,
            detail: `${relative(ROOT, f)}:${imp.line}`,
            fix: "Reemplazar import directo por inyección de interfaz en el constructor",
          });
          appOk = false;
          score -= 3;
        }
      }
      if (content.includes("tsyringe") && content.includes("container.")) {
        checks.push({
          ...severity(`${feat}: use case usa container.resolve()`, SEVERITY.ERROR),
          pass: false,
          detail: relative(ROOT, f),
          fix: "Eliminar container.resolve() de casos de uso. Inyectar dependencias por constructor.",
        });
        appOk = false;
        score -= 2;
      }
    }
    if (appOk && appFiles.length > 0) {
      checks.push({ ...severity(`${feat}: application/ sin imports prohibidos`, SEVERITY.INFO), pass: true });
      score += 3;
    }

    /* Controller business logic */
    const ctrlFiles = findFiles(join(fDir, "adapters/in/http"), ".ts", 3);
    let ctrlLogicOk = ctrlFiles.filter((f) => !f.endsWith(".routes.ts")).length > 0;
    for (const f of ctrlFiles) {
      if (f.endsWith(".routes.ts")) continue;
      const content = read(f);
      if (!content) continue;
      const logicMatches = content.match(LOGIC_KEYWORDS_RE);
      if (logicMatches && logicMatches.length > 3) {
        checks.push({
          ...severity(`${feat}: controller con lógica de negocio`, SEVERITY.ERROR),
          pass: false,
          detail: `${basename(f)} (${logicMatches.length} keywords)`,
          fix: "Extraer la lógica a un caso de uso e inyectarlo en el controller",
        });
        ctrlLogicOk = false;
        score -= 3;
      }
    }
    if (ctrlLogicOk && ctrlFiles.length > 0) {
      checks.push({ ...severity(`${feat}: controllers sin lógica de negocio`, SEVERITY.INFO), pass: true });
      score += 2;
    }
  }

  /* Cross-feature imports */
  if (features.length > 1) {
    let crossOk = true;
    for (const f of findFiles(FEATURES, ".ts", 6)) {
      const content = read(f);
      if (!content) continue;
      const imports = parseImports(content, f);
      for (const imp of imports) {
        for (const feat of features) {
          const other = features.filter((x) => x !== feat);
          for (const o of other) {
            if (imp.source.includes(`features/${o}/`) || imp.source.includes(`${o}/domain/`) || imp.source.includes(`${o}/application/`)) {
              checks.push({
                ...severity(`Import directo entre features`, SEVERITY.WARNING),
                pass: false,
                detail: `${relative(ROOT, f)} → ${imp.source}`,
                fix: `Inyectar interfaz en lugar de import directo`,
              });
              crossOk = false;
              score -= 2;
            }
          }
        }
      }
    }
    if (crossOk) {
      checks.push({ ...severity("Sin imports directos entre features", SEVERITY.INFO), pass: true });
      score += 2;
    }
  }

  /* Direct BD access */
  if (features.length > 0) {
    const allAppFiles = findFiles(FEATURES, ".ts", 6);
    let directBdOk = true;
    for (const f of allAppFiles) {
      const rel = relative(ROOT, f);
      if (rel.includes("out/persistence") || rel.includes("Schema")) continue;
      const content = read(f);
      if (!content) continue;
      BD_MODEL_RE.lastIndex = 0;
      const bdMatch = content.match(BD_MODEL_RE);
      if (bdMatch) {
        checks.push({
          ...severity(`Acceso directo a BD fuera de repository`, SEVERITY.ERROR),
          pass: false,
          detail: `${rel}: ${bdMatch.slice(0, 3).join(", ")}${bdMatch.length > 3 ? `... (+${bdMatch.length - 3})` : ""}`,
          fix: "Mover la operación de BD al repository correspondiente e inyectarlo",
        });
        directBdOk = false;
        score -= 3;
      }
    }
    if (directBdOk) {
      checks.push({ ...severity("Sin acceso directo a BD fuera de repositories", SEVERITY.INFO), pass: true });
      score += 2;
    }
  }

  return { score: Math.min(Math.max(score, 0), 25), checks };
}

export function checkDecorators(features) {
  const checks = [];
  let score = 0;

  if (features.length === 0) {
    checks.push({ ...severity("Sin features para analizar decoradores", SEVERITY.WARNING), pass: false });
    return { score: 0, checks };
  }

  for (const feat of features) {
    const fDir = join(FEATURES, feat);

    const ucFiles = findFiles(join(fDir, "application/use-cases"), ".ts", 3);
    let ucOk = true;
    for (const f of ucFiles) {
      const content = read(f);
      if (!content) continue;
      if (!hasDecorator(content, INJECTABLE_RE) && (content.includes("class ") && content.includes("constructor("))) {
        checks.push({ ...severity(`${feat}: falta @injectable() en ${basename(f)}`, SEVERITY.WARNING), pass: false, fix: `Agregar @injectable() a ${basename(f, ".ts")}` });
        ucOk = false;
        score -= 2;
      }
      if (content.includes("constructor(") && content.includes("@inject") === false && content.includes("private readonly")) {
        checks.push({ ...severity(`${feat}: falta @inject() en constructor de ${basename(f)}`, SEVERITY.WARNING), pass: false, fix: "Reemplazar parámetros manuales por @inject(Token)" });
        ucOk = false;
        score -= 1;
      }
    }
    if (ucOk && ucFiles.length > 0) {
      checks.push({ ...severity(`${feat}: use cases con @injectable()`, SEVERITY.INFO), pass: true });
      score += 4;
    }

    const ctrlFiles = findFiles(join(fDir, "adapters/in/http"), ".ts", 3);
    let ctrlOk = true;
    for (const f of ctrlFiles) {
      if (f.endsWith(".routes.ts")) continue;
      const content = read(f);
      if (!content) continue;
      if (!hasDecorator(content, INJECTABLE_RE) && content.includes("class ")) {
        checks.push({ ...severity(`${feat}: falta @injectable() en ${basename(f)}`, SEVERITY.WARNING), pass: false, fix: `Agregar @injectable() al controller ${basename(f, ".ts")}` });
        ctrlOk = false;
        score -= 3;
      }
    }
    if (ctrlOk && ctrlFiles.length > 0) {
      checks.push({ ...severity(`${feat}: controllers con @injectable()`, SEVERITY.INFO), pass: true });
      score += 4;
    }

    const repoFiles = findFiles(join(fDir, "adapters/out/persistence"), ".ts", 3);
    let repoOk = true;
    for (const f of repoFiles) {
      if (f.endsWith("Schema.ts")) continue;
      const content = read(f);
      if (!content) continue;
      if (!hasDecorator(content, INJECTABLE_RE) && content.includes("class ") && content.includes("implements ")) {
        checks.push({ ...severity(`${feat}: falta @injectable() en ${basename(f)}`, SEVERITY.WARNING), pass: false, fix: `Agregar @injectable() al repository ${basename(f, ".ts")}` });
        repoOk = false;
        score -= 2;
      }
    }
    if (repoOk && repoFiles.length > 0) {
      checks.push({ ...severity(`${feat}: repositories con @injectable()`, SEVERITY.INFO), pass: true });
      score += 3;
    }
  }

  const allFeatureFiles = findFiles(FEATURES, ".ts", 6);
  let hasTsyringe = false;
  for (const f of allFeatureFiles) {
    const content = read(f);
    if (content && content.includes('from "tsyringe"')) { hasTsyringe = true; break; }
  }
  if (hasTsyringe) {
    checks.push({ ...severity("tsyringe importado en features", SEVERITY.INFO), pass: true });
    score += 2;
  }

  let injectUsageOk = true;
  for (const f of allFeatureFiles) {
    const content = read(f);
    if (!content) continue;
    const injects = content.match(INJECT_RE);
    if (injects) {
      for (const inj of injects) {
        if (inj.includes("'") || inj.includes('"')) {
          checks.push({ ...severity(`@inject con string token`, SEVERITY.SUGGESTION), pass: false, detail: `${relative(ROOT, f)}: ${inj.trim()}`, fix: "Usar tokens de clase en lugar de strings" });
          injectUsageOk = false;
          score -= 1;
        }
      }
    }
  }
  if (injectUsageOk) {
    checks.push({ ...severity("@inject() usa tokens de clase (no strings)", SEVERITY.INFO), pass: true });
    score += 3;
  }

  return { score: Math.min(Math.max(score, 0), 20), checks };
}

export function checkLegacy() {
  const checks = [];
  let score = 0;

  for (const [dirPath, label] of LEGACY_DIRS) {
    const fullPath = join(ROOT, dirPath);
    if (!isDir(fullPath)) {
      checks.push({ ...severity(`${label}: no existe (ok)`, SEVERITY.INFO), pass: true });
      score += 1.5;
      continue;
    }
    const files = listDir(fullPath).filter((f) => f.endsWith(".ts") && !f.endsWith(".d.ts"));
    const subdirs = listDir(fullPath).filter((f) => isDir(join(fullPath, f)));
    if (files.length === 0 && subdirs.length === 0) {
      checks.push({ ...severity(`${label}: vacío (ok)`, SEVERITY.INFO), pass: true });
      score += 2;
    } else {
      const items = [...files, ...subdirs.map((d) => `${d}/`)];
      checks.push({
        ...severity(`${label}: ${items.length} archivo(s) legacy`, SEVERITY.WARNING),
        pass: false,
        detail: items.slice(0, 5).join(", ") + (items.length > 5 ? `... (+${items.length - 5})` : ""),
        fix: `Migrar contenido a src/features/ y eliminar ${dirPath}`,
      });
    }
  }

  return { score: Math.round(score), checks };
}

export function checkConfig() {
  const checks = [];
  let score = 0;

  function stripJsonComments(raw) {
    const lines = raw.split("\n");
    const out = [];
    for (let line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("/*") && trimmed.endsWith("*/")) continue;
      const slashSlash = trimmed.indexOf("//");
      if (slashSlash === 0) continue;
      const ci = line.indexOf("/*");
      if (ci > 0 && line.slice(ci).trim().endsWith("*/")) { out.push(line.slice(0, ci)); continue; }
      out.push(line);
    }
    return out.join("\n").replace(/,\s*([}\]])/g, "$1");
  }

  function readJson(path) {
    const raw = read(path);
    if (!raw) return null;
    try { return JSON.parse(stripJsonComments(raw)); } catch { return null; }
  }

  const tsconfig = readJson(join(ROOT, "tsconfig.json"));
  if (tsconfig) {
    const opts = tsconfig.compilerOptions || {};
    if (opts.experimentalDecorators === true) {
      checks.push({ ...severity("tsconfig: experimentalDecorators: true", SEVERITY.INFO), pass: true });
      score += 3;
    } else {
      checks.push({ ...severity("tsconfig: falta experimentalDecorators: true", SEVERITY.ERROR), pass: false, fix: 'Agregar "experimentalDecorators": true en compilerOptions' });
    }
    if (opts.emitDecoratorMetadata === true) {
      checks.push({ ...severity("tsconfig: emitDecoratorMetadata: true", SEVERITY.INFO), pass: true });
      score += 2;
    } else {
      checks.push({ ...severity("tsconfig: falta emitDecoratorMetadata: true", SEVERITY.ERROR), pass: false, fix: 'Agregar "emitDecoratorMetadata": true en compilerOptions' });
    }
  } else {
    checks.push({ ...severity("No se pudo leer tsconfig.json", SEVERITY.ERROR), pass: false });
  }

  const pkg = readJson(join(ROOT, "package.json"));
  if (pkg) {
    const deps = pkg.dependencies || {};
    const devDeps = pkg.devDependencies || {};
    if (deps.tsyringe) {
      checks.push({ ...severity("tsyringe instalado", SEVERITY.INFO), pass: true });
      score += 2;
    } else {
      checks.push({ ...severity("tsyringe no instalado", SEVERITY.WARNING), pass: false, fix: "pnpm add tsyringe" });
    }
    if (deps["reflect-metadata"]) {
      checks.push({ ...severity("reflect-metadata instalado", SEVERITY.INFO), pass: true });
      score += 1;
    } else {
      checks.push({ ...severity("reflect-metadata no instalado", SEVERITY.WARNING), pass: false, fix: "pnpm add reflect-metadata" });
    }
    if (devDeps["@types/tsyringe"]) {
      checks.push({ ...severity("@types/tsyringe instalado", SEVERITY.INFO), pass: true });
      score += 1;
    } else {
      checks.push({ ...severity("@types/tsyringe no instalado (dev)", SEVERITY.SUGGESTION), pass: false, fix: "pnpm add -D @types/tsyringe" });
    }
  }

  const serverPath = join(SRC, "server.ts");
  const serverContent = read(serverPath);
  if (serverContent && serverContent.includes("reflect-metadata")) {
    checks.push({ ...severity("reflect-metadata importado en server.ts", SEVERITY.INFO), pass: true });
    score += 1;
  } else {
    const idxPath = join(SRC, "index.ts");
    const idxContent = read(idxPath);
    if (idxContent && idxContent.includes("reflect-metadata")) {
      checks.push({ ...severity("reflect-metadata importado en index.ts", SEVERITY.INFO), pass: true });
      score += 1;
    } else {
      checks.push({ ...severity("reflect-metadata no importado en entry point", SEVERITY.ERROR), pass: false, fix: 'Agregar import "reflect-metadata" al inicio de server.ts' });
    }
  }

  return { score, checks };
}

export function checkGraph(graph) {
  const checks = [];
  let score = 20; /* base */

  if (!graph || graph.nodes.length === 0) {
    checks.push({
      ...severity("Grafo arquitectónico vacío — no hay nodos detectados", SEVERITY.WARNING),
      pass: false,
      fix: "Crear src/features/ con al menos un feature",
    });
    return { score: 0, checks };
  }

  checks.push({
    ...severity(`Grafo arquitectónico: ${graph.stats.totalNodes} nodos, ${graph.stats.totalEdges} edges`, SEVERITY.INFO),
    pass: true,
  });

  for (const v of graph.violations) {
    const sev = v.severity === "CRITICAL" ? SEVERITY.CRITICAL
      : v.severity === "ERROR" ? SEVERITY.ERROR
      : SEVERITY.WARNING;

    const penalty = v.severity === "CRITICAL" ? -5
      : v.severity === "ERROR" ? -3
      : -1;

    checks.push({
      severity: sev,
      label: `[${v.rule}] ${v.description}`,
      pass: false,
      detail: `${v.from} → ${v.to}${v.file ? ` (${v.file})` : ""}`,
      fix: v.rule === "R1" ? "Core no debe importar de features. Mover la lógica a shared."
        : v.rule === "R2" ? "Domain no puede importar infraestructura. Extraer interfaz y usar adapter."
        : v.rule === "R3" ? "Feature no accede infraestructura directamente. Crear adapter en el feature."
        : v.rule === "R4" ? "Feature no importa otro feature directamente. Inyectar interfaz."
        : v.rule === "R5" ? "Romper el ciclo de dependencias extrayendo interfaz común a shared/."
        : "Revisar la dirección de la dependencia",
    });
    score += penalty;
  }

  if (graph.stats.hasCycles) {
    checks.push({
      ...severity("Ciclo de dependencias detectado entre features", SEVERITY.ERROR),
      pass: false,
      fix: "Extraer interfaz compartida a shared/ y romper el ciclo",
    });
    score -= 3;
  }

  if (graph.stats.health === "healthy") {
    checks.push({
      ...severity("Grafo arquitectónico saludable — sin violaciones", SEVERITY.INFO),
      pass: true,
    });
  }

  return { score: Math.max(score, 0), checks };
}

export function checkOwnership(ctx) {
  const checks = [];
  let score = 0;
  const report = ctx.ownership || buildOwnershipReport();

  if (report.health === "healthy") {
    checks.push({ ...severity("Ownership saludable — sin huérfanos ni duplicados", SEVERITY.INFO), pass: true });
    score += 8;
  } else if (report.health === "degraded") {
    checks.push({ ...severity("Ownership degradado — hay componentes huérfanos o duplicados", SEVERITY.WARNING), pass: false, fix: "Revisar el reporte de ownership y mover componentes a su capa correcta" });
    score += 4;
  } else {
    checks.push({ ...severity("Ownership crítico — múltiples problemas de organización", SEVERITY.ERROR), pass: false, fix: "Ejecutar node .opencode/skills/forge/scripts/armorer.mjs para diagnóstico completo" });
  }

  if (report.orphans.length === 0) {
    checks.push({ ...severity("Sin componentes huérfanos", SEVERITY.INFO), pass: true });
    score += 3;
  } else {
    checks.push({ ...severity(`${report.orphans.length} componente(s) huérfano(s)`, SEVERITY.WARNING), pass: false, detail: report.orphans.map(o => o.path).join(", "), fix: "Mover cada componente a platform/, shared/, infra/ o features/" });
  }

  if (report.duplicates.length === 0) {
    checks.push({ ...severity("Sin componentes duplicados entre capas", SEVERITY.INFO), pass: true });
    score += 3;
  } else {
    checks.push({ ...severity(`${report.duplicates.length} componente(s) duplicado(s)`, SEVERITY.WARNING), pass: false, detail: report.duplicates.map(d => `${d.name} en [${d.layers.join(", ")}]`).join("; "), fix: "Unificar el componente en una sola capa" });
  }

  if (report.misplaced.length === 0) {
    checks.push({ ...severity("Sin componentes mal ubicados", SEVERITY.INFO), pass: true });
    score += 3;
  } else {
    checks.push({ ...severity(`${report.misplaced.length} componente(s) mal ubicado(s)`, SEVERITY.WARNING), pass: false, detail: report.misplaced.slice(0, 3).map(m => m.file).join(", "), fix: "Revisar sugerencias de reubicación en armorer" });
  }

  if (report.hasPlatform) {
    checks.push({ ...severity("Platform layer presente", SEVERITY.INFO), pass: true });
    score += 3;
  } else {
    checks.push({ ...severity("Platform layer ausente", SEVERITY.SUGGESTION), pass: false, fix: "Considerar crear src/platform/ con los componentes técnicos globales" });
  }

  return { score: Math.min(score, 20), checks };
}

export function checkPlatform(ctx) {
  const checks = [];
  let score = 0;

  if (!ctx.platform || !ctx.platform.exists) {
    checks.push({ ...severity("Platform layer no existe", SEVERITY.WARNING), pass: false, fix: "Crear src/platform/ con los componentes base del sistema" });
    return { score: 0, checks };
  }

  checks.push({ ...severity("Platform layer existe", SEVERITY.INFO), pass: true });
  score += 2;

  const expected = ["config", "database", "http", "server", "logger", "di"];
  const found = new Set((ctx.platform.components || []).map(c => c.replace(/\.(ts|js)$/, "")));

  for (const comp of expected) {
    if (found.has(comp)) {
      checks.push({ ...severity(`platform/${comp}/ existe`, SEVERITY.INFO), pass: true });
      score += 2;
    } else {
      const isCritical = comp === "config" || comp === "server";
      checks.push({
        ...severity(`platform/${comp}/ no existe`, isCritical ? SEVERITY.WARNING : SEVERITY.SUGGESTION),
        pass: false,
        fix: `Crear src/platform/${comp}/`,
      });
    }
  }

  return { score: Math.min(score, 15), checks };
}

export function checkDependencies(ctx) {
  const checks = [];
  let score = 0;
  const graph = ctx.graph || buildGraph();

  if (!graph || graph.nodes.length === 0) {
    checks.push({ ...severity("No hay nodos en el grafo para analizar dependencias", SEVERITY.WARNING), pass: false });
    return { score: 0, checks };
  }

  const allowedCount = graph.edges.filter(e => e.type !== "violates").length;
  const totalCount = graph.edges.length;
  const health = totalCount > 0 ? Math.round((allowedCount / totalCount) * 100) : 100;

  checks.push({ ...severity(`Dependency Health: ${health}% (${allowedCount}/${totalCount} edges válidos)`, SEVERITY.INFO), pass: true });
  score += 4;

  if (graph.stats.criticalViolations === 0) {
    checks.push({ ...severity("Sin violaciones CRITICAL en dependencias", SEVERITY.INFO), pass: true });
    score += 4;
  } else {
    checks.push({ ...severity(`${graph.stats.criticalViolations} violación(es) CRITICAL`, SEVERITY.CRITICAL), pass: false, fix: "Corregir violaciones de reglas R1, R2, R5, R6" });
  }

  if (graph.stats.errorViolations === 0) {
    checks.push({ ...severity("Sin violaciones ERROR en dependencias", SEVERITY.INFO), pass: true });
    score += 4;
  } else {
    checks.push({ ...severity(`${graph.stats.errorViolations} violación(es) ERROR`, SEVERITY.ERROR), pass: false, fix: "Corregir violaciones de reglas R3, R4, R8, R9" });
  }

  if (graph.stats.riskScore === 0) {
    checks.push({ ...severity("Risk Score 0 — sin riesgo estructural", SEVERITY.INFO), pass: true });
    score += 3;
  } else {
    checks.push({ ...severity(`Risk Score: ${graph.stats.riskScore}/100`, graph.stats.riskScore > 30 ? SEVERITY.ERROR : SEVERITY.WARNING), pass: false, fix: "Reducir violaciones arquitectónicas para bajar el risk score" });
  }

  return { score: Math.min(score, 15), checks };
}

// ── Custom rules (B2) ──

const CUSTOM_RULES_PATH = join(ROOT, ".forge", "rules.json");

export function loadCustomRules() {
  try {
    const raw = readFileSync(CUSTOM_RULES_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function checkCustomRules(features) {
  const rules = loadCustomRules();
  const checks = [];
  let score = 0;

  if (rules.length === 0) {
    checks.push({ severity: SEVERITY.INFO, label: "Reglas custom: vacío (usa .forge/rules.json)", pass: true });
    score += 5;
    return { score, checks };
  }

  let totalPatterns = 0;
  let violations = 0;

  for (const rule of rules) {
    if (!rule.id || !rule.pattern) continue;
    totalPatterns++;

    let fileRe = null;
    let contentRe = null;
    try {
      if (rule.files) fileRe = new RegExp(rule.files);
      contentRe = new RegExp(rule.pattern);
    } catch {
      checks.push({ severity: SEVERITY.ERROR, label: `Regla custom ${rule.id}: patrón inválido`, pass: false });
      continue;
    }

    for (const feat of features) {
      if (!feat.files) continue;
      for (const f of feat.files) {
        if (fileRe && !fileRe.test(f)) continue;
        const content = read(f);
        if (!content) continue;

        contentRe.lastIndex = 0;
        let match;
        while ((match = contentRe.exec(content)) !== null) {
          violations++;
          const line = content.slice(0, match.index).split("\n").length;
          checks.push({
            severity: rule.severity || SEVERITY.ERROR,
            label: `[${rule.id}] ${rule.message || "Violación de regla custom"} en ${relative(ROOT, f)}:${line}`,
            pass: false,
            detail: `Match: "${match[0].slice(0, 80)}"`,
            fix: rule.fix || null,
          });
        }
      }
    }
  }

  if (totalPatterns > 0 && violations === 0) {
    checks.push({ severity: SEVERITY.INFO, label: `Reglas custom: ${totalPatterns} patrón(es) activo(s), 0 violaciones`, pass: true });
    score += 5;
  } else if (totalPatterns > 0) {
    checks.push({ severity: SEVERITY.WARNING, label: `Reglas custom: ${totalPatterns} patrón(es), ${violations} violación(es)`, pass: violations === 0 });
  }

  return { score, checks };
}

export function checkNaming(projectRoot = ROOT) {
  const checks = [];
  let score = 10;

  const violations = detectNamingViolations(projectRoot);

  if (violations.length === 0) {
    checks.push({ ...severity("Naming conventions: sin violaciones", SEVERITY.INFO), pass: true });
    return { score, checks };
  }

  checks.push({
    ...severity(`${violations.length} violacion(es) de naming conventions`, SEVERITY.WARNING),
    pass: false,
    fix: "Ejecutar `node .opencode/skills/forge/scripts/rename.mjs --all` o `forge reforge <filename>` para corregir",
  });

  for (const v of violations) {
    checks.push({
      ...severity(`Naming: ${relative(ROOT, v.current)}`, SEVERITY.SUGGESTION),
      pass: false,
      detail: `→ ${relative(ROOT, v.expected)}`,
      fix: v.rule,
    });
    score -= 1;
  }

  return { score: Math.max(score, 0), checks };
}

export function allChecks(features, graph, ctx) {
  const g = graph || buildGraph(process.cwd());
  const c = ctx || {};
  return {
    structure: checkStructure(features),
    layers: checkLayers(features),
    decorators: checkDecorators(features),
    ownership: checkOwnership(c),
    platform: checkPlatform(c),
    dependencies: checkDependencies(c),
    graph: checkGraph(g),
    customRules: checkCustomRules(features),
    naming: checkNaming(),
  };
}

// ── Auto-Fix ──

/**
 * Apply auto-fixes for non-CRITICAL violations.
 * Returns { fixed: number, skipped: number, details: string[] }
 */
export function applyFixes(checks, projectRoot = ROOT) {
  let fixed = 0;
  let skipped = 0;
  const details = [];
  const SRC = join(projectRoot, "src");

  for (const check of checks) {
    if (check.pass) continue;
    if (check.severity === "CRITICAL") {
      skipped++;
      continue;
    }

    // Fix missing @injectable()
    if (check.fix?.startsWith("Agregar @injectable()") && check.detail) {
      const filePath = check.detail.includes(":")
        ? join(projectRoot, check.detail.split(":")[0])
        : null;
      if (filePath && existsSync(filePath)) {
        const content = readFileSync(filePath, "utf-8");
        const className = check.detail.replace(/.*\//, "").replace(/\.[jt]s/, "");
        const newContent = content.replace(
          /(export\s+class\s+\w+)/,
          "@injectable()\n$1"
        );
        if (newContent !== content) {
          writeFileSync(filePath, newContent);
          fixed++;
          details.push(`  ${GREEN}✔${RESET} ${relative(projectRoot, filePath)}: agregado @injectable()`);
        }
      }
    }

    // Fix missing experimentalDecorators
    if (check.fix?.includes('"experimentalDecorators"')) {
      const tsconfigPath = join(projectRoot, "tsconfig.json");
      if (existsSync(tsconfigPath)) {
        try {
          const content = readFileSync(tsconfigPath, "utf-8");
          const json = JSON.parse(content);
          json.compilerOptions = json.compilerOptions || {};
          json.compilerOptions.experimentalDecorators = true;
          json.compilerOptions.emitDecoratorMetadata = true;
          writeFileSync(tsconfigPath, JSON.stringify(json, null, 2) + "\n");
          fixed++;
          details.push(`  ${GREEN}✔${RESET} tsconfig.json: agregado experimentalDecorators / emitDecoratorMetadata`);
        } catch {}
      }
    }

    // Fix naming violations
    if (check.label.includes("Naming:") && check.detail?.includes("→")) {
      const current = join(projectRoot, check.detail.split(" →")[0].trim());
      const expected = join(projectRoot, check.detail.split("→ ")[1].trim());
      if (existsSync(current) && !existsSync(expected)) {
        try {
          const dir = join(expected, "..");
          mkdirSync(dir, { recursive: true });
          renameSync(current, expected);
          fixed++;
          details.push(`  ${GREEN}✔${RESET} Renombrado: ${relative(projectRoot, current)} → ${relative(projectRoot, expected)}`);
        } catch (e) {
          skipped++;
          details.push(`  ${YELLOW}⚠${RESET} No se pudo renombrar: ${e.message}`);
        }
      }
    }

    // Fix container.resolve()
    if (check.fix?.includes("container.resolve") && check.detail) {
      const filePath = join(projectRoot, check.detail);
      if (existsSync(filePath)) {
        const content = readFileSync(filePath, "utf-8");
        const newContent = content
          .replace(/container\.resolve\([^)]+\)/g, "/* DI: injected via constructor */ null")
          .replace(/import.*container.*from.*tsyringe.*/g, "// container resolve removed");
        if (newContent !== content) {
          writeFileSync(filePath, newContent);
          fixed++;
          details.push(`  ${GREEN}✔${RESET} ${relative(projectRoot, filePath)}: container.resolve() reemplazado`);
        }
      }
    }

    // Fix missing reflect-metadata import
    if (check.fix?.includes('import "reflect-metadata"') && check.detail) {
      const filePath = join(projectRoot, check.detail);
      if (existsSync(filePath)) {
        const content = readFileSync(filePath, "utf-8");
        if (!content.includes('import "reflect-metadata"')) {
          writeFileSync(filePath, 'import "reflect-metadata";\n' + content);
          fixed++;
          details.push(`  ${GREEN}✔${RESET} ${relative(projectRoot, filePath)}: agregado import reflect-metadata`);
        }
      }
    }
  }

  return { fixed, skipped, details };
}

/* ── CLI ── */
async function main() {
  const args = process.argv.slice(2);
  const filterType = args.includes("--type") ? args[args.indexOf("--type") + 1] : null;
  const filterSeverity = args.includes("--severity") ? args[args.indexOf("--severity") + 1] : null;
  const format = args.includes("--json") ? "json" : "text";
  const doFix = args.includes("--fix");
  const showIgnores = args.includes("--show-ignores");

  const { buildContext } = await import("./context.mjs");
  const ctx = await buildContext();
  const features = detectFeaturesOnSrc();
  const graph = buildGraph(ROOT);
  const results = allChecks(features, graph, ctx);

  // Load inline ignores
  const allIgnores = loadAllInlineIgnores(join(ROOT, "src"));

  let all = [];
  for (const [, cat] of Object.entries(results)) {
    all = all.concat(cat.checks);
  }

  // Filter out ignored violations
  const filtered = all.filter(c => {
    if (c.pass) return true;
    if (isIgnored(c, allIgnores)) return false;
    return true;
  });

  if (filterSeverity) all = all.filter((c) => c.severity === filterSeverity);

  if (doFix) {
    const result = applyFixes(filtered);
    console.log(`\n${BOLD}Auto-Fix${RESET}`);
    if (result.fixed > 0) {
      result.details.forEach(d => console.log(d));
      console.log(`\n${GREEN}✔${RESET} ${result.fixed} violación(es) corregidas automáticamente`);
    } else {
      console.log(` ${GRAY}No se encontraron violaciones auto-corregibles${RESET}`);
    }
    if (result.skipped > 0) {
      console.log(` ${YELLOW}⚠${RESET} ${result.skipped} violación(es) CRITICAL no se auto-corrigieron (requieren intervención manual)`);
    }
    console.log();
    return;
  }

  // Show inline ignores summary
  let totalIgnores = 0;
  for (const [, fileIgnores] of allIgnores) {
    for (const [, rules] of Object.entries(fileIgnores)) {
      totalIgnores += rules.size;
    }
  }
  const ignoredCount = all.length - filtered.length;

  if (format === "json") {
    console.log(JSON.stringify({
      checks: filtered,
      total: filtered.length,
      ignoredCount,
      inlineIgnores: totalIgnores,
    }, null, 2));
  } else {
    if (showIgnores && totalIgnores > 0) {
      console.log(`\n${BOLD}Inline Ignores${RESET}`);
      console.log(`  ${totalIgnores} ignore(s) en ${allIgnores.size} archivo(s)`);
      for (const [file, lines] of allIgnores) {
        for (const [line, rules] of Object.entries(lines)) {
          console.log(`  ${GRAY}${relative(ROOT, file)}:${line}${RESET} → ${[...rules].join(", ")}`);
        }
      }
      console.log();
    }

    for (const c of filtered) {
      console.log(formatCheck(c));
    }
    console.log(`\nTotal: ${filtered.length} checks${ignoredCount > 0 ? ` (${ignoredCount} ignorados inline)` : ""}`);
  }
}

if (process.argv[1] && (process.argv[1].endsWith("detect.mjs") || process.argv[1].endsWith("detect.js"))) {
  main().catch(console.error);
}
