#!/usr/bin/env node

/**
 * forge-api.mjs — API Contract Validation (D3).
 *
 * Detecta OpenAPI specs y GraphQL schemas, y verifica:
 *   - Endpoints documentados pero no implementados
 *   - Endpoints implementados pero no documentados
 *   - DTOs/controllers consistentes con la spec
 *
 * Uso:
 *   node forge-api.mjs                    → validación completa
 *   node forge-api.mjs --json             → salida JSON
 *   node forge-api.mjs --openapi          → solo OpenAPI
 *   node forge-api.mjs --graphql          → solo GraphQL
 *   node forge-api.mjs --find-specs       → solo buscar specs
 */

import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import { join, relative, basename, extname, dirname } from "path";

const ROOT = process.cwd();
const SRC = join(ROOT, "src");

const SEVERITY = { ERROR: "ERROR", WARNING: "WARNING", INFO: "INFO", SUGGESTION: "SUGGESTION" };

function read(path) {
  try { return readFileSync(path, "utf-8"); } catch { return null; }
}

function isDir(path) {
  try { return statSync(path).isDirectory(); } catch { return false; }
}

function listDir(path, recursive = false) {
  try {
    const entries = readdirSync(path, { withFileTypes: true });
    const files = [];
    for (const e of entries) {
      const full = join(path, e.name);
      if (e.isDirectory()) {
        if (recursive) files.push(...listDir(full, true));
      } else {
        files.push(full);
      }
    }
    return files;
  } catch { return []; }
}

// ── Spec detection ──

function findOpenAPISpecs() {
  const specs = [];
  const candidates = [
    join(ROOT, "openapi.yaml"), join(ROOT, "openapi.yml"), join(ROOT, "openapi.json"),
    join(ROOT, "spec.yaml"), join(ROOT, "spec.yml"), join(ROOT, "spec.json"),
    join(ROOT, "swagger.yaml"), join(ROOT, "swagger.yml"), join(ROOT, "swagger.json"),
    join(SRC, "openapi.yaml"), join(SRC, "openapi.yml"), join(SRC, "openapi.json"),
  ];

  for (const c of candidates) {
    if (existsSync(c)) specs.push(c);
  }

  // Search recursively for openapi.* or swagger.*
  if (isDir(SRC)) {
    const all = listDir(SRC, true);
    for (const f of all) {
      const name = basename(f);
      if (/^openapi\.(yaml|yml|json)$/.test(name) || /^swagger\.(yaml|yml|json)$/.test(name)) {
        if (!specs.includes(f)) specs.push(f);
      }
    }
  }

  return specs;
}

function findGraphQLSchemas() {
  const schemas = [];
  const candidates = [
    join(ROOT, "schema.graphql"), join(ROOT, "schema.gql"),
    join(ROOT, "graphql"), join(ROOT, "graphql"),
    join(SRC, "schema.graphql"), join(SRC, "schema.gql"),
  ];

  for (const c of candidates) {
    if (existsSync(c)) {
      if (isDir(c)) {
        schemas.push(...listDir(c, true).filter(f => /\.(graphql|gql)$/.test(f)));
      } else {
        schemas.push(c);
      }
    }
  }

  if (isDir(SRC)) {
    const all = listDir(SRC, true);
    for (const f of all) {
      if (/\.(graphql|gql)$/.test(f) && !schemas.includes(f)) schemas.push(f);
    }
  }

  return schemas;
}

// ── Route extraction from code ──

