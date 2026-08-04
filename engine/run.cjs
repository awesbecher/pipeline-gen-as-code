#!/usr/bin/env node
/* Nine Engines runner.
 * Usage:
 *   node engine/run.cjs                          reads company/params.yaml
 *   node engine/run.cjs path/to/params.yaml      explicit path (yaml or json)
 *   node engine/run.cjs --json                   raw JSON instead of markdown
 * Zero dependencies. The YAML parser below handles exactly the schema in
 * company/params.example.yaml (flat keys, one nesting level, inline lists);
 * it is not a general YAML parser. JSON params files are also accepted.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const MIX = require('./mix.js');
require('./engine.js');
const ENGINE = globalThis.ENGINE;

/* ---------- args ---------- */
const args = process.argv.slice(2);
const asJson = args.includes('--json');
const fileArg = args.find(a => !a.startsWith('--'));
const root = path.resolve(__dirname, '..');
let file = fileArg ? path.resolve(fileArg) : path.join(root, 'company', 'params.yaml');
let usedExample = false;
if (!fs.existsSync(file)) {
  const example = path.join(root, 'company', 'params.example.yaml');
  if (!fileArg && fs.existsSync(example)) { file = example; usedExample = true; }
  else { console.error('No params file at ' + file); process.exit(1); }
}

/* ---------- tiny YAML subset parser ---------- */
function coerce(v) {
  if (v === '') return '';
  const q = v.match(/^"(.*)"$/) || v.match(/^'(.*)'$/);
  if (q) return q[1];
  if (v === 'true' || v === 'yes') return true;
  if (v === 'false' || v === 'no') return false;
  if (v === 'null' || v === '~') return null;
  if (/^-?\d+(\.\d+)?$/.test(v)) return parseFloat(v);
  return v;
}
function stripComment(line) {
  let out = '', inQ = null;
  for (const ch of line) {
    if (inQ) { out += ch; if (ch === inQ) inQ = null; continue; }
    if (ch === '"' || ch === "'") { inQ = ch; out += ch; continue; }
    if (ch === '#') break;
    out += ch;
  }
  return out;
}
function parseParams(text, isJson) {
  if (isJson) return JSON.parse(text);
  const doc = {};
  let section = null;
  for (const raw of text.split('\n')) {
    const line = stripComment(raw).replace(/\s+$/, '');
    if (!line.trim()) continue;
    const indented = /^\s/.test(line);
    const t = line.trim();
    if (t.startsWith('- ')) {                       /* dash list item */
      const target = section ? doc[section] : null;
      if (Array.isArray(target)) target.push(coerce(t.slice(2).trim()));
      continue;
    }
    const m = t.match(/^([A-Za-z0-9_]+):(.*)$/);
    if (!m) continue;
    const key = m[1];
    const val = m[2].trim();
    if (!indented) {
      if (val === '') { section = key; doc[key] = {}; }
      else if (val === '[]') { section = key; doc[key] = []; }
      else if (val.startsWith('[')) {
        section = null;
        doc[key] = val.slice(1, -1).split(',').map(s => coerce(s.trim())).filter(v => v !== '');
      } else { section = null; doc[key] = coerce(val); }
    } else if (section && doc[section] && !Array.isArray(doc[section])) {
      if (val.startsWith('[')) doc[section][key] = val.slice(1, -1).split(',').map(s => coerce(s.trim())).filter(v => v !== '');
      else doc[section][key] = coerce(val);
    }
  }
  return doc;
}

const p = parseParams(fs.readFileSync(file, 'utf8'), file.endsWith('.json'));

/* ---------- mix ---------- */
const mix = MIX.recommend({
  acv: p.acv || 0,
  cash_monthly_pipeline: p.cash_monthly_pipeline || 0,
  team: p.team || {},
  product: p.product || {},
  constraints: p.constraints || []
});

/* ---------- capacity (optional) ---------- */
let cap = null;
if (p.capacity && p.acv && p.cycle_days) {
  const d = ENGINE.DEFAULTS;
  const inp = {
    baseArr: p.capacity.base_arr_usd != null ? p.capacity.base_arr_usd : (p.arr_now_usd || d.baseArr),
    churnPct: p.capacity.churn_pct != null ? p.capacity.churn_pct : d.churnPct,
    expansion: p.capacity.expansion_usd != null ? p.capacity.expansion_usd : d.expansion,
    targetArr: p.arr_target_12mo_usd || d.targetArr,
    acv: p.acv,
    cycleDays: p.cycle_days,
    rampedAes: (p.team && p.team.aes_ramped) || 0,
    rampingAes: (p.team && p.team.aes_ramping) || 0,
    adv: d.adv
  };
  cap = ENGINE.compute(inp);
}

/* ---------- output ---------- */
function money(n) { return '$' + Math.round(n).toLocaleString('en-US'); }

if (asJson) {
  const out = { params_file: path.relative(root, file), mix: mix };
  if (cap) out.capacity = {
    steady_annual: cap.steady, gross_needed: cap.grossNeeded,
    gross_capacity: cap.grossCapacity, exit_arr: cap.exitArr,
    new_hires: cap.newSeats.map(s => s.hireMonth), shortfall: cap.shortfall,
    total_aes: cap.team.totalAes, total_bdrs: cap.team.totalBdrs, total_ses: cap.team.totalSes
  };
  console.log(JSON.stringify(out, null, 2));
  process.exit(0);
}

const lines = [];
lines.push('# Engine mix' + (p.company ? ' · ' + p.company : ''));
if (usedExample) lines.push('\n(Ran on company/params.example.yaml. Copy it to company/params.yaml and edit.)');
lines.push('\n| Engine | Verdict | Monthly | Why |');
lines.push('|--------|---------|--------:|-----|');
MIX.ENGINES.forEach(e => {
  const r = mix.engines[e];
  const budget = r.budget_monthly > 0 ? money(r.budget_monthly) : '–';
  lines.push('| ' + r.label + ' | ' + r.verdict.replace('_', ' ') + ' | ' + budget + ' | ' + r.reason + ' |');
});
lines.push('\nRun now: ' + (mix.run_now.map(e => MIX.LABELS[e]).join(', ') || 'none') + '.');
lines.push('Instrument now: ' + (mix.instrument_now.map(e => MIX.LABELS[e]).join(', ') || 'none') + '.');
mix.notes.forEach(n => lines.push('- ' + n));

if (cap) {
  lines.push('\n# Capacity check');
  lines.push('Steady-state per ramped AE: ' + money(cap.steady) + ' a year.');
  lines.push('Gross bookings needed for the bridge: ' + money(cap.grossNeeded) + '.');
  lines.push('Modeled gross capacity: ' + money(cap.grossCapacity) + ' from ' + cap.team.totalAes + ' AEs (' + cap.newSeats.length + ' new: months ' + (cap.newSeats.map(s => s.hireMonth).join(', ') || 'none') + ').');
  lines.push('Modeled exit ARR: ' + money(cap.exitArr) + (cap.shortfall > 0 ? '. SHORTFALL: ' + money(cap.shortfall) + ' gross; the target does not clear with these constraints.' : '.'));
  lines.push('Support build: ' + cap.team.totalBdrs + ' BDRs, ' + cap.team.totalSes + ' SEs. Sales payroll run rate: ' + money(cap.burn.runRate) + '.');
}
lines.push('\nBenchmark ranges are directional, drawn from operating experience; the 2026 market data is industry-reported.');
console.log(lines.join('\n'));
