#!/usr/bin/env node

/**
 * assay.mjs — Ensayo arquitectónico multi-persona.
 *
 * Lee el último reporte de inspect (score, violaciones, grafo, contexto)
 * y genera un ensayo estructurado desde la perspectiva de 5 personas
 * expertas en arquitectura backend.
 *
 * Uso:
 *   node assay.mjs                     → ensayo completo (modo texto)
 *   node assay.mjs --json              → salida JSON
 *   node assay.mjs --persona=bezos     → solo una persona
 *   node assay.mjs --last              → re-generar desde último estado
 *   node assay.mjs --save              → persistir en .forge/assay/latest.md
 *   node assay.mjs history             → mostrar historial de ensayos
 */

import { readFileSync, existsSync, mkdirSync, writeFileSync, readdirSync } from "fs";
import { join, basename } from "path";
import { loadState, loadHistory } from "./forge-config.mjs";
import { getGraph } from "./graph.mjs";
import {
  CYAN, GREEN, RED, YELLOW, BOLD, RESET, DIM, GRAY,
  formatJson, formatViolation,
} from "./formatter.mjs";

const ROOT = process.cwd();
const ASSAY_DIR = join(ROOT, ".forge", "assay");

// ── Personas ──

const PERSONAS = [
  {
    id: "bezos",
    name: "Jeff Bezos",
    role: "Arquitecto de Escalabilidad y Autonomía",
    focus: [
      "Acoplamiento entre features (R8) y entre capas (R1-R7)",
      "Autonomía de equipos para evolucionar features independientemente",
      "Contratos de API explícitos vs imports directos",
      "Ciclos de dependencias (R9) que impiden despliegue independiente",
    ],
    style: "Directo, obsesionado con desacoplamiento, citando el API Mandate.",
    getOpinion: (report, graph) => {
      const parts = [];
      const violations = report.violations || [];
      const r1 = violations.filter(v => v.rule === "R1" || v.label?.includes("R1"));
      const r8 = violations.filter(v => v.rule === "R8" || v.label?.includes("R8"));
      const r9 = violations.filter(v => v.rule === "R9" || v.label?.includes("R9"));
      const cycles = graph?.stats?.hasCycles;

      if (cycles || r9.length > 0) {
        parts.push("Hay ciclos de dependencias. Esto es inaceptable. Un equipo no puede desplegar su feature sin coordinar con otros. Rompan el ciclo ahora.");
      }
      if (r8.length > 0) {
        parts.push(`${r8.length} feature(s) importan directamente a otros features. Cada equipo debería poder desarrollar y desplegar su feature sin conocer los internos de los demás. Si necesitan comunicarse, que sea por contratos (interfaces) o eventos, no por imports directos. Es como si un equipo de Amazon tuviera que leer el código fuente de otro equipo para llamar a su servicio.`);
      }
      if (r1.length > 0) {
        parts.push(`${r1.length} feature(s) importan infraestructura directamente. Esto los ata a implementaciones concretas. Un cambio de base de datos no debería requiring cambios en múltiples features.`);
      }

      if (parts.length === 0) {
        if (report.total > 0) {
          parts.push(`La arquitectura tiene un score de ${report.total}/${report.max}. No hay violaciones graves de acoplamiento, pero siempre se puede mejorar la autonomía de los equipos.`);
        } else {
          parts.push("No hay datos de auditoría para evaluar. Ejecuten forge inspect primero.");
        }
      }

      return parts.join("\n\n");
    },
  },

  {
    id: "fowler",
    name: "Martin Fowler",
    role: "Refinador de Patrones y Deuda Técnica",
    focus: [
      "Health del grafo arquitectónico y dirección de dependencias",
      "Code smells en estructura de capas (domain importa infra, etc.)",
      "Coherencia en naming y convenciones",
      "Oportunidades de refactoring evolutivo",
    ],
    style: "Analítico, cita patrones, sugiere refactorings incrementales sin reescrituras.",
    getOpinion: (report, graph) => {
      const parts = [];
      const violations = report.violations || [];
      const naming = violations.filter(v => v.category === "naming" || v.label?.includes("Naming"));
      const layers = violations.filter(v => v.category === "layers");
      const platform = violations.filter(v => v.category === "platform");
      const deps = violations.filter(v => v.category === "dependencies");

      if (naming.length > 0) {
        parts.push(`Encontré ${naming.length} violaciones de naming. El naming consistente es la forma más barata de reducir la fricción cognitiva en un código base. Sugiero corregirlas de a una por feature, no todas a la vez.`);
      }
      if (layers.length > 0) {
        const layerIssues = layers.filter(l => !l.pass);
        parts.push(`${layerIssues.length} problema(s) en la estructura de capas. Recuerden: la dirección de las dependencias es el esqueleto de la arquitectura. Si domain importa infra, han perdido la batalla antes de empezar.`);
      }
      if (platform.length > 0 && !platform[0]?.pass) {
        parts.push("La capa platform está ausente o incompleta. Sin una base técnica compartida, cada feature terminará reinventando la misma infraestructura. No necesitan todos los componentes de golpe — empiecen con config y logger, y evolucionen desde ahí.");
      }
      if (deps.length > 0) {
        const depIssues = deps.filter(d => !d.pass);
        parts.push(`La salud de dependencias tiene ${depIssues.length} issue(s). Un dependency health score bajo es una señal temprana de que el sistema se está petrificando. Abordenlo temprano, el costo de corregir dependencias mal dirigidas crece exponencialmente.`);
      }

      if (parts.length === 0) {
        parts.push("La estructura de capas se ve razonable. Sigan prestando atención a la dirección de las dependencias en cada nuevo feature.");
      }

      return parts.join("\n\n");
    },
  },

  {
    id: "hacker",
    name: "El Hacker",
    role: "Pragmático y Simplificador",
    focus: [
      "Over-engineering y complejidad innecesaria",
      "Abstracciones que no agregan valor",
      "Costo de mantenimiento vs beneficio",
      "Lo que realmente importa para que el sistema funcione",
    ],
    style: "Directo, irreverente, sin paciencia para capas vacías o arquitectura por la arquitectura misma.",
    getOpinion: (report, graph) => {
      const parts = [];
      const violations = report.violations || [];
      const structure = violations.filter(v => v.category === "structure");
      const decorators = violations.filter(v => v.category === "decorators");

      // Check for empty features / over-engineered structure
      if (structure.some(s => !s.pass && s.label?.includes("domain/"))) {
        parts.push("Veo features con estructura pero sin implementación real. Tener las carpetitas ordenadas no es arquitectura. Si un feature tiene domain/ pero ninguna entidad con lógica de negocio, es humo. Prefiero un monolito bien escrito que 20 microservicios vacíos.");
      }

      if (decorators.some(d => !d.pass && d.label?.includes("@injectable"))) {
        parts.push(`Faltan decoradores @injectable() en algunos archivos. Si van a usar DI, úsenla bien. Si no, tal vez pregúntense si realmente necesitan tsyringe para este proyecto. Para proyectos pequeños, un simple contenedor manual basta.`);
      }

      const r9 = violations.filter(v => v.rule === "R9" || v.label?.includes("R9"));
      if (r9.length > 0) {
        parts.push("Ciclos de dependencias. Esto es una señal de que están forcejeando contra la arquitectura en lugar de dejarla fluir. A veces la solución más simple es fusionar los dos features en uno en lugar de crear interfaces rebuscadas para romper el ciclo.");
      }

      if (parts.length === 0) {
        parts.push("No veo sobre-ingeniería evidente. El sistema parece proporcionado. Pero recuerden: la mejor arquitectura es la que pueden cambiar sin miedo.");
      }

      return parts.join("\n\n");
    },
  },

  {
    id: "pm",
    name: "Alex",
    role: "Product Manager Técnico",
    focus: [
      "Velocidad de entrega de features",
      "Costo de oportunidad de la deuda técnica",
      "Impacto en el roadmap",
      "Riesgo de no entregar a tiempo por rigidez arquitectónica",
    ],
    style: "Orientado a resultados, traduce violaciones técnicas a riesgos de negocio. Corta cuando algo no suma valor al usuario.",
    getOpinion: (report, graph) => {
      const parts = [];
      const violations = report.violations || [];
      const critical = violations.filter(v => v.severity === "CRITICAL");
      const errors = violations.filter(v => v.severity === "ERROR");

      if (critical.length > 0) {
        parts.push(`Hay ${critical.length} violación(es) CRITICAL. Esto es un bloqueador de productividad. Cada día que estas violaciones persisten, los equipos pierden tiempo en workarounds en lugar de construir valor para el usuario. Mi recomendación: dedicar un sprint a resolverlas. El ROI es inmediato.`);
      } else if (errors.length > 0) {
        parts.push(`${errors.length} violación(es) ERROR. No bloquean el desarrollo hoy, pero van a ralentizar al equipo en 3-6 meses. La deuda técnica es como la deuda financiera: los intereses se acumulan. Sugiero asignar 1 día por sprint para reducción de deuda técnica.`);
      }

      const score = report.total || 0;
      const maxScore = report.max || 140;
      const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

      if (pct < 50) {
        parts.push(`Score actual: ${pct}% (${report.grade || "F"}). Honestamente, esto no es sostenible. Si la arquitectura sigue así, el time-to-market de los próximos features se va a duplicar. Mi voto es que prioricen refactor ahora, antes de que el próximo gran feature dependa de esta base.`);
      } else if (pct >= 80) {
        parts.push(`Score: ${pct}% (${report.grade || "A/B"}). La arquitectura está en buena forma. El equipo puede enfocarse en entregar valor sin preocuparse por la base técnica. Solo mantengan las revisiones periódicas.`);
      } else {
        parts.push(`Score: ${pct}% (${report.grade || "C/D"}). Zona de atención. No es crítica, pero si ignoran esto, en 2-3 sprints van a empezar a sentir la fricción. Mi consejo: incluyan 1 o 2 de las recomendaciones en el próximo sprint.`);
      }

      const featCount = report.context?.features?.total || 0;
      if (featCount === 0) {
        parts.push("El proyecto no tiene features migrados. ¿Deberíamos preguntarnos si la arquitectura actual nos está frenando más de lo que nos ayuda? A veces la deuda técnica de una migración no justifica el beneficio.");
      }

      return parts.join("\n\n");
    },
  },

  {
    id: "senior",
    name: "Dra. Carter",
    role: "Arquitecta Senior — Deuda Técnica y Gobernanza",
    focus: [
      "Sostenibilidad arquitectónica a largo plazo (3-5 años)",
      "Consistencia entre equipos y features",
      "Evolución del grafo arquitectónico en el tiempo",
      "Gobernanza: reglas, ownership, y cumplimiento",
    ],
    style: "Sistemática, piensa en horizontes de 3-5 años, lee el grafo como un mapa de salud organizacional.",
    getOpinion: (report, graph) => {
      const parts = [];
      const violations = report.violations || [];
      const ownership = violations.filter(v => v.category === "ownership");
      const rules = violations.filter(v => v.category === "customRules");

      // Analyze graph health
      if (graph) {
        const dh = graph.stats?.dependencyHealth;
        if (dh !== undefined && dh < 70) {
          parts.push(`El Dependency Health está en ${dh}%. En una organización con múltiples equipos, esto implica que la arquitectura no escala. Cuando dos equipos no pueden trabajar simultáneamente sin pisarse, el problema no es de gestión — es de arquitectura.`);
        }
      }

      if (ownership.some(o => !o.pass)) {
        parts.push("Hay componentes huérfanos o mal ubicados. Sin ownership explícito, estos componentes se convierten en tierra de nadie. Nadie los mejora, nadie los elimina, y con el tiempo se vuelven legacy. Mi recomendación: asignar ownership a cada componente y documentarlo.");
      }

      const totalViolations = violations.filter(v => !v.pass).length;
      if (totalViolations > 5) {
        parts.push(`${totalViolations} violaciones activas. Con este volumen, no se van a resolver solas. Propongo establecer una governance board semanal de 30 minutos para revisar la evolución del grafo y decidir qué violaciones abordar.`);
      }

      if (rules.length === 0 || rules.some(r => r.pass)) {
        parts.push("Tienen reglas custom activas, lo cual es una buena señal de madurez. El siguiente paso es hacer cumplir estas reglas en CI, no solo en commands ad-hoc.");
      } else {
        parts.push("No veo reglas custom definidas. Sugiero crear un archivo .forge/rules.json con al menos 2-3 reglas específicas de su dominio para capturar conocimiento arquitectónico que las reglas genéricas R1-R9 no cubren.");
      }

      if (parts.length === 0) {
        parts.push("La arquitectura tiene una base sólida. Mi preocupación principal es que mantengan esta salud a lo largo del tiempo. Establezcan auditorías periódicas (cada 2-3 meses) y documenten las decisiones arquitectónicas en ARCHITECTURE.md.");
      }

      return parts.join("\n\n");
    },
  },
];

