#!/usr/bin/env node
/**
 * Nail/unnail Forge sub-commands as standalone skill shortcuts.
 *
 * Usage:
 *   node pin.mjs nail <command>
 *   node pin.mjs unnail <command>
 *
 * `nail cast` creates a lightweight /cast skill that redirects to /forge cast.
 * `unnail cast` removes that shortcut.
 *
 * Scans harness directories and creates/removes the pin in all of them.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const HARNESS_DIRS = ['.claude', '.cursor', '.gemini', '.codex', '.agents', '.opencode', '.kiro'];

const VALID_COMMANDS = ['forge', 'cast', 'inspect', 'quench', 'temper', 'chain', 'graph', 'relocate', 'reforge', 'smelt', 'inscribe'];

const PIN_MARKER = '<!-- forge-pinned-skill -->';

function findProjectRoot(startDir = process.cwd()) {
  let dir = resolve(startDir);
  while (dir !== '/') {
    if (existsSync(join(dir, 'package.json')) || existsSync(join(dir, '.git'))) {
      return dir;
    }
    const parent = resolve(dir, '..');
    if (parent === dir) break;
    dir = parent;
  }
  return resolve(startDir);
}

function findHarnessDirs(projectRoot) {
  const dirs = [];
  for (const harness of HARNESS_DIRS) {
    const skillsDir = join(projectRoot, harness, 'skills');
    const forgeDir = join(skillsDir, 'forge');
    if (existsSync(forgeDir) || existsSync(join(skillsDir, 'i-forge'))) {
      dirs.push(skillsDir);
    }
  }
  return dirs;
}

function nail(command, projectRoot) {
  const harnessDirs = findHarnessDirs(projectRoot);
  if (harnessDirs.length === 0) {
    console.log('No harness directories with Forge installed found.');
    return false;
  }

  const content = `---
name: ${command}
description: "Shortcut for /forge ${command}."
argument-hint: ""
user-invocable: true
---

${PIN_MARKER}

This is a pinned shortcut for \`{{command_prefix}}forge ${command}\`.

Invoke {{command_prefix}}forge ${command}, passing along any arguments provided here, and follow its instructions.
`;

  let created = 0;
  for (const skillsDir of harnessDirs) {
    const skillDir = join(skillsDir, command);
    if (existsSync(skillDir)) {
      const existingMd = join(skillDir, 'SKILL.md');
      if (existsSync(existingMd)) {
        const existing = readFileSync(existingMd, 'utf-8');
        if (!existing.includes(PIN_MARKER)) {
          console.log(`  SKIP: ${skillDir} (non-pinned skill already exists)`);
          continue;
        }
      }
    }
    mkdirSync(skillDir, { recursive: true });
    writeFileSync(join(skillDir, 'SKILL.md'), content, 'utf-8');
    console.log(`  + ${skillDir}`);
    created++;
  }

  if (created > 0) {
    console.log(`\nPinned '${command}' as a standalone shortcut in ${created} location(s).`);
    console.log(`You can now use /${command} directly.`);
  }
  return created > 0;
}

function unnail(command, projectRoot) {
  const harnessDirs = findHarnessDirs(projectRoot);
  let removed = 0;

  for (const skillsDir of harnessDirs) {
    const skillDir = join(skillsDir, command);
    if (!existsSync(skillDir)) continue;
    const skillMd = join(skillDir, 'SKILL.md');
    if (!existsSync(skillMd)) continue;
    const content = readFileSync(skillMd, 'utf-8');
    if (!content.includes(PIN_MARKER)) {
      console.log(`  SKIP: ${skillDir} (not a pinned skill)`);
      continue;
    }
    rmSync(skillDir, { recursive: true, force: true });
    console.log(`  - ${skillDir}`);
    removed++;
  }

  if (removed > 0) {
    console.log(`\nUnpinned '${command}' from ${removed} location(s).`);
  } else {
    console.log(`No pinned '${command}' shortcut found.`);
  }
  return removed > 0;
}

const [,, action, command] = process.argv;

if (!action || !command) {
  console.log('Usage: node pin.mjs <nail|unnail> <command>');
  console.log(`\nAvailable: ${VALID_COMMANDS.join(', ')}`);
  process.exit(1);
}

if (action !== 'nail' && action !== 'unnail') {
  console.error(`Unknown action: ${action}. Use 'nail' or 'unnail'.`);
  process.exit(1);
}

if (!VALID_COMMANDS.includes(command)) {
  console.error(`Unknown command: ${command}`);
  console.error(`Available: ${VALID_COMMANDS.join(', ')}`);
  process.exit(1);
}

const root = findProjectRoot();

if (action === 'nail') {
  nail(command, root);
} else {
  unnail(command, root);
}
