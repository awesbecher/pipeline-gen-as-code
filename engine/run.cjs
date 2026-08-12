#!/usr/bin/env node
/* Nine Engines runner.
 *
 * Usage:
 *   node engine/run.cjs <path/to/params.yaml|.json> [--json|--board]
 *   node engine/run.cjs --example [--json|--board]
 *   node engine/run.cjs --doctor [params.yaml]
 *   node engine/run.cjs --help | --version
 *
 * Exit codes: 0 success, 2 invalid input or usage, 1 unexpected error
 * or doctor FAIL (Node below the engines floor, or a calculator file
 * missing). Doctor is the only planned use of 1 besides a crash.
 * There is no implicit fallback to sample data: you either pass your
 * own parameters file or ask for the bundled illustrative example
 * explicitly with --example.
 *
 * Output discipline: every write goes through emit(), and the process
 * ends by falling out of main() rather than calling process.exit().
 * process.exit() after a write truncates stdout at the pipe buffer
 * (8,192 bytes on macOS), which silently corrupted --json for anything
 * that captured the output instead of redirecting it to a file.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const PARAMS = require('./params.cjs');
const MIX = require('./mix.cjs');
const ENGINE = require('./engine.cjs');

const OUTPUT_SCHEMA_VERSION = 4;
const root = path.resolve(__dirname, '..');

/* Board sensitivity deltas, published as assumptions. */
const SCENARIOS = [
  { key: 'downside', label: 'Downside', factor: 0.85, delta: 'rep productivity 15 percent below plan' },
  { key: 'base', label: 'Base', factor: 1.0, delta: 'plan assumptions as entered' },
  { key: 'upside', label: 'Upside', factor: 1.10, delta: 'rep productivity 10 percent above plan' }
];

function emit(s) { process.stdout.write(s + '\n'); }

/* Provenance. Outputs say which logic produced them, from which inputs,
 * on which day. The date honours SOURCE_DATE_EPOCH so committed
 * fixtures stay byte-stable; without it, today's date is used. */
function generatedOn() {
  const src = process.env.SOURCE_DATE_EPOCH;
  const ms = src && /^\d+$/.test(src) ? Number(src) * 1000 : Date.now();
  return new Date(ms).toISOString().slice(0, 10);
}
function canonical(v) {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return '[' + v.map(canonical).join(',') + ']';
  return '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canonical(v[k])).join(',') + '}';
}
function paramsHash(p) {
  return require('crypto').createHash('sha256').update(canonical(p)).digest('hex').slice(0, 12);
}
function versionLine() {
  return 'model ' + ENGINE.MODEL_VERSION + ' · mix ' + MIX.MIX_VERSION +
    ' · params schema v' + PARAMS.SCHEMA_VERSION + ' · output schema v' + OUTPUT_SCHEMA_VERSION;
}

/* What this model does not attempt. Stated in every output so a reader
 * never mistakes a staffing verdict for a company plan. */
const NOT_MODELED = [
  { key: 'demand_coverage', label: 'Demand coverage',
    note: 'Permanently out of scope in this product line until a future version explicitly adds it. The plan counts the first meetings the bookings target implies. Nothing here proves the funded engines will produce them. Engine spend is not converted into meetings or bookings.' },
  { key: 'cash_and_runway', label: 'Cash and runway viability',
    note: 'Permanently out of scope in this product line. Sales payroll run rate is reported, but this model holds no balance sheet, burn rate, or runway. Affordability is the operator\'s check against cash on hand.' }
];
function note(s) { process.stderr.write(s); }

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
    '  node engine/run.cjs --doctor [params.yaml]      install and environment checks, no network',
    '  node engine/run.cjs --help | --version',
    '',
    'Field groups (the contract):',
    '  portfolio drivers: ' + PARAMS.GROUPS.portfolio_drivers.join(', '),
    '  capacity drivers:  ' + PARAMS.GROUPS.capacity_drivers.join(', '),
    '  narrative context: ' + PARAMS.GROUPS.narrative_context.join(', ') + ' (drives no verdict)',
    '',
    'Schema and format: company/params.example.yaml documents every field.',
    'Invalid input exits 2 with field-specific errors. Nothing fails open.',
    'Doctor exits 1 if Node is below the engines floor or a calculator file is missing.'
  ].join('\n');
}

function canAccess(p, mode) {
  try { fs.accessSync(p, mode); return true; } catch (e) { return false; }
}

