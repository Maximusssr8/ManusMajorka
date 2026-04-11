#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';

const results = { build: { pass: false, issues: [] }, visual: { pass: false, issues: [] }, feature: { pass: false, issues: [] } };

console.log('\n  MAJORKA QA GATE\n');

// Agent 1: Build
console.log('Agent 1/3: Build Health');
try {
  execSync('pnpm run build 2>&1', { stdio: 'pipe', timeout: 120000 });
  execSync('node scripts/build-api.mjs 2>&1', { stdio: 'pipe', timeout: 30000 });
  results.build.pass = true;
  console.log('  PASS: Build clean\n');
} catch (err) {
  results.build.issues.push('Build failed');
  console.log('  FAIL: Build broken\n');
}

// Agent 2: Visual
console.log('Agent 2/3: Visual Audit');
const componentFiles = execSync("find client/src -name '*.tsx' | grep -v node_modules", { encoding: 'utf8' }).trim().split('\n');
const lightPatterns = [/bg-white(?!\/)/, /bg-gray-[1-3]00/, /bg-slate-[1-2]00/, /background:\s*white/, /background:\s*#fff/];
let lightCount = 0;
for (const file of componentFiles) {
  try {
    const c = fs.readFileSync(file, 'utf8');
    if (lightPatterns.some(p => p.test(c))) { lightCount++; results.visual.issues.push(file.replace('client/src/', '')); }
  } catch {}
}
const cssFiles = execSync("find client/src -name '*.css' | grep -v node_modules", { encoding: 'utf8' }).trim().split('\n');
let hasLight = false, hasDark = false;
for (const f of cssFiles) {
  try {
    const c = fs.readFileSync(f, 'utf8');
    if (c.includes('[data-theme="light"]') || c.includes("[data-theme='light']")) hasLight = true;
    if (c.includes('#080808')) hasDark = true;
  } catch {}
}
if (!hasLight) results.visual.issues.push('Missing light theme CSS block');
if (!hasDark) results.visual.issues.push('Missing dark default (#080808)');
results.visual.pass = results.visual.issues.length <= 3;
console.log(results.visual.pass ? '  PASS\n' : `  WARN: ${results.visual.issues.length} issues\n`);

// Agent 3: Feature
console.log('Agent 3/3: Feature Wire-up');
const checks = [
  ['Toaster in App.tsx', () => { const a = fs.readFileSync('client/src/App.tsx', 'utf8'); return a.includes('Toaster'); }],
  ['ThemeToggle wired', () => { const r = execSync("grep -rln 'ThemeToggle' client/src --include='*.tsx'", { encoding: 'utf8' }); return r.split('\n').filter(f => f && !f.includes('ThemeToggle.tsx')).length > 0; }],
  ['CommandPalette in App', () => fs.readFileSync('client/src/App.tsx', 'utf8').includes('CommandPalette')],
  ['Syne font in HTML', () => fs.readFileSync('client/index.html', 'utf8').includes('Syne')],
  ['Theme flash script', () => { const h = fs.readFileSync('client/index.html', 'utf8'); return h.includes('majorka-theme') && h.includes('data-theme'); }],
  ['setTheme uses data-theme', () => fs.readFileSync('client/src/lib/theme.ts', 'utf8').includes("setAttribute('data-theme'")],
];
for (const [name, test] of checks) {
  try {
    const ok = test();
    console.log(`  ${ok ? 'PASS' : 'FAIL'}: ${name}`);
    if (!ok) results.feature.issues.push(name);
  } catch (e) {
    console.log(`  FAIL: ${name}`);
    results.feature.issues.push(name);
  }
}
results.feature.pass = results.feature.issues.length === 0;

const allPass = results.build.pass && results.feature.pass;
console.log(`\n  VERDICT: ${allPass ? 'DEPLOY APPROVED' : 'DEPLOY BLOCKED'}\n`);
if (!allPass) {
  [...results.build.issues, ...results.feature.issues].forEach(i => console.log('  -> ' + i));
  process.exit(1);
}
process.exit(0);