// ── Ensayo engine ──

function formatPersonaOutput(persona, opinion) {
  const lines = [];
  const line = "─".repeat(60);
  lines.push(`\n${BOLD}${CYAN}──── ${persona.name}${RESET}${DIM} — ${persona.role}${RESET}`);
  lines.push(`${DIM}${line}${RESET}`);
  lines.push(`\n${opinion}\n`);
  return lines.join("\n");
}

export function generateAssay(report, graph) {
  const opinions = [];
  for (const persona of PERSONAS) {
    try {
      const text = persona.getOpinion(report, graph);
      opinions.push({
        persona: { id: persona.id, name: persona.name, role: persona.role },
        opinion: text,
      });
    } catch (e) {
      opinions.push({
        persona: { id: persona.id, name: persona.name, role: persona.role },
        opinion: `(Error al generar opinión: ${e.message})`,
      });
    }
  }
  return opinions;
}

function printAssay(report, opinions, graph) {
  const score = report.total || 0;
  const maxScore = report.max || 140;
  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const grade = report.grade || (pct >= 90 ? "A" : pct >= 80 ? "B" : pct >= 65 ? "C" : pct >= 50 ? "D" : "F");
  const vCount = report.violations?.filter(v => !v.pass).length || 0;

  console.log(`\n${BOLD}${CYAN}═══ Forge Assay — Ensayo Arquitectónico ═══${RESET}`);
  console.log(`${DIM}Score: ${score}/${maxScore} (${pct}%) — ${grade}${RESET}`);
  console.log(`${DIM}Violaciones: ${vCount}${RESET}`);
  console.log(`${DIM}Personas: ${PERSONAS.map(p => p.name).join(", ")}${RESET}`);
  console.log(`${DIM}Fecha: ${new Date().toISOString().slice(0, 10)}${RESET}\n`);

  for (const op of opinions) {
    console.log(formatPersonaOutput(op.persona, op.opinion));
  }

  console.log(`${DIM}─`.repeat(60) + `${RESET}`);
  console.log(`${DIM}forge assay --save para persistir este ensayo${RESET}\n`);
}