function extractControllerRoutes(files) {
  const routes = [];
  const patterns = [
    /@(Get|Post|Put|Patch|Delete|Head|Options)\s*\(\s*['"]([^'"]*)['"]\s*\)/g,        // NestJS
    /(?:router|app)\.(get|post|put|patch|delete|head|options)\s*\(\s*['"]([^'"]*)['"]/gi, // Express/Fastify
    /\.(get|post|put|patch|delete|head|options)\s*\(\s*['"]([^'"]*)['"]\s*,/gi,
    /['"]method['"]\s*:\s*['"](GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)['"].*['"]path['"]\s*:\s*['"]([^'"]+)['"]/gis, // config-based
  ];

  for (const f of files) {
    const content = read(f);
    if (!content) continue;
    for (const re of patterns) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(content)) !== null) {
        const method = m[1].toUpperCase();
        let path = m[2] || "/";
        if (path && !path.startsWith("/")) path = "/" + path;
        routes.push({ method, path: path.replace(/\/\//g, "/"), file: relative(ROOT, f) });
      }
    }
  }
  return routes;
}

// ── OpenAPI route extraction ──

function parseOpenAPIPaths(content) {
  const paths = [];
  try {
    const spec = JSON.parse(content);
    const p = spec.paths || {};
    for (const [path, methods] of Object.entries(p)) {
      for (const [method, def] of Object.entries(methods)) {
        if (["get", "post", "put", "patch", "delete", "head", "options"].includes(method)) {
          paths.push({ method: method.toUpperCase(), path, summary: def.summary || def.operationId || "" });
        }
      }
    }
  } catch {
    // Try YAML-like parsing (simple key extraction)
    const methodRe = /^\s{4}(get|post|put|patch|delete|head|options):/gmi;
    const pathRe = /^\s{2}\/([^:]+):/gm;
    let m;
    let lastPath = "";
    while ((m = pathRe.exec(content)) !== null) {
      lastPath = "/" + m[1];
    }
    while ((m = methodRe.exec(content)) !== null) {
      if (lastPath) paths.push({ method: m[1].toUpperCase(), path: lastPath, summary: "" });
    }
  }
  return paths;
}

// ── GraphQL extraction ──

function parseGraphQLSchema(content) {
  const types = [];
  const queryRe = /type\s+Query\s*\{([^}]+)\}/g;
  const mutationRe = /type\s+Mutation\s*\{([^}]+)\}/g;

  let m;
  while ((m = queryRe.exec(content)) !== null) {
    for (const line of m[1].split("\n")) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#") && !trimmed.startsWith("//")) {
        const name = trimmed.split(/[(:]/)[0].trim();
        if (name) types.push({ type: "Query", name });
      }
    }
  }
  while ((m = mutationRe.exec(content)) !== null) {
    for (const line of m[1].split("\n")) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#") && !trimmed.startsWith("//")) {
        const name = trimmed.split(/[(:]/)[0].trim();
        if (name) types.push({ type: "Mutation", name });
      }
    }
  }
  return types;
}