function doctor(paramsArg) {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const engines = (pkg.engines && pkg.engines.node) || '>=22';
  const floorMatch = String(engines).match(/(\d+)/);
  const floor = floorMatch ? Number(floorMatch[1]) : 22;
  const nodeVer = process.versions.node;
  const major = parseInt(nodeVer, 10);
  const nodeOk = Number.isFinite(major) && major >= floor;
  const runPath = path.join(root, 'engine', 'run.cjs');
  const binPath = path.join(root, 'bin', 'nine-engines');
  const hasRun = fs.existsSync(runPath);
  const hasBin = fs.existsSync(binPath);
  const hasGit = fs.existsSync(path.join(root, '.git'));
  const hasClaude = fs.existsSync(path.join(root, '.claude-plugin', 'plugin.json'));
  const hasCodex = fs.existsSync(path.join(root, '.codex-plugin', 'plugin.json'));
  let mode;
  if (!hasRun || !hasBin) mode = 'skill-only (calculators missing; clone or install the plugin)';
  else if (hasGit) mode = 'clone';
  else if (hasClaude || hasCodex) mode = 'plugin';
  else mode = 'unpacked bundle';

  const paramsPath = paramsArg
    ? path.resolve(paramsArg)
    : path.join(process.cwd(), 'company', 'params.yaml');
  let paramsLine;
  if (fs.existsSync(paramsPath)) {
    const writable = canAccess(paramsPath, fs.constants.W_OK);
    paramsLine = paramsPath + (writable ? ' exists, writable' : ' exists, not writable');
  } else {
    const parent = path.dirname(paramsPath);
    const parentWritable = fs.existsSync(parent) && canAccess(parent, fs.constants.W_OK);
    paramsLine = paramsPath + ' missing' + (parentWritable ? ' (parent writable)' : '');
  }

  const planDir = path.join(process.cwd(), 'plan');
  let planLine;
  if (fs.existsSync(planDir)) {
    planLine = planDir + (canAccess(planDir, fs.constants.W_OK) ? ' exists, writable' : ' exists, not writable');
  } else {
    const cwdWritable = canAccess(process.cwd(), fs.constants.W_OK);
    planLine = planDir + ' missing' + (cwdWritable ? ' (cwd writable; mkdir -p plan)' : ' (cwd not writable)');
  }

  const lines = [
    'Nine Engines doctor',
    'Node: v' + nodeVer + ' (requires ' + engines + ') ' + (nodeOk ? 'ok' : 'FAIL'),
    'Calculators: engine/run.cjs ' + (hasRun ? 'present' : 'MISSING') +
      ', bin/nine-engines ' + (hasBin ? 'present' : 'MISSING'),
    'Install mode: ' + mode,
    'Bundle root: ' + root,
    'Params path: ' + paramsLine,
    'Plan dir: ' + planLine
  ];
  emit(lines.join('\n'));
  return (nodeOk && hasRun && hasBin) ? 0 : 1;
}

/* ---------- helpers ---------- */

function money(n) { return '$' + Math.round(n).toLocaleString('en-US'); }
/* One decimal: a plan at 99.7 percent must not render as 100. */
function pct(x) { return (isFinite(x) ? (x * 100).toFixed(1) : 'unbounded') + ' percent'; }
function count(n) { return Math.round(n).toLocaleString('en-US'); }
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
    carried_sales_leaders: c.team.carriedAvps,
    carried_bdr_managers: c.team.carriedBdrMgrs,
    carried_se_leads: c.team.carriedSeLeads,
    leadership_hires: c.team.leaders.map(l => ({ role: l.role, month: l.month })),
    sales_payroll_run_rate_usd: Math.round(c.burn.runRate),
    year1_sales_comp_usd: Math.round(c.burn.totalCost),
    meetings_required_year1: c.activity.meetings,
    bdr_meetings_required_year1: Math.round(c.bdrCheck.needed),
    bdr_capacity_points_year1: c.bdrCheck.capacity,
    bdr_capacity_utilization: Math.round(c.bdrCheck.util * 1000) / 1000,
    bdr_support_status: c.bdrCheck.status,
    bdr_hiring_bound_by: c.bdrCheck.boundBy,
    bdr_additional_needed: c.bdrCheck.additionalBdrsNeeded,
    bdr_fix_by_month: c.bdrCheck.fixByMonth
  };
}