function getState() {
  try {
    const state = loadState();
    return state || {};
  } catch {
    return {};
  }
}

function getLastInspectReport() {
  const state = getState();
  // Try to load the latest inspect result from forge-config state
  return {
    total: state.lastScore ?? 0,
    max: 140,
    grade: state.lastGrade ?? "—",
    violations: [],
    context: {
      features: {
        total: state.totalFeatures ?? 0,
        migrated: [],
        legacy: [],
      },
    },
    severityCounts: {},
  };
}

function rebuildGraph() {
  try {
    return getGraph(ROOT);
  } catch {
    return { nodes: [], edges: [], stats: { hasCycles: false, dependencyHealth: 100, totalNodes: 0, totalEdges: 0, violations: 0, riskScore: 0, health: "unknown" } };
  }
}

// ── Persistence ──

function saveAssay(opinions, report) {
  mkdirSync(ASSAY_DIR, { recursive: true });
  const score = report.total || 0;
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `assay-${ts}.md`;
  const path = join(ASSAY_DIR, filename);

  const lines = [];
  lines.push(`# Forge Assay — ${new Date().toISOString().slice(0, 10)}`);
  lines.push(`\nScore: ${report.total}/${report.max}`);
  lines.push(`Violaciones: ${report.violations?.filter(v => !v.pass).length || 0}`);
  lines.push(`\n---\n`);

  for (const op of opinions) {
    lines.push(`## ${op.persona.name} — ${op.persona.role}`);
    lines.push(`\n${op.opinion}\n`);
  }

  writeFileSync(path, lines.join("\n"));
  return path;
}

