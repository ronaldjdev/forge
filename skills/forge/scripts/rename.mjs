#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, renameSync, statSync, writeFileSync } from "fs";
import { join, relative, dirname, basename, extname, parse } from "path";

const ROOT = process.cwd();
const SRC = join(ROOT, "src");

function isDir(path) { return existsSync(path) && statSync(path).isDirectory(); }

function listDir(path) { try { return readdirSync(path); } catch { return []; } }

function read(path) { try { return readFileSync(path, "utf-8"); } catch { return null; } }

function findFiles(dir, maxDepth = 8) {
  const results = [];
  function walk(d, depth) {
    if (depth > maxDepth) return;
    try {
      for (const entry of readdirSync(d)) {
        const full = join(d, entry);
        if (statSync(full).isDirectory()) {
          if (!entry.startsWith(".") && entry !== "node_modules") walk(full, depth + 1);
        } else if (/\.(ts|js)$/.test(entry) && !entry.endsWith(".d.ts")) {
          results.push(full);
        }
      }
    } catch { /* skip */ }
  }
  if (existsSync(dir)) walk(dir, 0);
  return results;
}

function toPascalCase(str) {
  return str
    .replace(/[-_]/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("");
}

function toCamelCase(str) {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function kebabToPascal(str) {
  return str.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join("");
}

// ── Naming rules per directory (from reference/patterns.md) ──

const PLATFORM_RULES = {
  config:   { defaultSuffix: "config", case: "pascal", description: "<Name>.config.ts" },
  server:   { defaultSuffix: null, case: "pascal", description: "PascalCase.ts" },
  database: { defaultSuffix: "config", case: "pascal", description: "<Name>.config.ts" },
  http:     { defaultSuffix: null, case: "pascal", description: "PascalCase.ts (Router, *middleware)" },
  logger:   { defaultSuffix: "config", allowedSuffixes: ["config", "service"], case: "pascal", description: "<Name>.config.ts / <Name>.service.ts" },
  cache:    { defaultSuffix: "config", allowedSuffixes: ["config", "service"], case: "pascal", description: "<Name>.config.ts / <Name>.service.ts" },
  security: { defaultSuffix: "middleware", allowedSuffixes: ["middleware", "service"], case: "pascal", description: "<Name>.middleware.ts / <Name>.service.ts" },
  events:   { defaultSuffix: null, case: "pascal", description: "PascalCase.ts (EventBus, EventHandler)" },
  scheduler:{ defaultSuffix: "config", allowedSuffixes: ["config", "service"], case: "pascal", description: "<Name>.config.ts / <Name>.service.ts" },
  observability: { defaultSuffix: null, case: "pascal", description: "PascalCase.ts (Metrics, Tracing, Health)" },
  di:       { defaultSuffix: null, case: "pascal", description: "PascalCase.ts (Container, Tokens, Module)" },
};

const FEATURE_SUBDIR_RULES = [
  { subdir: "domain", pattern: "entity", case: "pascal", description: "<Name>.entity.ts" },
  { subdir: "domain", pattern: "repository", prefix: "I", case: "pascal", description: "I<Name>.repository.ts" },
  { subdir: "application/use-cases", pattern: "uc", case: "pascal", description: "<Action>.uc.ts" },
  { subdir: "application/mappers", pattern: "mapper", case: "pascal", description: "<Name>.mapper.ts" },
  { subdir: "adapters/in/http", pattern: "controller", case: "pascal", description: "<Name>.controller.ts" },
  { subdir: "adapters/in/http", pattern: "routes", case: "pascal", description: "<Name>.routes.ts" },
  { subdir: "adapters/out/persistence", pattern: "repository", case: "pascal", description: "<Name>.repository.ts" },
  { subdir: "adapters/out/persistence", pattern: "schema", case: "pascal", description: "<Name>.schema.ts" },
];

const SHARED_RULES = {
  errors:    { suffix: "Error", case: "pascal", description: "<Name>Error.ts" },
  contracts: { prefix: "I", case: "pascal", description: "I<Name>.ts" },
  types:     { suffix: "types", case: "camel", description: "<name>.types.ts" },
  utils:     { case: "camel", description: "<name>.ts (camelCase)" },
};

const INFRA_RULES = {
  prisma:  { prefix: "Prisma", case: "pascal", description: "Prisma.<Name>.ts" },
  mongodb: { defaultSuffix: "config", allowedSuffixes: ["config", "model"], case: "pascal", description: "<Name>.config.ts / <Name>.model.ts" },
  redis:   { defaultSuffix: "config", allowedSuffixes: ["config", "service"], case: "pascal", description: "<Name>.config.ts / <Name>.service.ts" },
  mail:    { defaultSuffix: "config", allowedSuffixes: ["config", "service"], case: "pascal", description: "<Name>.config.ts / <Name>.service.ts" },
  s3:      { defaultSuffix: "config", allowedSuffixes: ["config", "service"], case: "pascal", description: "<Name>.config.ts / <Name>.service.ts" },
};

function isValidExtension(file) {
  return /\.(ts|js)$/.test(file) && !file.endsWith(".d.ts");
}

function getRelativePath(filePath) {
  return relative(ROOT, filePath);
}

function getStem(filename) {
  return basename(filename).replace(/\.(ts|js)$/, "");
}

function hasSuffix(stem, suffix) {
  if (!suffix) return true;
  const parts = stem.split(".");
  return parts.length > 1 && parts.slice(1).join(".") === suffix;
}

function ensureSuffix(stem, suffix) {
  if (!suffix) return stem;
  if (hasSuffix(stem, suffix)) return stem;
  return `${stem}.${suffix}`;
}

function ensurePrefix(stem, prefix) {
  if (!prefix) return stem;
  if (stem.startsWith(prefix)) return stem;
  return prefix + stem;
}

// ── Core: compute expected name for a file ──

export function computeExpectedName(filePath) {
  const relPath = getRelativePath(filePath);
  if (!relPath.startsWith("src/")) return null;

  const parts = relPath.split("/");
  const filename = parts[parts.length - 1];
  if (!isValidExtension(filename)) return null;

  const stem = getStem(filename);
  const ext = extname(filename); // .ts or .js

  // Platform layer
  if (parts[1] === "platform" && parts[2]) {
    const subdir = parts[2];
    const rule = PLATFORM_RULES[subdir];
    if (!rule) return null;

    const suffixRule = rule.allowedSuffixes || (rule.defaultSuffix ? [rule.defaultSuffix] : [null]);
    const base = toPascalCase(stem);
    const currentHasAllowedSuffix = suffixRule.some(s => s && hasSuffix(stem, s));

    let expected;
    if (currentHasAllowedSuffix) {
      const matchedSuffix = suffixRule.find(s => s && hasSuffix(stem, s));
      const rawStem = stem.replace(`.${matchedSuffix}`, "");
      const fixedStem = rule.case === "pascal" ? toPascalCase(rawStem) : toCamelCase(rawStem);
      expected = `${fixedStem}.${matchedSuffix}${ext}`;
    } else if (rule.defaultSuffix) {
      const fixedStem = rule.case === "pascal" ? toPascalCase(stem) : toCamelCase(stem);
      expected = `${fixedStem}.${rule.defaultSuffix}${ext}`;
    } else {
      expected = `${base}${ext}`;
    }

    if (expected !== filename) {
      return {
        current: join(dirname(filePath), filename),
        expected: join(dirname(filePath), expected),
        relPath: join(dirname(relPath), expected),
        rule: `platform/${subdir}: ${rule.description}`,
      };
    }
    return null;
  }

  // Feature layer
  if (parts[1] === "features" && parts[2]) {
    const featureName = parts[2];
    const entityName = kebabToPascal(featureName);
    const featureSubpath = parts.slice(3, -1).join("/");

    for (const rule of FEATURE_SUBDIR_RULES) {
      if (featureSubpath === rule.subdir || featureSubpath.startsWith(rule.subdir + "/")) {
        const stemLower = stem.toLowerCase();

        // For domain/entity: <Entity>.entity.ts
        // Entity name derived from feature dir or current filename
        if (rule.subdir === "domain" && rule.pattern === "entity") {
          let inferredEntity;
          if (hasSuffix(stem, "entity")) {
            inferredEntity = stem.replace(/\.entity$/i, "");
          } else {
            const noEntity = stem.replace(/[Ee]ntity$/, "");
            inferredEntity = noEntity || featureName;
          }
          const entityStem = toPascalCase(inferredEntity);
          const expectedName = `${entityStem}.entity${ext}`;
          if (expectedName !== filename) {
            return { current: filePath, expected: join(dirname(filePath), expectedName), relPath: join(dirname(relPath), expectedName), rule: `feature/${featureName}/domain: ${rule.description}` };
          }
        }

        // For domain/repository interface: I<Entity>.repository.ts
        if (rule.subdir === "domain" && rule.pattern === "repository") {
          const expectedStem = `I${entityName}.repository`;
          const expectedName = `${expectedStem}${ext}`;
          const currentMatches = stem === expectedStem;
          if (!currentMatches) {
            return { current: filePath, expected: join(dirname(filePath), expectedName), relPath: join(dirname(relPath), expectedName), rule: `feature/${featureName}/domain: ${rule.description}` };
          }
          return null;
        }

        // For use-cases: <Action>.uc.ts
        if (rule.subdir === "application/use-cases") {
          const expectedName = `${toPascalCase(stem)}.uc${ext}`;
          if (expectedName !== filename) {
            return { current: filePath, expected: join(dirname(filePath), expectedName), relPath: join(dirname(relPath), expectedName), rule: `feature/${featureName}/application/use-cases: ${rule.description}` };
          }
          return null;
        }

        // For mappers, controllers, routes, repositories (persistence), schemas: <Entity>.<pattern>.ts
        if (rule.subdir !== "domain") {
          const hasCorrectSuffix = hasSuffix(stem, rule.pattern);
          if (hasCorrectSuffix) {
            const rawStem = stem.replace(`.${rule.pattern}`, "");
            const fixedStem = rule.prefix === "I" ? `I${toPascalCase(rawStem.replace(/^I/, ""))}` : toPascalCase(rawStem);
            const expectedName = `${fixedStem}.${rule.pattern}${ext}`;
            if (expectedName !== filename) {
              return { current: filePath, expected: join(dirname(filePath), expectedName), relPath: join(dirname(relPath), expectedName), rule: `feature/${featureName}${rule.subdir ? "/" + rule.subdir : ""}: ${rule.description}` };
            }
          } else {
            const expectedName = rule.prefix === "I"
              ? `I${entityName}.${rule.pattern}${ext}`
              : `${entityName}.${rule.pattern}${ext}`;
            return { current: filePath, expected: join(dirname(filePath), expectedName), relPath: join(dirname(relPath), expectedName), rule: `feature/${featureName}${rule.subdir ? "/" + rule.subdir : ""}: ${rule.description}` };
          }
        }

        return null;
      }
    }

    // Check domain/ for files that look like entity/repository but don't match (loose files)
    if (featureSubpath === "domain" && !stem.includes(".")) {
      const lower = stem.toLowerCase();
      if (lower.includes("repository") || stem.startsWith("I")) {
        const expectedName = `I${entityName}.repository${ext}`;
        return { current: filePath, expected: join(dirname(filePath), expectedName), relPath: join(dirname(relPath), expectedName), rule: `feature/${featureName}/domain: I<Name>.repository.ts` };
      }
      const expectedName = `${entityName}.entity${ext}`;
      return { current: filePath, expected: join(dirname(filePath), expectedName), relPath: join(dirname(relPath), expectedName), rule: `feature/${featureName}/domain: <Name>.entity.ts` };
    }

    return null;
  }

  // Shared layer
  if (parts[1] === "shared" && parts[2]) {
    const subdir = parts[2];
    const rule = SHARED_RULES[subdir];
    if (!rule) return null;

    if (subdir === "types") {
      if (hasSuffix(stem, "types")) {
        const rawStem = stem.replace(".types", "");
        const fixedStem = toCamelCase(rawStem);
        const expectedName = `${fixedStem}.types${ext}`;
        if (expectedName !== filename) return { current: filePath, expected: join(dirname(filePath), expectedName), relPath: join(dirname(relPath), expectedName), rule: `shared/types: ${rule.description}` };
      } else {
        const fixedStem = toCamelCase(stem);
        const expectedName = `${fixedStem}.types${ext}`;
        return { current: filePath, expected: join(dirname(filePath), expectedName), relPath: join(dirname(relPath), expectedName), rule: `shared/types: ${rule.description}` };
      }
    }

    if (subdir === "errors") {
      if (hasSuffix(stem, "Error")) {
        const rawStem = stem.replace(".Error", "");
        const fixedStem = toPascalCase(rawStem);
        const expectedName = `${fixedStem}.Error${ext}`;
        if (expectedName !== filename) return { current: filePath, expected: join(dirname(filePath), expectedName), relPath: join(dirname(relPath), expectedName), rule: `shared/errors: ${rule.description}` };
      } else if (stem.endsWith("error") || stem.endsWith("Error")) {
        const rawStem = stem.replace(/error$/i, "");
        const fixedStem = toPascalCase(rawStem);
        const expectedName = `${fixedStem}Error${ext}`;
        return { current: filePath, expected: join(dirname(filePath), expectedName), relPath: join(dirname(relPath), expectedName), rule: `shared/errors: ${rule.description}` };
      } else {
        const fixedStem = toPascalCase(stem);
        const expectedName = `${fixedStem}Error${ext}`;
        return { current: filePath, expected: join(dirname(filePath), expectedName), relPath: join(dirname(relPath), expectedName), rule: `shared/errors: ${rule.description}` };
      }
    }

    if (subdir === "contracts") {
      const hasI = stem.startsWith("I");
      if (hasI) {
        const fixedStem = toPascalCase(stem);
        if (fixedStem !== stem) {
          const expectedName = `${fixedStem}${ext}`;
          return { current: filePath, expected: join(dirname(filePath), expectedName), relPath: join(dirname(relPath), expectedName), rule: `shared/contracts: ${rule.description}` };
        }
      } else {
        const expectedName = `I${toPascalCase(stem)}${ext}`;
        return { current: filePath, expected: join(dirname(filePath), expectedName), relPath: join(dirname(relPath), expectedName), rule: `shared/contracts: ${rule.description}` };
      }
    }

    if (subdir === "utils") {
      const fixedStem = toCamelCase(stem);
      if (fixedStem !== stem) {
        const expectedName = `${fixedStem}${ext}`;
        return { current: filePath, expected: join(dirname(filePath), expectedName), relPath: join(dirname(relPath), expectedName), rule: `shared/utils: ${rule.description}` };
      }
      return null;
    }

    return null;
  }

  // Infra layer
  if ((parts[1] === "infra" || parts[1] === "infrastructure") && parts[2]) {
    const subdir = parts[2];
    const rule = INFRA_RULES[subdir];
    if (!rule) return null;

    if (subdir === "prisma") {
      const hasPrisma = stem.startsWith("Prisma");
      if (hasPrisma) {
        const rawStem = stem.replace(/^Prisma/, "");
        if (rawStem.startsWith(".")) {
          const actualStem = rawStem.slice(1);
          const fixedStem = toPascalCase(actualStem);
          const expectedName = `Prisma.${fixedStem}${ext}`;
          if (expectedName !== filename) return { current: filePath, expected: join(dirname(filePath), expectedName), relPath: join(dirname(relPath), expectedName), rule: `infra/prisma: ${rule.description}` };
        } else {
          const fixedStem = toPascalCase(rawStem);
          const expectedName = `Prisma${fixedStem}${ext}`;
          if (expectedName !== filename) return { current: filePath, expected: join(dirname(filePath), expectedName), relPath: join(dirname(relPath), expectedName), rule: `infra/prisma: ${rule.description}` };
        }
      } else if (stem.includes(".")) {
        const parts2 = stem.split(".");
        const fixedStem = toPascalCase(parts2[0]);
        const suffix = parts2.slice(1).join(".");
        const expectedName = `Prisma.${fixedStem}.${suffix}${ext}`;
        return { current: filePath, expected: join(dirname(filePath), expectedName), relPath: join(dirname(relPath), expectedName), rule: `infra/prisma: ${rule.description}` };
      } else {
        const expectedName = `Prisma.${toPascalCase(stem)}${ext}`;
        return { current: filePath, expected: join(dirname(filePath), expectedName), relPath: join(dirname(relPath), expectedName), rule: `infra/prisma: ${rule.description}` };
      }
    }

    if (rule.defaultSuffix || rule.allowedSuffixes) {
      const suffixList = rule.allowedSuffixes || [rule.defaultSuffix];
      const hasAllowedSuffix = suffixList.some(s => s && hasSuffix(stem, s));
      if (hasAllowedSuffix) {
        const matched = suffixList.find(s => s && hasSuffix(stem, s));
        const rawStem = stem.replace(`.${matched}`, "");
        const fixedStem = toPascalCase(rawStem);
        const expectedName = `${fixedStem}.${matched}${ext}`;
        if (expectedName !== filename) return { current: filePath, expected: join(dirname(filePath), expectedName), relPath: join(dirname(relPath), expectedName), rule: `infra/${subdir}: ${rule.description}` };
      } else {
        const fixedStem = toPascalCase(stem);
        const expectedName = `${fixedStem}.${rule.defaultSuffix}${ext}`;
        return { current: filePath, expected: join(dirname(filePath), expectedName), relPath: join(dirname(relPath), expectedName), rule: `infra/${subdir}: ${rule.description}` };
      }
    }

    return null;
  }

  return null;
}

// ── Detect all naming violations in the project ──

export function detectNamingViolations(projectRoot = ROOT) {
  const src = join(projectRoot, "src");
  if (!isDir(src)) return [];

  const violations = [];

  // Scan features/<name>/domain/ loose files (entity/repository without subdir in name)
  const featuresDir = join(src, "features");
  if (isDir(featuresDir)) {
    for (const feat of listDir(featuresDir)) {
      if (!isDir(join(featuresDir, feat))) continue;
      const domainDir = join(featuresDir, feat, "domain");
      if (!isDir(domainDir)) continue;
      // Check for bare .ts files in domain/ that should use .entity or .repository suffix
      for (const f of listDir(domainDir)) {
        if (!isValidExtension(f)) continue;
        const fullPath = join(domainDir, f);
        const result = computeExpectedName(fullPath);
        if (result) violations.push(result);
      }
    }
  }

  // Scan all .ts/.js files in src/ (except node_modules, .d.ts)
  const allFiles = findFiles(src, 8);
  for (const file of allFiles) {
    const relPath = getRelativePath(file);
    if (relPath === file) continue; // already normalized

    // Skip barrel files
    const base = basename(file);
    if (base === "index.ts" || base === "index.js") continue;

    // Skip test files
    if (base.endsWith(".test.ts") || base.endsWith(".spec.ts") || base.endsWith(".test.js") || base.endsWith(".spec.js")) continue;

    // Skip files already checked via the feature domain loop
    if (relPath.includes("/features/") && relPath.includes("/domain/")) continue;

    const result = computeExpectedName(file);
    if (result) violations.push(result);
  }

  return violations;
}

// ── Update imports across the project after rename ──

export function updateImportsAfterRename(oldPath, newPath, projectRoot = ROOT) {
  const oldRel = relative(projectRoot, oldPath);
  const newRel = relative(projectRoot, newPath);
  const oldBase = basename(oldRel).replace(/\.(ts|js)$/, "");
  const newBase = basename(newRel).replace(/\.(ts|js)$/, "");

  // If the filename didn't change except extension, skip
  if (oldBase === newBase) return [];

  const oldDir = dirname(oldRel);
  const newDir = dirname(newRel);
  const sameDir = oldDir === newDir;

  const allFiles = findFiles(join(projectRoot, "src"), 8);
  const changes = [];

  for (const file of allFiles) {
    const content = read(file);
    if (!content) continue;

    const fileRel = relative(projectRoot, file);
    const fileDir = dirname(fileRel);
    const newContentLines = [];
    let modified = false;

    const lines = content.split("\n");
    for (const line of lines) {
      // Match import/export/require statements
      const importMatch = line.match(/(?:from\s+|require\s*\()['"]([^'"]+)['"]/);
      if (importMatch) {
        const importPath = importMatch[1];
        const newImportPath = resolveImportPath(importPath, fileDir, oldDir, oldBase, newDir, newBase, sameDir);
        if (newImportPath !== importPath) {
          newContentLines.push(line.replace(importPath, newImportPath));
          modified = true;
          continue;
        }
      }
      newContentLines.push(line);
    }

    if (modified) {
      writeFileSync(file, newContentLines.join("\n"), "utf-8");
      changes.push({ file: fileRel, changes: `imports actualizados: ${oldBase} → ${newBase}` });
    }
  }

  return changes;
}

function resolveImportPath(importPath, fileDir, oldDir, oldBase, newDir, newBase, sameDir) {
  const isRelative = importPath.startsWith("./") || importPath.startsWith("../");

  if (sameDir) {
    // If same directory, just update the filename reference
    if (isRelative) {
      const importBase = basename(importPath).replace(/\.(ts|js)$/, "");
      if (importBase === oldBase) {
        return importPath.replace(basename(importPath), newBase);
      }
    }
    return importPath;
  }

  if (!isRelative) return importPath;

  // Resolve relative path to absolute-like, check, convert back
  const resolved = resolveRelative(importPath, fileDir);
  const oldAbs = resolveRelative(`./${oldBase}`, oldDir);

  if (resolved === oldAbs || resolved.replace(/\.(ts|js)$/, "") === oldAbs.replace(/\.(ts|js)$/, "")) {
    // Compute new relative path from fileDir to newFile
    const newRelPath = computeRelativePath(fileDir, join(newDir, newBase));
    return newRelPath;
  }

  return importPath;
}

function resolveRelative(relPath, fromDir) {
  const parts = fromDir.split("/");
  const importParts = relPath.split("/");
  for (const p of importParts) {
    if (p === ".") continue;
    if (p === "..") parts.pop();
    else parts.push(p);
  }
  return parts.join("/");
}

function computeRelativePath(fromDir, toPath) {
  const fromParts = fromDir.split("/");
  const toParts = toPath.split("/");

  let i = 0;
  while (i < fromParts.length && i < toParts.length && fromParts[i] === toParts[i]) i++;

  const up = fromParts.length - i;
  const down = toParts.slice(i);

  const rel = [];
  for (let j = 0; j < up; j++) rel.push("..");
  rel.push(...down);

  return rel.join("/");
}

// ── Execute rename ──

export function renameFile(oldPath, newPath, projectRoot = ROOT) {
  if (!existsSync(oldPath)) {
    return { success: false, error: `Archivo no encontrado: ${oldPath}` };
  }

  if (oldPath === newPath) {
    return { success: true, updatedImports: [], note: "El archivo ya tiene el nombre correcto" };
  }

  // Physical rename
  try {
    renameSync(oldPath, newPath);
  } catch (err) {
    return { success: false, error: `Error al renombrar: ${err.message}` };
  }

  // Update imports
  const updatedImports = updateImportsAfterRename(oldPath, newPath, projectRoot);

  return {
    success: true,
    from: oldPath,
    to: newPath,
    updatedImports,
  };
}

// ── CLI ──

async function main() {
  const args = process.argv.slice(2);
  const format = args.includes("--json") ? "json" : "text";
  const isDryRun = args.includes("--dry-run");
  const detectOnly = args.includes("--detect");
  const allMode = args.includes("--all");
  const fileIndex = args.indexOf("--file");
  const singleFile = fileIndex !== -1 ? args[fileIndex + 1] : null;

  if (detectOnly || (!singleFile && !allMode)) {
    const violations = detectNamingViolations(ROOT);
    if (format === "json") {
      console.log(JSON.stringify({ violations, count: violations.length }, null, 2));
    } else {
      if (violations.length === 0) {
        console.log("✓ No se encontraron violaciones de naming");
        return;
      }
      console.log(`\n  Naming violations (${violations.length}):\n`);
      for (const v of violations) {
        console.log(`  [WARNING] ${relative(ROOT, v.current)}`);
        console.log(`           → ${relative(ROOT, v.expected)}`);
        console.log(`           Regla: ${v.rule}`);
        console.log();
      }
    }
    return;
  }

  if (singleFile) {
    const fullPath = join(ROOT, singleFile);
    if (!existsSync(fullPath)) {
      console.error(`Archivo no encontrado: ${singleFile}`);
      process.exit(1);
    }

    if (!isValidExtension(fullPath)) {
      console.error(`Extensión no soportada: ${fullPath}`);
      process.exit(1);
    }

    const expected = computeExpectedName(fullPath);
    if (!expected) {
      console.log(`✓ ${singleFile} ya cumple con las convenciones de naming`);
      return;
    }

    console.log(`\n  Renombrar:\n    ${relative(ROOT, expected.current)}\n    → ${relative(ROOT, expected.expected)}\n    Regla: ${expected.rule}\n`);

    if (isDryRun) {
      console.log("  (dry-run — no se realizaron cambios)\n");
      return;
    }

    const result = renameFile(expected.current, expected.expected, ROOT);
    if (!result.success) {
      console.error(`  Error: ${result.error}`);
      process.exit(1);
    }

    console.log(`  ✓ Archivo renombrado: ${basename(result.from)} → ${basename(result.to)}`);
    if (result.updatedImports.length > 0) {
      console.log(`  ✓ Imports actualizados en ${result.updatedImports.length} archivo(s):`);
      for (const c of result.updatedImports) {
        console.log(`       ${c.file}`);
      }
    } else {
      console.log(`  ✓ Sin imports que actualizar`);
    }
    console.log();
    return;
  }

  if (allMode) {
    const violations = detectNamingViolations(ROOT);
    if (violations.length === 0) {
      console.log("✓ No se encontraron violaciones de naming");
      return;
    }

    if (isDryRun) {
      console.log(`\n  Se renombrarían ${violations.length} archivo(s) (dry-run):\n`);
      for (const v of violations) {
        console.log(`  ${relative(ROOT, v.current)}`);
        console.log(`  → ${relative(ROOT, v.expected)}`);
        console.log();
      }
      return;
    }

    let successCount = 0;
    let errorCount = 0;
    for (const v of violations) {
      const result = renameFile(v.current, v.expected, ROOT);
      if (result.success) {
        successCount++;
        console.log(`  ✓ ${basename(v.current)} → ${basename(v.expected)}${result.updatedImports.length > 0 ? ` (${result.updatedImports.length} imports)` : ""}`);
      } else {
        errorCount++;
        console.log(`  ✘ ${basename(v.current)}: ${result.error}`);
      }
    }

    console.log(`\n  Resultado: ${successCount} renombrados, ${errorCount} errores\n`);
    return;
  }
}

if (process.argv[1] && (process.argv[1].endsWith("rename.mjs") || process.argv[1].endsWith("rename.js"))) {
  main().catch(console.error);
}
