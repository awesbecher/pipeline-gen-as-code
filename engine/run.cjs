#!/usr/bin/env node
/* Nine Engines runner.
 *
 * Usage:
 *   node engine/run.cjs <path/to/params.yaml|.json> [--json|--board]
 *   node engine/run.cjs --example [--json|--board]
 *   node engine/run.cjs --help | --version
 *
 * Exit codes: 0 success, 2 invalid input or usage, 1 unexpected error.
 * There is no implicit fallback to sample data: you either pass your
 * own parameters file or ask for the bundled illustrative example
 * explicitly with --example.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const PARAMS = require('./params.cjs');
const MIX = require('./mix.js');
require('./engine.js');
const ENGINE = globalThis.ENGINE;

const OUTPUT_SCHEMA_VERSION = 2;
const root = path.resolve(__dirname, '..');

/* ---------- CLI ---------- */

function usage() {
  return [
    'Nine Engines runner (model ' + ENGINE.MODEL_VERSION + ', params schema v' + PARAMS.SCHEMA_VERSION + ')',
    '',
    'Usage:',
    '  node engine/run.cjs <params.yaml|params.json>   verdicts + capacity, markdown',
    '  node engine/run.cjs <file> --json               versioned machine-readable output',
    '  node engine/run.cjs <file> --board              board memo (BOARD.md content)',
    '  node engine/run.cjs --example [--json|--board]  run the bundled illustrative example',
    '  node engine/run.cjs --help | --version',
    '',
    'Field groups (the contract):',
    '  portfolio drivers: ' + PARAMS.GROUPS.portfolio_drivers.join(', '),
    '  capacity drivers:  ' + PARAMS.GROUPS.capacity_drivers.join(', '),
    '  narrative context: ' + PARAMS.GROUPS.narrative_context.join(', ') + ' (drives no verdict)',
    '',
    'Schema and format: company/params.example.yaml documents every field.',
    'Invalid input exits 2 with field-specific errors. Nothing fails open.'
  ].join('\n');
}

const argv = process.argv.slice(2);
const flags = new Set(argv.filter(a => a.startsWith('--')));
const positional = argv.filter(a => !a.startsWith('--'));

for (const f of flags) {
  if (!['--json', '--board', '--example', '--help', '--version'].includes(f)) {
    process.stderr.write('Unknown flag ' + f + '\n\n' + usage() + '\n');
    process.exit(2);
  }
}
if (flags.has('--help')) { console.log(usage()); process.exit(0); }
if (flags.has('--version')) {
  console.log('model ' + ENGINE.MODEL_VERSION + ' · mix ' + MIX.MIX_VERSION + ' · params schema v' + PARAMS.SCHEMA_VERSION + ' · output schema v' + OUTPUT_SCHEMA_VERSION);
  process.exit(0);
}
if (flags.has('--json') && flags.has('--board')) {
  process.stderr.write('Pick one of --json or --board.\n'); process.exit(2);
}

let file, isExample = false;
if (flags.has('--example')) {
  if (positional.length) { process.stderr.write('Pass a file or --example, not both.\n'); process.exit(2); }
  file = path.join(root, 'company', 'params.example.yaml');
  isExample = true;
} else if (positional.length === 1) {
  file = path.resolve(positional[0]);
} else {
  process.stderr.write((positional.length ? 'Pass exactly one parameters file.\n\n' : 'No parameters file given.\n\n') + usage() + '\n');
  process.exit(2);
}
if (!fs.existsSync(file)) {
  process.stderr.write('No file at ' + file + '\n(To run the bundled illustrative example: --example)\n');
  process.exit(2);
}

/* ---------- load + validate ---------- */

const loaded = PARAMS.load(fs.readFileSync(file, 'utf8'), file.endsWith('.json'));
if (loaded.errors.length) {
  process.stderr.write('Invalid parameters in ' + path.basename(file) + ':\n');
  loaded.errors.forEach(e => process.stderr.write('  - ' + e + '\n'));
  process.stderr.write('See company/params.example.yaml for the documented schema.\n');
  process.exit(2);
}
const p = loaded.params;
const warnings = loaded.warnings.slice();
const assumptions = loaded.assumptions.slice();
if (isExample) warnings.push('Running the bundled illustrative example (Acme Security), not your data.');

/* ---------- models ---------- */

const mix = MIX.recommend(p);