/* Headcount and cost, the columns a reoptimized plan must expose. */
function planShape(c) {
  return {
    new_aes: c.newSeats.length,
    new_ae_hire_months: c.newSeats.map(s => s.hireMonth),
    total_bdrs: c.team.totalBdrs,
    total_ses: c.team.totalSes,
    leadership_hires: c.team.leaders.length,
    sales_payroll_run_rate_usd: Math.round(c.burn.runRate),
    year1_sales_comp_usd: Math.round(c.burn.totalCost),
    gross_capacity_usd: Math.round(c.grossCapacity),
    exit_arr_usd: Math.round(c.exitArr),
    shortfall_usd: Math.round(c.shortfall),
    bdr_capacity_utilization: Math.round(c.bdrCheck.util * 1000) / 1000,
    status: c.status.overall
  };
}

/* ---------- main ---------- */

function main() {
  const argv = process.argv.slice(2);
  const flags = new Set(argv.filter(a => a.startsWith('--')));
  const positional = argv.filter(a => !a.startsWith('--'));

  for (const f of flags) {
    if (!['--json', '--board', '--example', '--help', '--version', '--doctor'].includes(f)) {
      note('Unknown flag ' + f + '\n\n' + usage() + '\n');
      return 2;
    }
  }
  if (flags.has('--help')) { emit(usage()); return 0; }
  if (flags.has('--version')) {
    emit('model ' + ENGINE.MODEL_VERSION + ' · mix ' + MIX.MIX_VERSION +
      ' · params schema v' + PARAMS.SCHEMA_VERSION + ' · output schema v' + OUTPUT_SCHEMA_VERSION);
    return 0;
  }
  if (flags.has('--doctor') || positional[0] === 'doctor') {
    if (flags.has('--json') || flags.has('--board') || flags.has('--example')) {
      note('doctor does not combine with --json, --board, or --example.\n');
      return 2;
    }
    const fileArg = flags.has('--doctor') ? positional[0] : positional[1];
    return doctor(fileArg);
  }
  if (flags.has('--json') && flags.has('--board')) {
    note('Pick one of --json or --board.\n');
    return 2;
  }

  let file, isExample = false;
  if (flags.has('--example')) {
    if (positional.length) { note('Pass a file or --example, not both.\n'); return 2; }
    file = path.join(root, 'company', 'params.example.yaml');
    isExample = true;
  } else if (positional.length === 1) {
    file = path.resolve(positional[0]);
  } else {
    note((positional.length ? 'Pass exactly one parameters file.\n\n' : 'No parameters file given.\n\n') + usage() + '\n');
    return 2;
  }
  if (!fs.existsSync(file)) {
    note('No file at ' + file + '\n(To run the bundled illustrative example: --example)\n');
    return 2;
  }

  /* ---------- load + validate ---------- */

  const loaded = PARAMS.load(fs.readFileSync(file, 'utf8'), file.endsWith('.json'));
  if (loaded.errors.length) {
    note('Invalid parameters in ' + path.basename(file) + ':\n');
    loaded.errors.forEach(e => note('  - ' + e + '\n'));
    note('See company/params.example.yaml for the documented schema.\n');
    return 2;
  }
  const p = loaded.params;
  const warnings = loaded.warnings.slice();
  const assumptions = loaded.assumptions.slice();
  if (isExample) warnings.push('Running the bundled illustrative example (Acme Security), not your data.');

  /* ---------- models ---------- */

  const mix = MIX.recommend(p);

  function capacityInputs(over) {
    return Object.assign({
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
      bdrManagers: p.team.bdr_managers != null ? p.team.bdr_managers : null,
      seLeads: p.team.se_leads != null ? p.team.se_leads : null,
      rampingTenures: p.team.aes_ramping_tenure_months.length ? p.team.aes_ramping_tenure_months : null,
      adv: JSON.parse(JSON.stringify(ENGINE.DEFAULTS.adv))
    }, over || {});
  }

  let cap = null;
  if (p.capacity) {
    cap = ENGINE.compute(capacityInputs());
    cap.assumptions.forEach(a => assumptions.push(a));
  } else {
    assumptions.push('No capacity block supplied; the sales capacity model did not run.');
  }

  const clearance = cap
    ? cap.status
    : { ae_bookings: 'not_computed', bdr_support: 'not_computed', overall: 'not_computed' };

  if (cap && cap.bdrCheck.status === 'over_capacity') {
    warnings.push('BDR support runs at ' + pct(cap.bdrCheck.util) + ' of capacity: the plan needs ' +
      cap.bdrCheck.additionalBdrsNeeded + ' more BDR' + (cap.bdrCheck.additionalBdrsNeeded === 1 ? '' : 's') +
      ' by month ' + cap.bdrCheck.fixByMonth + ' to source its own meeting plan. Overall staffing does not clear.');
  }

  /* Scenario runs. The default question is what happens to the APPROVED
   * plan when an assumption moves, so the hiring schedule is frozen. The
   * reoptimized pass answers the second question, what we would hire
   * instead, and it reports every headcount and dollar it changes. */
  function scenarios() {
    if (!p.capacity) return null;
    const fixed = {}, reoptimized = {};
    SCENARIOS.forEach(s => {
      const over = {};
      if (s.factor !== 1) {
        const adv = JSON.parse(JSON.stringify(ENGINE.DEFAULTS.adv));
        adv.steadyOverride = ENGINE.steadyAnnual(p.acv, p.cycle_days, 0) * s.factor;
        over.adv = adv;
      }
      fixed[s.key] = s.factor === 1 ? cap : ENGINE.compute(capacityInputs(Object.assign({ plan: cap.plan }, over)));
      reoptimized[s.key] = s.factor === 1 ? cap : ENGINE.compute(capacityInputs(over));
    });
    return { fixed, reoptimized };
  }
  const sc = scenarios();
  if (cap) {
    assumptions.push('Board sensitivities move one stated input: steady-state productivity per ramped AE at ' +
      SCENARIOS.map(s => s.label.toLowerCase() + ' ' + s.factor.toFixed(2) + 'x').join(', ') +
      '. Fixed-plan rows hold the approved hiring schedule constant; reoptimized rows re-solve it and report the headcount and payroll that change.');
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
      units: { currency: 'USD', budget_share: 'basis_points', months: 'plan month, 1-12', bdr_capacity: 'SAO points, 12 per BDR month' },
      generated_on: generatedOn(),
      params_hash: paramsHash(p),
      status: {
        target_clearance: clearance,
        not_modeled: NOT_MODELED.map(n => ({ dimension: n.key, status: 'not_modeled', note: n.note })),
        warnings: warnings,
        assumptions: assumptions
      },
      decision_input_groups: PARAMS.GROUPS,
      inputs_normalized: p,
      mix: mix,
      capacity: cap ? capacitySummary(cap) : null,
      scenarios: sc ? {
        method: 'One stated input moves: steady-state productivity per ramped AE. Fixed-plan holds the approved hiring schedule; reoptimized re-solves it.',
        fixed_plan: SCENARIOS.map(s => Object.assign({ scenario: s.key, delta: s.delta, factor: s.factor }, planShape(sc.fixed[s.key]))),
        reoptimized: SCENARIOS.map(s => Object.assign({ scenario: s.key, delta: s.delta, factor: s.factor }, planShape(sc.reoptimized[s.key])))
      } : null,
      sources: 'docs/SOURCES.md carries every benchmark claim with source, evidence class, and confidence. Unsourced numbers are labeled operator heuristics.'
    };
    assertFinite(out, 'output');
    emit(JSON.stringify(out, null, 2));
    return 0;
  }

  /* ---------- board memo ---------- */

  if (flags.has('--board')) {
    const L = [];
    const co = escapeMd(p.company);
    L.push('# Pipeline plan for the board · ' + co);
    L.push('');
    L.push(isExample
      ? '> Illustrative fixture. Acme Security is a made-up company used to show the output shape. Numbers below are computed from the committed example parameters, not from a real business.'
      : '> Generated from ' + escapeMd(path.basename(file)) + '. Every assumption is listed below.');
    L.push('>');
    L.push('> ' + versionLine() + ' · generated ' + generatedOn() + ' · parameters ' + paramsHash(p));
    L.push('');
    L.push('This is a sales capacity and engine allocation memo. It decides where pipeline money goes and whether the bookings target is staffable. Demand coverage and cash runway are permanently out of scope in this product line. Engine spend is not converted into meetings or bookings. Payroll run rate is reported; affordability is the operator\'s check. A staffing verdict of "clears" is not a statement that the company plan clears.');
    L.push('');
    if (cap) {
      const scDec = sc;
      const decisions = 1 + mix.run_now.length +
        (cap.newSeats.length ? 1 : 0) +
        (clearance.bdr_support === 'over_capacity' ? 1 : 0) +
        (cap.shortfall > 0 ? 1 : 0);
      L.push('## Decision box');
      L.push('');
      L.push('| Item | Value |');
      L.push('|------|-------|');
      L.push('| Pipeline cash committed | ' + money(p.cash_monthly_pipeline) + ' a month, ' + money(p.cash_monthly_pipeline * 12) + ' a year |');
      L.push('| New AE hires and timing | ' + cap.newSeats.length + (cap.newSeats.length ? ' in months ' + cap.newSeats.map(s => s.hireMonth).join(', ') : '') + ' |');
      L.push('| New support hires | ' + cap.team.newBdrs + ' BDRs, ' + cap.team.newSes + ' SEs, ' + cap.team.leaders.length + ' leaders |');
      L.push('| Incremental year-one sales comp | ' + money(cap.burn.buildCost) + ' |');
      L.push('| Sales payroll run rate at full build | ' + money(cap.burn.runRate) + ' |');
      L.push('| Modeled exit ARR against target | ' + money(cap.exitArr) + ' against ' + money(p.arr_target_12mo_usd) + ' |');
      L.push('| Base margin on gross capacity | ' + (cap.grossCapacity >= cap.grossNeeded ? '+' : '') + money(cap.grossCapacity - cap.grossNeeded) + ' |');
      L.push('| Downside gap, approved plan held fixed | ' + (scDec && scDec.fixed.downside.shortfall > 0 ? 'MISSES by ' + money(scDec.fixed.downside.shortfall) : 'clears') + ' |');
      NOT_MODELED.forEach(n => L.push('| ' + n.label + ' | NOT MODELED |'));
      L.push('| Decisions required today | ' + decisions + ' |');
      L.push('');
    }
    if (warnings.length) {
      L.push('## Warnings on these inputs');
      L.push('');
      warnings.forEach(w => L.push('- ' + w));
      L.push('');
    }
    L.push('## What this memo does not model');
    L.push('');
    NOT_MODELED.forEach(n => L.push('- ' + n.label + ': not modeled. ' + n.note));
    L.push('');
    if (cap) {
      const covered = cap.netNewNeeded <= 0;
      L.push('## The ask, in one paragraph');
      L.push('');
      L.push('Reach ' + money(p.arr_target_12mo_usd) + ' ARR from ' + money(p.capacity.base_arr_usd) +
        ' in 12 months. Net of ' + Math.round(p.capacity.churn_pct * 100) + ' percent churn and ' +
        money(p.capacity.expansion_usd) + ' expansion, that requires ' +
        (covered
          ? 'no net-new ARR at all: the base and expansion already cover the target, so this plan is about what to build next, not what to close.'
          : money(Math.max(0, cap.netNewNeeded)) + ' in net-new ARR, which is ' + money(cap.grossNeeded) +
            ' gross bookings capacity at the model\'s 30 percent haircut.'));
      L.push('');
      L.push('Status by layer: AE bookings capacity ' + clearance.ae_bookings.replace('_', ' ') +
        ', BDR support ' + clearance.bdr_support.replace('_', ' ') +
        ', overall staffing ' + clearance.overall.replace('_', ' ') + '.');
      L.push('');
      if (clearance.overall === 'clears') {
        L.push('The staffing plan below clears the target with modeled capacity of ' + money(cap.grossCapacity) +
          ', and the support build covers the ' + count(cap.activity.meetings) + ' first meetings it implies.');
      } else if (clearance.ae_bookings === 'shortfall') {
        L.push('The plan below does NOT clear the target; the modeled shortfall is ' + money(cap.shortfall) + '.');
      } else {
        L.push('AE bookings capacity clears at ' + money(cap.grossCapacity) + ', but BDR support is over capacity at ' +
          pct(cap.bdrCheck.util) + ' until the support plan is corrected: ' + cap.bdrCheck.additionalBdrsNeeded +
          ' more BDR' + (cap.bdrCheck.additionalBdrsNeeded === 1 ? '' : 's') + ' by month ' + cap.bdrCheck.fixByMonth +
          '. Overall staffing does not clear.');
      }
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
    L.push('This split is a management starting hypothesis from fixed 85/15 weights. It is not a forecast. Engine spend is not converted into meetings or bookings, and will not be until a future version explicitly adds that conversion.');
    L.push('');
    if (cap) {
      L.push('## Hires and timing');
      L.push('');
      L.push('- New AEs: ' + cap.newSeats.length + (cap.newSeats.length ? ' (months ' + cap.newSeats.map(s => s.hireMonth).join(', ') + ')' : ''));
      L.push('- New BDRs: ' + cap.team.newBdrs + (cap.team.bdrHires.length ? ' (months ' + cap.team.bdrHires.join(', ') + ')' : '') + '; new SEs: ' + cap.team.newSes + (cap.team.seHires.length ? ' (months ' + cap.team.seHires.join(', ') + ')' : ''));
      L.push('- BDR hiring takes the larger of two requirements, the AE coverage ratio and the meeting plan. Here it is bound by ' +
        (cap.bdrCheck.boundBy === 'meeting_volume' ? 'meeting volume' : 'the AE coverage ratio') + ': ' +
        cap.bdrCheck.ratioHires.length + ' hire(s) from the ratio plus ' + cap.bdrCheck.meetingHires.length + ' to source the meeting plan.');
      L.push('- Leadership adds: ' + (cap.team.leaders.length ? cap.team.leaders.map(l => l.label + ' month ' + l.month).join(', ') : 'none this plan') +
        '. Carried leadership priced in this plan: ' + cap.team.carriedAvps + ' sales leader(s), ' +
        cap.team.carriedBdrMgrs + ' BDR manager(s), ' + cap.team.carriedSeLeads + ' SE lead(s).');
      L.push('- Sales payroll run rate at full build: ' + money(cap.burn.runRate) + '; year-1 sales comp: ' + money(cap.burn.totalCost));
      L.push('- Meetings the plan implies: ' + count(cap.activity.meetings) + ' first meetings across the year, of which BDRs source ' +
        count(cap.bdrCheck.needed) + '; BDR capacity utilization ' + pct(cap.bdrCheck.util) + ' (prorated for hire months)');
      L.push('');
      L.push('## Sensitivity on the approved plan');
      L.push('');
      L.push('The hiring schedule above is held fixed. This is the risk the board is actually approving.');
      L.push('');
      L.push('| Scenario | Assumption delta | Gross capacity | Exit ARR | Gap to target | BDR utilization |');
      L.push('|----------|------------------|---------------:|---------:|--------------:|----------------:|');
      SCENARIOS.forEach(s => {
        const r = sc.fixed[s.key];
        L.push('| ' + s.label + ' | ' + s.delta + ' | ' + money(r.grossCapacity) + ' | ' + money(r.exitArr) + ' | ' +
          (r.shortfall > 0 ? 'MISSES by ' + money(r.shortfall) : 'clears') + ' | ' + pct(r.bdrCheck.util) + ' |');
      });
      L.push('');
      L.push('## Recovery plans, if you reopen hiring');
      L.push('');
      L.push('Each row re-solves the schedule for that scenario. The headcount and payroll columns are the cost of holding the target.');
      L.push('');
      L.push('| Scenario | New AEs | Hire months | BDRs | SEs | Leaders added | Payroll run rate | Year-1 comp | Exit ARR | BDR utilization |');
      L.push('|----------|--------:|-------------|-----:|----:|--------------:|-----------------:|------------:|---------:|----------------:|');
      SCENARIOS.forEach(s => {
        const r = sc.reoptimized[s.key];
        L.push('| ' + s.label + ' | ' + r.newSeats.length + ' | ' + (r.newSeats.map(x => x.hireMonth).join(', ') || 'none') +
          ' | ' + r.team.totalBdrs + ' | ' + r.team.totalSes + ' | ' + r.team.leaders.length + ' | ' +
          money(r.burn.runRate) + ' | ' + money(r.burn.totalCost) + ' | ' + money(r.exitArr) + ' | ' + pct(r.bdrCheck.util) + ' |');
      });
      L.push('');
      const dR = sc.reoptimized.downside, bR = sc.reoptimized.base;
      L.push('Read the downside row as the real ask: holding ' + money(p.arr_target_12mo_usd) +
        ' through a 15 percent productivity miss costs ' + (dR.newSeats.length - bR.newSeats.length) +
        ' more AEs and ' + money(dR.burn.runRate - bR.burn.runRate) + ' more payroll run rate than the base plan.');
      L.push('');
      L.push('## Risks');
      L.push('');
      if (clearance.bdr_support === 'over_capacity') {
        L.push('- Support gap: BDR capacity is at ' + pct(cap.bdrCheck.util) + ' of what the meeting plan needs. Add ' +
          cap.bdrCheck.additionalBdrsNeeded + ' BDR' + (cap.bdrCheck.additionalBdrsNeeded === 1 ? '' : 's') +
          ' by month ' + cap.bdrCheck.fixByMonth + ', cut the target, or accept fewer sourced meetings.');
      }
      SCENARIOS.filter(s => sc.fixed[s.key].shortfall > 0).forEach(s => {
        L.push('- ' + s.label + ' sensitivity: with the approved plan unchanged, ' + s.delta + ' misses the target by ' +
          money(sc.fixed[s.key].shortfall) + ' of gross capacity.');
      });
      SCENARIOS.filter(s => sc.fixed[s.key].bdrCheck.status === 'over_capacity' && s.key !== 'base').forEach(s => {
        L.push('- ' + s.label + ' support strain: the same plan runs BDR support at ' + pct(sc.fixed[s.key].bdrCheck.util) +
          ' because more bookings mean more meetings to source.');
      });
      L.push('- The engine allocation is a starting hypothesis, not a demand forecast. Engine spend is not converted into meetings. Cash and runway are not modeled; payroll run rate is reported, affordability is the operator\'s check.');
      L.push('');
    }
    L.push('## Assumptions this output rests on');
    L.push('');
    (assumptions.length ? assumptions : ['None beyond the documented model methodology.']).forEach(a => L.push('- ' + a));
    L.push('- Portfolio verdicts use only the published portfolio drivers: ' + PARAMS.GROUPS.portfolio_drivers.join(', ') + '. Stage, funding, ICP, and personas are narrative context and drive no verdict.');
    L.push('');
    L.push('## Evidence');
    L.push('');
    L.push('Benchmark claims in the playbook are indexed in docs/SOURCES.md with source, evidence class, sample, and confidence. Numbers without a resolvable source are labeled Andrew Wesbecher operator heuristics. Model math is tested; run `node engine/test-engine.cjs` and `node engine/test-mix.cjs`.');
    L.push('');
    L.push('## Decisions required');
    L.push('');
    L.push('1. Approve or amend the engine allocation above; record overrides with rationale in plan/review.md.');
    mix.run_now.forEach(e => L.push('1. Name the owner for ' + MIX.LABELS[e] + '.'));
    if (cap && cap.newSeats.length) L.push('1. Approve the hiring schedule (' + cap.newSeats.length + ' AEs plus support) or set a different target.');
    if (cap && clearance.bdr_support === 'over_capacity') {
      L.push('1. Close the support gap: fund ' + cap.bdrCheck.additionalBdrsNeeded + ' more BDR' +
        (cap.bdrCheck.additionalBdrsNeeded === 1 ? '' : 's') + ' by month ' + cap.bdrCheck.fixByMonth +
        ', or accept that the meeting plan is short.');
    }
    if (cap && cap.shortfall > 0) L.push('1. The target does not clear as entered: cut the target, add capacity, or accept the gap explicitly.');
    L.push('');
    L.push('## Next review');
    L.push('');
    L.push('First Monday operating loop after approval (plan/monday.md), then weekly. Re-run this memo when budget, team, ACV, or target changes.');
    L.push('');
    L.push('A human approves every external send, in every engine, always.');
    emit(L.join('\n'));
    return 0;
  }

  /* ---------- markdown output (default) ---------- */

  const lines = [];
  lines.push('# Engine mix · ' + escapeMd(p.company));
  if (isExample) lines.push('\n(Illustrative fixture: the bundled Acme Security example, run with --example.)');
  if (warnings.length) warnings.forEach(w => note('warning: ' + w + '\n'));
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
    lines.push('Status: AE bookings ' + clearance.ae_bookings.replace('_', ' ') + ', BDR support ' +
      clearance.bdr_support.replace('_', ' ') + ' at ' + pct(cap.bdrCheck.util) + ', overall ' + clearance.overall.replace('_', ' ') + '.');
  } else {
    lines.push('\n(Capacity model not run: add the capacity block and arr_target_12mo_usd to check staffing against the target.)');
  }
  if (assumptions.length) {
    lines.push('\nAssumptions:');
    assumptions.forEach(a => lines.push('- ' + a));
  }
  lines.push('\nBenchmark claims are indexed with sources and confidence in docs/SOURCES.md; unsourced numbers are labeled operator heuristics.');
  emit(lines.join('\n'));
  return 0;
}

process.exitCode = main();
