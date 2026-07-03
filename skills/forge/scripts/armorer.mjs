#!/usr/bin/env node

import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";

const ROOT = process.cwd();
const SRC = join(ROOT, "src");

const PLATFORM_DIRS = ["config", "database", "http", "server", "logger", "cache", "security", "events", "scheduler", "observability", "di"];

const INFRA_DIRS = ["prisma", "mongodb", "postgres", "redis", "mail", "s3", "cloudinary", "stripe", "sqs", "rabbitmq", "kafka", "smtp"];

const SHARED_DIRS = ["errors", "contracts", "types", "utils", "helpers", "constants", "enums"];

const OWNERSHIP = {
  platform: ["server", "http", "config", "env", "database", "logger", "cache", "security", "scheduler", "event bus", "observability", "DI"],
  features: ["auth", "users", "payments", "inventory", "orders"],
  shared: ["errors", "contracts", "utils", "types"],
  infra: ["prisma", "mongodb", "postgres", "redis", "smtp", "storage providers"],
};

function read(path) {
  try {
    return readFileSync(path, "utf-8");
  } catch {
    return null;
  }
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

function findFiles(dir, exts = [".ts", ".js", ".tsx", ".jsx"], maxDepth = 6) {
  const results = [];
  function walk(d, depth) {
    if (depth > maxDepth) return;
    try {
      for (const entry of readdirSync(d)) {
        const full = join(d, entry);
        if (statSync(full).isDirectory()) {
          walk(full, depth + 1);
        } else if (exts.length === 0 || exts.some((e) => entry.endsWith(e))) {
          results.push(full);
        }
      }
    } catch {}
  }
  if (existsSync(dir)) walk(dir, 0);
  return results;
}

function classifyPath(relPath) {
  const parts = relPath.split("/");
  if (parts.includes("platform")) return "platform";
  if (parts.includes("features")) return "feature";
  if (parts.includes("shared")) return "shared";
  if (parts.includes("infra") || parts.includes("infrastructure")) return "infra";
  if (parts.includes("core")) return "shared";
  if (parts.includes("lib")) return "shared";
  return null;
}

export function detectOrphans(projectRoot = ROOT) {
  const src = join(projectRoot, "src");
  if (!isDir(src)) return [];

  const knownLayers = new Set(["platform", "features", "shared", "infra", "infrastructure", "core", "lib"]);
  const orphans = [];

  for (const entry of listDir(src)) {
    const full = join(src, entry);
    if (!statSync(full).isDirectory()) continue;
    if (knownLayers.has(entry)) continue;
    if (entry.startsWith(".")) continue;
    orphans.push({
      path: `src/${entry}/`,
      name: entry,
      reason: "Directorio no pertenece a ningún layer arquitectónico",
      suggestion: `Mover a src/platform/, src/shared/, src/infra/ o src/features/<name>/`,
    });
  }

  return orphans;
}

export function assignOwners(projectRoot = ROOT) {
  const src = join(projectRoot, "src");
  const result = {
    platform: [],
    features: [],
    shared: [],
    infra: [],
  };

  const platformDir = join(src, "platform");
  if (isDir(platformDir)) {
    for (const dir of listDir(platformDir)) {
      if (isDir(join(platformDir, dir)) && !dir.startsWith(".")) {
        result.platform.push(dir);
      }
    }
    const platformFiles = findFiles(platformDir, [".ts", ".js"], 1);
    for (const f of platformFiles) {
      const name = f.replace(platformDir + "/", "").replace(/\.(ts|js)$/, "");
      if (!result.platform.includes(name)) {
        result.platform.push(name);
      }
    }
  }

  const featuresDir = join(src, "features");
  if (isDir(featuresDir)) {
    for (const dir of listDir(featuresDir)) {
      if (isDir(join(featuresDir, dir)) && !dir.startsWith(".")) {
        result.features.push(dir);
      }
    }
  }

  const sharedDir = join(src, "shared");
  if (isDir(sharedDir)) {
    for (const dir of listDir(sharedDir)) {
      if (isDir(join(sharedDir, dir)) && !dir.startsWith(".")) {
        result.shared.push(dir);
      }
    }
    const sharedFiles = findFiles(sharedDir, [".ts", ".js"], 1);
    for (const f of sharedFiles) {
      const name = f.replace(sharedDir + "/", "").replace(/\.(ts|js)$/, "");
      if (!result.shared.includes(name)) {
        result.shared.push(name);
      }
    }
  }

  const infraDirs = ["infra", "infrastructure"];
  for (const infraName of infraDirs) {
    const infraDir = join(src, infraName);
    if (isDir(infraDir)) {
      for (const dir of listDir(infraDir)) {
        if (isDir(join(infraDir, dir)) && !dir.startsWith(".")) {
          result.infra.push(dir);
        }
      }
      const infraFiles = findFiles(infraDir, [".ts", ".js"], 1);
      for (const f of infraFiles) {
        const name = f.replace(infraDir + "/", "").replace(/\.(ts|js)$/, "");
        if (!result.infra.includes(name)) {
          result.infra.push(name);
        }
      }
    }
  }

  return result;
}

export function detectDuplicates(ownership) {
  const duplicates = [];
  const seen = new Map();

  for (const [layer, components] of Object.entries(ownership)) {
    for (const comp of components) {
      if (seen.has(comp)) {
        duplicates.push({
          name: comp,
          layers: [seen.get(comp), layer],
        });
      } else {
        seen.set(comp, layer);
      }
    }
  }

  return duplicates;
}

export function detectMisplaced(projectRoot = ROOT) {
  const src = join(projectRoot, "src");
  if (!isDir(src)) return [];

  const misplaced = [];
  const allFiles = findFiles(src, [".ts", ".js", ".tsx", ".jsx"], 8);

  for (const file of allFiles) {
    const relPath = relative(projectRoot, file);
    const content = read(file);
    if (!content) continue;

    const platformPattern = /from\s+['"](\.\.\/)*platform\//;
    const featurePattern = /from\s+['"](\.\.\/)*features\//;
    const sharedPattern = /from\s+['"](\.\.\/)*shared\//;
    const infraPattern = /from\s+['"](\.\.\/)*infra\//;

    const isFeatureFile = relPath.includes("features/");
    const isPlatformFile = relPath.includes("platform/");
    const isSharedFile = relPath.includes("shared/");
    const isInfraFile = relPath.includes("infra/") || relPath.includes("infrastructure/");
    const isDomainFile = relPath.includes("/domain/");

    if (isDomainFile && infraPattern.test(content)) {
      misplaced.push({
        file: relPath,
        reason: "Domain importa de infraestructura — violación de DIP",
        suggestion: "Extraer interfaz en domain/ y mover implementación a infra/ o adapters/out/",
      });
    }

    if (isDomainFile && platformPattern.test(content)) {
      misplaced.push({
        file: relPath,
        reason: "Domain importa de platform — el dominio debe ser puro",
        suggestion: "Inyectar dependencia vía interfaz en lugar de importar platform directamente",
      });
    }

    if (isSharedFile && infraPattern.test(content)) {
      misplaced.push({
        file: relPath,
        reason: "Shared importa de infraestructura — shared debe ser puro",
        suggestion: "Mover código que depende de infra a un adapter o a infra/",
      });
    }

    if (isSharedFile && featurePattern.test(content)) {
      misplaced.push({
        file: relPath,
        reason: "Shared importa de features — shared no debe conocer lógica de negocio",
        suggestion: "Mover la dependencia de feature a un adapter o refactorizar",
      });
    }

    if (isFeatureFile && !relPath.includes("/adapters/") && infraPattern.test(content)) {
      misplaced.push({
        file: relPath,
        reason: "Feature importa infraestructura fuera de adapters",
        suggestion: "Envolver en un adapter dentro de features/<name>/adapters/out/",
      });
    }

    // R13: Platform con lógica de dominio
    if (isPlatformFile) {
      const basenamePath = basename(file);
      const DOMAIN_PATTERNS = /\.(entity|uc|mapper|port|repository)\.(ts|js)$/i;
      if (DOMAIN_PATTERNS.test(basenamePath)) {
        misplaced.push({
          file: relPath,
          reason: "Platform contiene artefacto de dominio — violación R13",
          suggestion: "Mover a src/features/<name>/domain/ o application/ según corresponda",
        });
      }
      const featureImportMatch = content.match(featurePattern);
      if (featureImportMatch) {
        misplaced.push({
          file: relPath,
          reason: "Platform importa de features — violación R2",
          suggestion: "Platform no debe conocer lógica de negocio. Extraer interfaz a shared/contracts/ o refactorizar.",
        });
      }
    }
  }

  return misplaced;
}

export function suggestRelocation(ownership, orphans) {
  const suggestions = [];
  const knownPlatform = new Set(PLATFORM_DIRS);
  const knownInfra = new Set(INFRA_DIRS);
  const knownShared = new Set(SHARED_DIRS);

  for (const orphan of orphans) {
    const name = orphan.name.toLowerCase();

    if (knownPlatform.has(name)) {
      suggestions.push({
        from: orphan.path,
        to: `src/platform/${name}/`,
        reason: `${name} es un componente de plataforma`,
      });
    } else if (knownInfra.has(name)) {
      suggestions.push({
        from: orphan.path,
        to: `src/infra/${name}/`,
        reason: `${name} es infraestructura`,
      });
    } else if (knownShared.has(name)) {
      suggestions.push({
        from: orphan.path,
        to: `src/shared/${name}/`,
        reason: `${name} es un componente compartido`,
      });
    } else {
      suggestions.push({
        from: orphan.path,
        to: false,
        reason: `No se pudo determinar el destino para ${name}`,
      });
    }
  }

  return suggestions;
}

export function buildOwnershipReport(projectRoot = ROOT) {
  const src = join(projectRoot, "src");

  const ownership = assignOwners(projectRoot);
  const orphans = detectOrphans(projectRoot);
  const duplicates = detectDuplicates(ownership);
  const misplaced = detectMisplaced(projectRoot);
  const relocations = suggestRelocation(ownership, orphans);

  let health = "healthy";
  let issues = 0;

  if (orphans.length > 0) issues += orphans.length * 3;
  if (duplicates.length > 0) issues += duplicates.length * 2;
  if (misplaced.length > 0) issues += misplaced.length * 2;

  if (issues > 10) health = "critical";
  else if (issues > 3) health = "degraded";

  return {
    ownership,
    orphans,
    duplicates,
    misplaced,
    relocations,
    health,
    score: Math.max(0, 100 - issues * 5),
    hasPlatform: ownership.platform.length > 0,
    hasFeatures: ownership.features.length > 0,
    hasShared: ownership.shared.length > 0,
    hasInfra: ownership.infra.length > 0,
  };
}

function printReport(report) {
  const GREEN = "\x1b[32m";
  const RED = "\x1b[31m";
  const YELLOW = "\x1b[33m";
  const BOLD = "\x1b[1m";
  const RESET = "\x1b[0m";
  const DIM = "\x1b[2m";
  const CYAN = "\x1b[36m";

  console.log(`\n${BOLD}${CYAN}  Ownership Report${RESET}`);
  console.log(`  Health: ${report.health === "healthy" ? GREEN : report.health === "degraded" ? YELLOW : RED}${report.health}${RESET} | Score: ${report.score}/100\n`);

  console.log(`  ${BOLD}Platform${RESET}`);
  if (report.ownership.platform.length > 0) {
    for (const c of report.ownership.platform) console.log(`   ${GREEN}✔${RESET} ${c}`);
  } else {
    console.log(`   ${DIM}(none detected)${RESET}`);
  }

  console.log(`\n  ${BOLD}Features${RESET}`);
  if (report.ownership.features.length > 0) {
    for (const c of report.ownership.features) console.log(`   ${GREEN}✔${RESET} ${c}`);
  } else {
    console.log(`   ${DIM}(none detected)${RESET}`);
  }

  console.log(`\n  ${BOLD}Shared${RESET}`);
  if (report.ownership.shared.length > 0) {
    for (const c of report.ownership.shared) console.log(`   ${GREEN}✔${RESET} ${c}`);
  } else {
    console.log(`   ${DIM}(none detected)${RESET}`);
  }

  console.log(`\n  ${BOLD}Infrastructure${RESET}`);
  if (report.ownership.infra.length > 0) {
    for (const c of report.ownership.infra) console.log(`   ${GREEN}✔${RESET} ${c}`);
  } else {
    console.log(`   ${DIM}(none detected)${RESET}`);
  }

  if (report.orphans.length > 0) {
    console.log(`\n  ${BOLD}${YELLOW}Orphans${RESET}`);
    for (const o of report.orphans) {
      console.log(`   ${YELLOW}⚠${RESET} ${o.path} — ${o.reason}`);
      console.log(`     ${DIM}→ ${o.suggestion}${RESET}`);
    }
  }

  if (report.duplicates.length > 0) {
    console.log(`\n  ${BOLD}${RED}Duplicates${RESET}`);
    for (const d of report.duplicates) {
      console.log(`   ${RED}✘${RESET} "${d.name}" appears in: [${d.layers.join(", ")}]`);
    }
  }

  if (report.misplaced.length > 0) {
    console.log(`\n  ${BOLD}${RED}Misplaced${RESET}`);
    for (const m of report.misplaced) {
      console.log(`   ${RED}✘${RESET} ${m.file}`);
      console.log(`     ${DIM}→ ${m.reason}${RESET}`);
      console.log(`     ${DIM}→ Fix: ${m.suggestion}${RESET}`);
    }
  }

  if (report.relocations.length > 0) {
    console.log(`\n  ${BOLD}Suggested Relocations${RESET}`);
    for (const r of report.relocations) {
      if (r.to) {
        console.log(`   ${DIM}→ Move ${r.from} → ${r.to} (${r.reason})${RESET}`);
      } else {
        console.log(`   ${DIM}→ ${r.from}: ${r.reason}${RESET}`);
      }
    }
  }

  console.log();
}

async function main() {
  const args = process.argv.slice(2);
  const format = args.includes("--json") ? "json" : "text";
  const report = buildOwnershipReport();

  if (format === "json") {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printReport(report);
  }
}

if (process.argv[1] && (process.argv[1].endsWith("armorer.mjs") || process.argv[1].endsWith("armorer.js"))) {
  main().catch(console.error);
}


