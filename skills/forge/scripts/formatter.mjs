#!/usr/bin/env node

export const CYAN = "\x1b[36m";
export const GREEN = "\x1b[32m";
export const RED = "\x1b[31m";
export const YELLOW = "\x1b[33m";
export const BOLD = "\x1b[1m";
export const RESET = "\x1b[0m";
export const DIM = "\x1b[2m";
export const GRAY = "\x1b[90m";

export const SEVERITY_COLORS = {
  CRITICAL: RED,
  ERROR: RED,
  WARNING: YELLOW,
  INFO: CYAN,
  SUGGESTION: GRAY,
};

export function col(sev) {
  return SEVERITY_COLORS[sev] || RESET;
}

export function formatJson(data) {
  return JSON.stringify(data, null, 2);
}

export function formatTable(rows, columns) {
  const colWidths = columns.map((col, i) => {
    const header = col.label || col;
    const maxVal = Math.max(header.length, ...rows.map(r => String(r[col.key || col] || "").length));
    return maxVal;
  });

  const line = (parts) => {
    const inner = parts.map((p, i) => String(p).padEnd(colWidths[i])).join(" │ ");
    return ` ${inner} `;
  };

  const sep = () => "─" + colWidths.map(w => "─".repeat(w)).join("─┼─") + "─";

  const out = [];
  out.push(line(columns.map(c => c.label || c)));
  out.push(sep());
  for (const row of rows) {
    out.push(line(columns.map(c => String(row[c.key || c] ?? ""))));
  }
  return out.join("\n");
}

export function formatViolation({ severity, label, detail, fix }, _opts = {}) {
  const color = col(severity);
  const parts = [`${color}[${severity}]${RESET} ${label}`];
  if (detail) parts.push(` ${GRAY}— ${detail}${RESET}`);
  if (fix) parts.push(`\n     ${DIM}→ Fix: ${fix}${RESET}`);
  return parts.join("");
}

export function formatCheck(check, opts = {}) {
  const icon = check.pass ? `${GREEN}✔${RESET}` : `${RED}✘${RESET}`;
  const sev = check.pass ? "" : ` ${col(check.severity)}[${check.severity}]${RESET}`;
  const detail = check.detail ? ` ${GRAY}— ${check.detail}${RESET}` : "";
  let out = `   ${icon}${sev} ${check.label}${detail}`;
  if (!check.pass && check.fix && opts.showFixes !== false) {
    out += `\n     ${DIM}→ Fix: ${check.fix}${RESET}`;
  }
  return out;
}

export function scoreBar(score, max, barLen = 40) {
  const p = max > 0 ? Math.round((score / max) * barLen) : 0;
  const filled = "█".repeat(p);
  const empty = "░".repeat(barLen - p);
  const color = score >= max * 0.8 ? GREEN : score >= max * 0.5 ? YELLOW : RED;
  return `${color}${filled}${RESET}${DIM}${empty}${RESET}`;
}

export function formatReport(report, opts = {}) {
  const { total, max, categories, violations, recommendations, severityCounts } = report;
  const barLen = opts.barLen || 40;
  const pct = max > 0 ? Math.round((total / max) * 100) : 0;
  const lines = [];

  const grade = pct >= 90 ? "A" : pct >= 80 ? "B" : pct >= 65 ? "C" : pct >= 50 ? "D" : "F";
  const gradeColor = pct >= 80 ? GREEN : pct >= 50 ? YELLOW : RED;

  lines.push(`\n${BOLD}Puntaje total: ${gradeColor}${total}/${max} (${pct}%) — ${grade}${RESET}\n`);

  if (Object.keys(severityCounts || {}).length > 0) {
    lines.push(`  ${BOLD}Resumen por severidad${RESET}`);
    for (const [sev, count] of Object.entries(severityCounts)) {
      lines.push(`   ${col(sev)}${sev}${RESET}: ${count}`);
    }
    lines.push("");
  }

  for (const [key, cat] of Object.entries(categories || {})) {
    const cmax = opts.catMax?.[key] || cat.max || 10;
    const name = opts.catNames?.[key] || key;
    lines.push(`  ${BOLD}${name} (${cat.score}/${cmax})${RESET}`);
    lines.push(`  ${scoreBar(cat.score, cmax, barLen)}`);
    for (const check of cat.checks) {
      lines.push(formatCheck(check, opts));
    }
    lines.push("");
  }

  if (recommendations && recommendations.length > 0) {
    lines.push(`  ${BOLD}${YELLOW}Recomendaciones${RESET}`);
    const unique = [...new Set(recommendations)];
    unique.forEach((r, i) => lines.push(`   ${i + 1}. ${r}`));
    lines.push("");
  }

  return lines.join("\n");
}

export function printViolations(violations) {
  for (const v of violations) {
    console.log(formatViolation(v));
  }
}

if (process.argv[1]?.endsWith("formatter.mjs")) {
  const args = process.argv.slice(2);
  if (args.includes("--test")) {
    console.log(formatViolation({ severity: "ERROR", label: "Test violation", detail: "src/test.ts:42", fix: "Do something" }));
    console.log(formatCheck({ severity: "WARNING", label: "Test check", pass: false, detail: "detail", fix: "fix it" }));
    console.log(formatCheck({ severity: "INFO", label: "Passing check", pass: true }));
    console.log(scoreBar(15, 20));
    console.log(formatJson({ test: true, items: [1, 2, 3] }));
  }
}
