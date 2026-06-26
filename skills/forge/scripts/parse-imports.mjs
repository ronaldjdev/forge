#!/usr/bin/env node

/**
 * Shared import parser for Forge.
 * Uses @typescript-eslint/parser (AST) when available, falls back to regex.
 * Handles imports, re-exports, dynamic imports, type-only imports, barrel exports.
 */

import { existsSync } from "fs";
import { join, dirname } from "path";
import { createRequire } from "module";

const ROOT = process.cwd();

// ── AST Parser (try to load from project or skill node_modules) ──
let tsParser = null;

function tryLoadTSParser() {
  if (tsParser !== null) return tsParser;

  const candidates = [
    join(ROOT, "node_modules", "@typescript-eslint", "parser"),
    join(dirname(new URL(import.meta.url).pathname), "..", "node_modules", "@typescript-eslint", "parser"),
  ];

  for (const dir of candidates) {
    if (existsSync(join(dir, "package.json"))) {
      try {
        const req = createRequire(dir);
        const parser = req("@typescript-eslint/parser");
        tsParser = parser;
        return parser;
      } catch {
        // fall through
      }
    }
  }

  tsParser = false; // not available
  return null;
}

function parseWithAST(content, filePath) {
  const parser = tryLoadTSParser();
  if (!parser) return null;

  try {
    const ast = parser.parse(content, {
      jsx: filePath?.endsWith(".tsx") || filePath?.endsWith(".jsx") || undefined,
      range: false,
      loc: false,
      tokens: false,
      comment: false,
      errorOnUnknownASTType: false,
    });

    const imports = [];

    for (const node of ast.body) {
      // import ... from '...'
      if (node.type === "ImportDeclaration" && node.source?.value) {
        imports.push(node.source.value);
      }
      // export { ... } from '...', export * from '...'
      if (
        (node.type === "ExportNamedDeclaration" || node.type === "ExportAllDeclaration") &&
        node.source?.value
      ) {
        imports.push(node.source.value);
      }
    }

    // Dynamic imports — walk the tree
    function walk(node) {
      if (!node || typeof node !== "object") return;
      if (Array.isArray(node)) {
        for (const child of node) walk(child);
        return;
      }

      // ImportExpression (import('...'))
      if (node.type === "ImportExpression" && node.source?.value) {
        imports.push(node.source.value);
      }

      // Legacy CallExpression dynamic import
      if (node.type === "CallExpression" && node.callee?.name === "import" && node.arguments?.[0]?.value) {
        imports.push(node.arguments[0].value);
      }

      for (const key of Object.keys(node)) {
        walk(node[key]);
      }
    }

    walk(ast);

    return [...new Set(imports)];
  } catch {
    return null;
  }
}

function parseWithASTWithLines(content, filePath) {
  const parser = tryLoadTSParser();
  if (!parser) return null;

  try {
    const ast = parser.parse(content, {
      jsx: filePath?.endsWith(".tsx") || filePath?.endsWith(".jsx") || undefined,
      range: true,
      loc: true,
      tokens: false,
      comment: false,
      errorOnUnknownASTType: false,
    });

    const imports = [];

    function addSource(node, source) {
      if (source?.value && node.loc) {
        imports.push({ file: filePath, source: source.value, line: node.loc.start.line });
      }
    }

    for (const node of ast.body) {
      if (node.type === "ImportDeclaration" && node.source?.value) {
        imports.push({ file: filePath, source: node.source.value, line: node.loc.start.line });
      }
      if (node.type === "ExportNamedDeclaration" && node.source?.value) {
        imports.push({ file: filePath, source: node.source.value, line: node.loc.start.line });
      }
      if (node.type === "ExportAllDeclaration" && node.source?.value) {
        imports.push({ file: filePath, source: node.source.value, line: node.loc.start.line });
      }
    }

    function walk(node) {
      if (!node || typeof node !== "object") return;
      if (Array.isArray(node)) {
        for (const child of node) walk(child);
        return;
      }
      if (node.type === "ImportExpression" && node.source?.value && node.loc) {
        imports.push({ file: filePath, source: node.source.value, line: node.loc.start.line });
      }
      if (node.type === "CallExpression" && node.callee?.name === "import" && node.arguments?.[0]?.value && node.loc) {
        imports.push({ file: filePath, source: node.arguments[0].value, line: node.loc.start.line });
      }
      for (const key of Object.keys(node)) {
        walk(node[key]);
      }
    }
    walk(ast);

    return imports;
  } catch {
    return null;
  }
}

// ── Regex fallback (same as before) ──

const PATTERNS = [
  /import\s+(?:type\s+)?(?:\{[^}]*\}|[^;{]+?)\s+from\s+['"]([^'"]+)['"]/g,
  /export\s+(?:type\s+)?(?:\{[^}]*\}|\*)\s+from\s+['"]([^'"]+)['"]/g,
  /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  /import\s+['"]([^'"]+)['"]/g,
];

function parseWithRegex(content) {
  const imports = [];
  const seen = new Set();
  for (const re of PATTERNS) {
    re.lastIndex = 0;
    let match;
    while ((match = re.exec(content)) !== null) {
      const path = match[1];
      if (path && !seen.has(path)) {
        seen.add(path);
        imports.push(path);
      }
    }
  }
  return imports;
}

function parseWithRegexLines(content, filePath) {
  const imports = [];
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const re of PATTERNS) {
      re.lastIndex = 0;
      const matches = [...line.matchAll(re)];
      for (const m of matches) {
        const path = m[1];
        if (path) {
          imports.push({ file: filePath, source: path, line: i + 1 });
        }
      }
    }
  }
  return imports;
}

// ── Public API ──

/**
 * Parse import/export paths from source code.
 * Returns array of unique import path strings.
 * Uses AST parser when available, falls back to regex.
 */
export function parseImportPaths(content, filePath) {
  const astResult = filePath ? parseWithAST(content, filePath) : null;
  if (astResult) return astResult;
  const regexResult = parseWithAST(content); // second try without filePath hint
  if (regexResult) return regexResult;
  return parseWithRegex(content);
}

/**
 * Parse import/export statements with line numbers.
 * Returns array of { file, source, line }.
 * Uses AST parser when available, falls back to regex.
 */
export function parseImportsWithLines(content, filePath) {
  const astResult = parseWithASTWithLines(content, filePath);
  if (astResult) return astResult;
  return parseWithRegexLines(content, filePath);
}

/* ── CLI test ── */
if (process.argv[1] && process.argv[1].endsWith("parse-imports.mjs")) {
  const fs = await import("fs");
  const target = process.argv[2];
  if (!target) {
    console.error("Usage: node parse-imports.mjs <file>");
    process.exit(1);
  }
  const content = fs.readFileSync(target, "utf-8");
  const paths = parseImportPaths(content, target);
  const lines = parseImportsWithLines(content, target);
  console.log("── Import paths ──");
  for (const p of paths) console.log(`  ${p}`);
  console.log(`\n── With line numbers ──`);
  for (const l of lines) console.log(`  ${l.line}: ${l.source}`);
  console.log(`\nParser: ${tryLoadTSParser() ? "AST" : "regex (fallback)"}`);
}