function listAssays() {
  if (!existsSync(ASSAY_DIR)) return [];
  return readdirSync(ASSAY_DIR)
    .filter(f => f.startsWith("assay-") && f.endsWith(".md"))
    .sort()
    .reverse()
    .map(f => ({
      file: f,
      path: join(ASSAY_DIR, f),
      date: f.replace("assay-", "").replace(".md", "").replace(/-/g, ":").slice(0, 19),
    }));
}

// ── CLI ──

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`Uso: node assay.mjs [flags]`);
    console.log(`  (sin flags)    → ensayo completo en texto`);
    console.log(`  --json         → salida JSON`);
    console.log(`  --persona=<id> → solo una persona (bezos, fowler, hacker, pm, senior)`);
    console.log(`  --save         → persistir ensayo en .forge/assay/`);
    console.log(`  history        → listar ensayos anteriores`);
    console.log(`  read <file>    → leer ensayo persistido`);
    console.log(`  --help         → esta ayuda`);
    return;
  }

  if (args.includes("history")) {
    const assays = listAssays();
    if (assays.length === 0) {
      console.log("No hay ensayos previos en .forge/assay/");
    } else {
      console.log("── Ensayos anteriores ──");
      for (const a of assays.slice(0, 10)) {
        console.log(`  ${a.date} — ${a.file}`);
      }
    }
    return;
  }

  const readIdx = args.indexOf("read");
  if (readIdx !== -1 && args[readIdx + 1]) {
    const path = join(ASSAY_DIR, args[readIdx + 1]);
    if (existsSync(path)) {
      console.log(readFileSync(path, "utf-8"));
    } else {
      console.error(`No existe: ${path}`);
      process.exit(1);
    }
    return;
  }

  const personaFilter = args.find(a => a.startsWith("--persona="));
  const personaId = personaFilter?.split("=")[1];
  const isJson = args.includes("--json");
  const doSave = args.includes("--save");

  // Load report from last inspect
  const report = getLastInspectReport();
  const graph = rebuildGraph();

  // Run violations from detect
  try {
    const { detectFeaturesOnSrc, allChecks } = await import("./detect.mjs");
    const features = detectFeaturesOnSrc();
    const results = allChecks(features, graph, {});

    let violations = [];
    for (const [, cat] of Object.entries(results)) {
      violations = violations.concat(cat.checks);
    }
    report.violations = violations;
    report.severityCounts = {};
    for (const v of violations) {
      if (!v.pass) {
        report.severityCounts[v.severity] = (report.severityCounts[v.severity] || 0) + 1;
      }
    }
  } catch { /* use empty violations */ }

  // Generate opinions
  let personas = PERSONAS;
  if (personaId) {
    const found = PERSONAS.find(p => p.id === personaId);
    if (!found) {
      console.error(`Persona no encontrada: ${personaId}. Opciones: ${PERSONAS.map(p => p.id).join(", ")}`);
      process.exit(1);
    }
    personas = [found];
  }

  const opinions = [];
  for (const persona of personas) {
    try {
      const text = persona.getOpinion(report, graph);
      opinions.push({ persona: { id: persona.id, name: persona.name, role: persona.role }, opinion: text });
    } catch (e) {
      opinions.push({ persona: { id: persona.id, name: persona.name, role: persona.role }, opinion: `(Error: ${e.message})` });
    }
  }

  if (isJson) {
    console.log(formatJson({ report: { total: report.total, max: report.max, grade: report.grade, violationCount: report.violations?.length || 0 }, graph: graph?.stats || {}, opinions }));
    return;
  }

  if (doSave) {
    const saved = saveAssay(opinions, report);
    console.log(`Ensayo guardado: ${saved}`);
  }

  printAssay(report, opinions, graph);
}

if (process.argv[1]?.endsWith("assay.mjs")) {
  main().catch(console.error);
}

export { PERSONAS };