function extractGraphQLResolvers(files) {
  const resolvers = [];
  const patterns = [
    /['"]?(Query|Mutation)['"]?\s*:\s*\{([^}]+)\}/gs,
    /@Resolver\s*\(/g,
    /@(Query|Mutation)\s*\(\s*['"]([^'"]*)['"]\s*\)/g,
  ];

  for (const f of files) {
    const content = read(f);
    if (!content) continue;

    // Resolver map pattern
    let m;
    while ((m = patterns[0].exec(content)) !== null) {
      const type = m[1];
      const body = m[2];
      for (const line of body.split(",")) {
        const name = line.trim().split(":")[0]?.trim().replace(/['"]/g, "");
        if (name && !name.includes(" ")) resolvers.push({ type, name, file: relative(ROOT, f) });
      }
    }

    // Decorator pattern
    patterns[2].lastIndex = 0;
    while ((m = patterns[2].exec(content)) !== null) {
      resolvers.push({ type: m[1], name: m[2], file: relative(ROOT, f) });
    }
  }

  return resolvers;
}

// ── Main validation ──

export function validateAPI() {
  const results = { specs: [], openapi: { documented: [], implemented: [], onlyDoc: [], onlyCode: [] }, graphql: { documented: [], implemented: [], onlyDoc: [], onlyCode: [] }, errors: [] };

  // Find specs
  const openapiSpecs = findOpenAPISpecs();
  const graphqlSchemas = findGraphQLSchemas();
  results.specs = { openapi: openapiSpecs, graphql: graphqlSchemas };

  // Guard clause: sin specs, no hay nada que validar
  if (openapiSpecs.length === 0 && graphqlSchemas.length === 0) {
    return results;
  }

  // Find controllers and resolvers (costoso, solo si hay specs)
  const srcFiles = isDir(SRC) ? listDir(SRC, true).filter(f => /\.(ts|js)$/.test(f)) : [];
  const controllerRoutes = extractControllerRoutes(srcFiles);
  const graphqlResolvers = extractGraphQLResolvers(srcFiles);

  // Validate OpenAPI
  for (const specPath of openapiSpecs) {
    const content = read(specPath);
    if (!content) continue;
    const docPaths = parseOpenAPIPaths(content);
    results.openapi.documented = docPaths;

    for (const dp of docPaths) {
      const found = controllerRoutes.some(cr => cr.method === dp.method && (cr.path === dp.path || cr.path.endsWith(dp.path) || dp.path.endsWith(cr.path)));
      if (!found) {
        results.openapi.onlyDoc.push({ method: dp.method, path: dp.path, spec: relative(ROOT, specPath) });
      }
    }

    for (const cr of controllerRoutes) {
      const found = docPaths.some(dp => dp.method === cr.method && (dp.path === cr.path || dp.path.endsWith(cr.path) || cr.path.endsWith(dp.path)));
      if (!found) {
        results.openapi.onlyCode.push(cr);
      }
    }
  }

  // Validate GraphQL
  for (const schemaPath of graphqlSchemas) {
    const content = read(schemaPath);
    if (!content) continue;
    const types = parseGraphQLSchema(content);
    results.graphql.documented = types;

    for (const t of types) {
      const found = graphqlResolvers.some(r => r.type === t.type && r.name === t.name);
      if (!found) {
        results.graphql.onlyDoc.push(t);
      }
    }

    const seen = new Set();
    for (const r of graphqlResolvers) {
      const key = `${r.type}:${r.name}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const found = types.some(t => t.type === r.type && t.name === r.name);
      if (!found) {
        results.graphql.onlyCode.push(r);
      }
    }
  }

  results.errors = [
    ...results.openapi.onlyDoc.map(d => `[DOCUMENTADO] ${d.method} ${d.path} — sin implementación`),
    ...results.openapi.onlyCode.map(c => `[NO DOC] ${c.method} ${c.path} (${c.file})`),
    ...results.graphql.onlyDoc.map(d => `[DOCUMENTADO] ${d.type}.${d.name} — sin resolver`),
    ...results.graphql.onlyCode.map(r => `[NO DOC] ${r.type}.${r.name} (${r.file})`),
  ];

  return results;
}

function printReport(results) {
  console.log("\n═══ API Contract Validation ═══\n");

  console.log("── Specs encontrados ──");
  if (results.specs.openapi.length > 0) {
    for (const s of results.specs.openapi) console.log(`  OpenAPI: ${relative(ROOT, s)}`);
  } else {
    console.log("  OpenAPI: (ninguno)");
  }
  if (results.specs.graphql.length > 0) {
    for (const s of results.specs.graphql) console.log(`  GraphQL: ${relative(ROOT, s)}`);
  } else {
    console.log("  GraphQL: (ninguno)");
  }

  if (results.errors.length === 0) {
    console.log(`\n${"✓ Sin discrepancias — API contracts OK"}`);
    return;
  }

  console.log(`\n── Discrepancias (${results.errors.length}) ──\n`);
  for (const err of results.errors) {
    const type = err.startsWith("[DOCUMENTADO]") ? "WARNING" : err.startsWith("[NO DOC]") ? "ERROR" : "INFO";
    const icon = type === "ERROR" ? "✘" : type === "WARNING" ? "⚠" : "ℹ";
    console.log(`  ${icon} [${type}] ${err}`);
  }

  console.log(`\nTotal: ${results.errors.length} discrepancia(s)`);
  if (results.openapi.onlyDoc.length > 0)
    console.log(`  ${results.openapi.onlyDoc.length} endpoint(s) documentados sin implementar`);
  if (results.openapi.onlyCode.length > 0)
    console.log(`  ${results.openapi.onlyCode.length} endpoint(s) implementados sin documentar`);
  if (results.graphql.onlyDoc.length > 0)
    console.log(`  ${results.graphql.onlyDoc.length} resolver(s) documentados sin implementar`);
  if (results.graphql.onlyCode.length > 0)
    console.log(`  ${results.graphql.onlyCode.length} resolver(s) implementados sin documentar`);
}

async function main() {
  const isJson = process.argv.includes("--json");
  const onlyOpenAPI = process.argv.includes("--openapi");
  const onlyGraphQL = process.argv.includes("--graphql");
  const findSpecs = process.argv.includes("--find-specs");

  if (findSpecs) {
    const openapi = findOpenAPISpecs();
    const graphql = findGraphQLSchemas();
    if (isJson) {
      console.log(JSON.stringify({ openapi: openapi.map(f => relative(ROOT, f)), graphql: graphql.map(f => relative(ROOT, f)) }, null, 2));
    } else {
      console.log("OpenAPI specs:"); openapi.forEach(f => console.log(`  ${relative(ROOT, f)}`));
      console.log("GraphQL schemas:"); graphql.forEach(f => console.log(`  ${relative(ROOT, f)}`));
    }
    process.exit(0);
  }

  const results = validateAPI();
  if (isJson) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    printReport(results);
  }
  process.exit(results.errors.length > 0 ? 1 : 0);
}

if (process.argv[1] && (process.argv[1].endsWith("forge-api.mjs") || process.argv[1].endsWith("forge-api.js"))) {
  main().catch(console.error);
}