let cap = null;
if (p.capacity) {
  const d = ENGINE.DEFAULTS;
  cap = ENGINE.compute({
    baseArr: p.capacity.base_arr_usd,
    churnPct: p.capacity.churn_pct,
    expansion: p.capacity.expansion_usd,
    targetArr: p.arr_target_12mo_usd,
    acv: p.acv,
    cycleDays: p.cycle_days,
    rampedAes: p.team.aes_ramped,
    rampingAes: p.team.aes_ramping,
    bdrs: p.team.bdrs,
    ses: p.team.ses != null ? p.team.ses : null,
    salesLeaders: p.team.sales_leaders != null ? p.team.sales_leaders : null,
    rampingTenures: p.team.aes_ramping_tenure_months.length ? p.team.aes_ramping_tenure_months : null,
    adv: d.adv
  });
  cap.assumptions.forEach(a => assumptions.push(a));
} else {
  assumptions.push('No capacity block supplied; the sales capacity model did not run.');
}

const targetClearance = cap ? (cap.shortfall > 0 ? 'shortfall' : 'clears') : 'not_computed';

/* ---------- helpers ---------- */

function money(n) { return '$' + Math.round(n).toLocaleString('en-US'); }
function escapeMd(s) {
  return String(s).replace(/[\\`*_{}[\]<>|]/g, c => '\\' + c);
}
function assertFinite(obj, trail) {
  if (obj === null || obj === undefined) return;
  if (typeof obj === 'number') {
    if (!isFinite(obj)) throw new Error('non-finite number at ' + trail);
    return;
  }
  if (Array.isArray(obj)) { obj.forEach((v, i) => assertFinite(v, trail + '[' + i + ']')); return; }
  if (typeof obj === 'object') Object.keys(obj).forEach(k => assertFinite(obj[k], trail + '.' + k));
}

function capacitySummary(c) {
  return {
    steady_state_per_ae_usd: Math.round(c.steady),
    gross_needed_usd: Math.round(c.grossNeeded),
    gross_capacity_usd: Math.round(c.grossCapacity),
    net_new_arr_usd: Math.round(c.netNewLogo),
    exit_arr_usd: Math.round(c.exitArr),
    shortfall_usd: Math.round(c.shortfall),
    new_ae_hire_months: c.newSeats.map(s => s.hireMonth),
    total_aes: c.team.totalAes, total_bdrs: c.team.totalBdrs, total_ses: c.team.totalSes,
    new_bdr_hire_months: c.team.bdrHires, new_se_hire_months: c.team.seHires,
    leadership_hires: c.team.leaders.map(l => ({ role: l.role, month: l.month })),
    sales_payroll_run_rate_usd: Math.round(c.burn.runRate),
    year1_sales_comp_usd: Math.round(c.burn.totalCost),
    meetings_required_year1: c.activity.meetings,
    bdr_capacity_utilization: Math.round(c.bdrCheck.util * 1000) / 1000
  };
}

/* Scenario runs: same model, stated input deltas. */
function scenarios() {
  if (!p.capacity) return null;
  const base = cap;
  function rerun(factor) {
    const d = ENGINE.DEFAULTS;
    const adv = JSON.parse(JSON.stringify(d.adv));
    adv.steadyOverride = ENGINE.steadyAnnual(p.acv, p.cycle_days, 0) * factor;
    return ENGINE.compute({
      baseArr: p.capacity.base_arr_usd, churnPct: p.capacity.churn_pct,
      expansion: p.capacity.expansion_usd, targetArr: p.arr_target_12mo_usd,
      acv: p.acv, cycleDays: p.cycle_days,
      rampedAes: p.team.aes_ramped, rampingAes: p.team.aes_ramping,
      bdrs: p.team.bdrs, ses: p.team.ses != null ? p.team.ses : null,
      salesLeaders: p.team.sales_leaders != null ? p.team.sales_leaders : null,
      rampingTenures: p.team.aes_ramping_tenure_months.length ? p.team.aes_ramping_tenure_months : null,
      adv: adv
    });
  }
  return {
    downside: { delta: 'rep productivity 15 percent below plan', run: rerun(0.85) },
    base: { delta: 'plan assumptions as entered', run: base },
    upside: { delta: 'rep productivity 10 percent above plan', run: rerun(1.10) }
  };
}

/* ---------- JSON output ---------- */

if (flags.has('--json')) {
  const out = {
    output_schema_version: OUTPUT_SCHEMA_VERSION,
    model_version: ENGINE.MODEL_VERSION,
    mix_version: MIX.MIX_VERSION,
    params_schema_version: PARAMS.SCHEMA_VERSION,
    params_file: path.relative(root, file),
    illustrative_example: isExample,
    units: { currency: 'USD', budget_share: 'basis_points', months: 'plan month, 1-12' },
    status: { target_clearance: targetClearance, warnings: warnings, assumptions: assumptions },
    decision_input_groups: PARAMS.GROUPS,
    inputs_normalized: p,
    mix: mix,
    capacity: cap ? capacitySummary(cap) : null,
    sources: 'docs/SOURCES.md carries every benchmark claim with source, evidence class, and confidence. Unsourced numbers are labeled operator heuristics.'
  };
  assertFinite(out, 'output');
  console.log(JSON.stringify(out, null, 2));
  process.exit(0);
}

/* ---------- board memo ---------- */

if (flags.has('--board')) {
  const L = [];
  const co = escapeMd(p.company);
  L.push('# Pipeline plan for the board · ' + co);
  L.push('');
  L.push(isExample
    ? '> Illustrative fixture. Acme Security is a made-up company used to show the output shape. Numbers below are computed from the committed example parameters, not from a real business.'
    : '> Generated from ' + escapeMd(path.basename(file)) + '. Model ' + ENGINE.MODEL_VERSION + '; every assumption is listed below.');
  L.push('');
  if (cap) {
    L.push('## The ask, in one paragraph');
    L.push('');
    L.push('Reach ' + money(p.arr_target_12mo_usd) + ' ARR from ' + money(p.capacity.base_arr_usd) +
      ' in 12 months. Net of ' + Math.round(p.capacity.churn_pct * 100) + ' percent churn and ' +
      money(p.capacity.expansion_usd) + ' expansion, that requires ' + money(cap.netNewNeeded) +
      ' in net-new ARR, which is ' + money(cap.grossNeeded) + ' gross bookings capacity at the model\'s 30 percent haircut. ' +
      (cap.shortfall > 0
        ? 'The plan below does NOT clear it; the modeled shortfall is ' + money(cap.shortfall) + '.'
        : 'The staffing plan below clears it with modeled capacity of ' + money(cap.grossCapacity) + '.'));
    L.push('');
  }
  L.push('## Engine bets (starting allocation, argue with it)');
  L.push('');
  L.push('| Engine | Verdict | Monthly | Share | Why |');
  L.push('|--------|---------|--------:|------:|-----|');
  MIX.ENGINES.forEach(e => {
    const g = mix.engines[e];
    L.push('| ' + g.label + ' | ' + g.verdict.replace('_', ' ') + ' | ' +
      (g.budget_monthly > 0 ? money(g.budget_monthly) : '–') + ' | ' +
      (g.budget_share_bps ? (g.budget_share_bps / 100).toFixed(1) + '%' : '–') + ' | ' + g.reason + ' |');
  });
  L.push('');
  L.push('Cash: ' + money(mix.allocated_total) + ' allocated of ' + money(p.cash_monthly_pipeline) +
    ' a month; ' + money(mix.unallocated_total) + ' unallocated (rounding remainder' +
    (mix.run_now.length ? '' : ' plus the intentionally unfunded run pool') + ').');
  L.push('');
  L.push('This split is a management starting hypothesis from fixed 85/15 weights. It is not a forecast, and engine spend is not converted into meetings or bookings in this model version.');
  L.push('');
  if (cap) {
    L.push('## Hires and timing');
    L.push('');
    L.push('- New AEs: ' + cap.newSeats.length + (cap.newSeats.length ? ' (months ' + cap.newSeats.map(s => s.hireMonth).join(', ') + ')' : ''));
    L.push('- New BDRs: ' + cap.team.newBdrs + (cap.team.bdrHires.length ? ' (months ' + cap.team.bdrHires.join(', ') + ')' : '') + '; new SEs: ' + cap.team.newSes + (cap.team.seHires.length ? ' (months ' + cap.team.seHires.join(', ') + ')' : ''));
    L.push('- Leadership adds: ' + (cap.team.leaders.length ? cap.team.leaders.map(l => l.label + ' month ' + l.month).join(', ') : 'none this plan'));
    L.push('- Sales payroll run rate at full build: ' + money(cap.burn.runRate) + '; year-1 sales comp: ' + money(cap.burn.totalCost));
    L.push('- Meetings the plan implies: ' + cap.activity.meetings + ' first meetings across the year; BDR capacity utilization ' + Math.round(cap.bdrCheck.util * 100) + ' percent (prorated for hire months)');
    L.push('');
    const sc = scenarios();
    L.push('## Scenarios (same model, stated input deltas)');
    L.push('');
    L.push('| Scenario | Assumption delta | Gross capacity | Exit ARR | Target |');
    L.push('|----------|------------------|---------------:|---------:|--------|');
    [['Downside', sc.downside], ['Base', sc.base], ['Upside', sc.upside]].forEach(([name, s]) => {
      L.push('| ' + name + ' | ' + s.delta + ' | ' + money(s.run.grossCapacity) + ' | ' + money(s.run.exitArr) + ' | ' + (s.run.shortfall > 0 ? 'MISSES by ' + money(s.run.shortfall) : 'clears') + ' |');
    });
    L.push('');
  }
  L.push('## Assumptions this output rests on');
  L.push('');
  (assumptions.length ? assumptions : ['None beyond the documented model methodology.']).forEach(a => L.push('- ' + a));
  L.push('- Portfolio verdicts use only the published portfolio drivers: ' + PARAMS.GROUPS.portfolio_drivers.join(', ') + '. Stage, funding, ICP, and personas are narrative context and drive no verdict.');
  L.push('');
  L.push('## Evidence');
  L.push('');
  L.push('Benchmark claims in the playbook are indexed in docs/SOURCES.md with source, evidence class, and confidence. Numbers without a source are labeled as Andrew Wesbecher operator heuristics. Model math is tested; run `node engine/test-engine.cjs` and `node engine/test-mix.cjs`.');
  L.push('');
  L.push('## Decisions required');
  L.push('');
  L.push('1. Approve or amend the engine allocation above; record overrides with rationale in plan/review.md.');
  mix.run_now.forEach(e => L.push('1. Name the owner for ' + MIX.LABELS[e] + '.'));
  if (cap && cap.newSeats.length) L.push('1. Approve the hiring schedule (' + cap.newSeats.length + ' AEs plus support) or set a different target.');
  if (cap && cap.shortfall > 0) L.push('1. The target does not clear as entered: cut the target, add capacity, or accept the gap explicitly.');
  L.push('');
  L.push('## Next review');
  L.push('');
  L.push('First Monday operating loop after approval (plan/monday.md), then weekly. Re-run this memo when budget, team, ACV, or target changes.');
  L.push('');
  L.push('A human approves every external send, in every engine, always.');
  console.log(L.join('\n'));
  process.exit(0);
}

/* ---------- markdown output (default) ---------- */

const lines = [];
lines.push('# Engine mix · ' + escapeMd(p.company));
if (isExample) lines.push('\n(Illustrative fixture: the bundled Acme Security example, run with --example.)');
if (warnings.length) warnings.forEach(w => process.stderr.write('warning: ' + w + '\n'));
lines.push('\n| Engine | Verdict | Monthly | Why |');
lines.push('|--------|---------|--------:|-----|');
MIX.ENGINES.forEach(e => {
  const r = mix.engines[e];
  const budget = r.budget_monthly > 0 ? money(r.budget_monthly) : '–';
  lines.push('| ' + r.label + ' | ' + r.verdict.replace('_', ' ') + ' | ' + budget + ' | ' + r.reason + ' |');
});
lines.push('\nRun now: ' + (mix.run_now.map(e => MIX.LABELS[e]).join(', ') || 'none') + '.');
lines.push('Instrument now: ' + (mix.instrument_now.map(e => MIX.LABELS[e]).join(', ') || 'none') + '.');
lines.push('Allocated ' + money(mix.allocated_total) + ' of ' + money(p.cash_monthly_pipeline) + '; unallocated ' + money(mix.unallocated_total) + '.');
mix.notes.forEach(n => lines.push('- ' + n));

if (cap) {
  lines.push('\n# Capacity check');
  lines.push('Steady-state per ramped AE: ' + money(cap.steady) + ' a year.');
  lines.push('Gross bookings needed for the bridge: ' + money(cap.grossNeeded) + '.');
  lines.push('Modeled gross capacity: ' + money(cap.grossCapacity) + ' from ' + cap.team.totalAes + ' AEs (' + cap.newSeats.length + ' new: months ' + (cap.newSeats.map(s => s.hireMonth).join(', ') || 'none') + ').');
  lines.push('Modeled exit ARR: ' + money(cap.exitArr) + (cap.shortfall > 0 ? '. SHORTFALL: ' + money(cap.shortfall) + ' gross; the target does not clear with these inputs.' : '.'));
  lines.push('Support build: ' + cap.team.totalBdrs + ' BDRs, ' + cap.team.totalSes + ' SEs. Sales payroll run rate: ' + money(cap.burn.runRate) + '.');
} else {
  lines.push('\n(Capacity model not run: add the capacity block and arr_target_12mo_usd to check staffing against the target.)');
}
if (assumptions.length) {
  lines.push('\nAssumptions:');
  assumptions.forEach(a => lines.push('- ' + a));
}
lines.push('\nBenchmark claims are indexed with sources and confidence in docs/SOURCES.md; unsourced numbers are labeled operator heuristics.');
console.log(lines.join('\n'));
