/* Regenerates engine/fixtures.json from the current model.
 * Run deliberately: node engine/gen-fixtures.cjs
 * Tests assert EXACT equality against the committed file, so a model
 * change that moves any number is a conscious, reviewed decision.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const E = require('./engine.cjs');

/* Committed artifacts carry a generation date. Pin it so regenerating
 * the fixtures does not churn on the clock; bump it deliberately when
 * you regenerate for a release. */
const FIXTURE_EPOCH = '1786060800'; /* 2026-08-07 */

const prof = E.profileFor(178);
const steadyMo = 1000000 / 12;

/* Fixture 1: the workbook schedule. The source workbook forces these
 * hire months (8 new hires) and rounds monthly cells to whole dollars,
 * which is why parity carries a stated tolerance instead of exactness. */
const deckMonths = [-9, -9, -2, -1, 1, 1, 2, 2, 3, 4, 6, 7];
let gross = 0;
deckMonths.forEach(m => { gross += E.seatYear1(m, steadyMo, prof); });
const workbook = {
  description: 'Forced workbook hire schedule (8 new hires), $120K ACV, 178-day cycle',
  forced_hire_months: deckMonths,
  computed_gross_usd: Math.round(gross),
  computed_net_new_usd: Math.round(gross * 0.7),
  computed_exit_arr_usd: Math.round(1200000 + gross * 0.7 + 1000000 - 70000),
  workbook_reported_gross_usd: 6958328,
  workbook_reported_exit_arr_usd: 7000830,
  parity_tolerance_usd: 50,
  parity_note: 'The workbook rounds monthly cells to whole dollars; the model computes exactly. Parity holds within the stated tolerance, not to the dollar.'
};

/* Fixture 2: the solver at tool defaults (no current team supplied,
 * support derived from AE ratios; the solver picks the schedule). */
const r = E.compute(JSON.parse(JSON.stringify(E.DEFAULTS)));
const solver = {
  description: 'Solver at DEFAULTS: $1.2M base, 6% churn, $1.0M expansion, $7.0M target, $120K ACV, 178d, 2 ramped + 2 ramping AEs, support derived',
  gross_capacity_usd: Math.round(r.grossCapacity),
  exit_arr_usd: Math.round(r.exitArr),
  new_ae_hires: r.newSeats.length,
  new_ae_hire_months: r.newSeats.map(s => s.hireMonth),
  existing_gross_usd: Math.round(r.existingGross),
  shortfall_usd: Math.round(r.shortfall),
  total_bdrs: r.team.totalBdrs,
  new_bdr_hire_months: r.team.bdrHires,
  total_ses: r.team.totalSes,
  bdr_meetings_required: Math.round(r.bdrCheck.needed),
  bdr_capacity_points: r.bdrCheck.capacity,
  bdr_capacity_utilization: Math.round(r.bdrCheck.util * 1000) / 1000,
  bdr_hiring_bound_by: r.bdrCheck.boundBy,
  sales_payroll_run_rate_usd: Math.round(r.burn.runRate),
  year1_sales_comp_usd: Math.round(r.burn.totalCost),
  status: r.status
};

/* Fixture 3: the committed Acme example through the full runner.
 * Captured the same way a consumer captures it (a pipe, not a file
 * redirect), so a truncating runner fails here first. */
const captured = execFileSync('node', [path.join(__dirname, 'run.cjs'), '--example', '--json'],
  { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
    env: Object.assign({}, process.env, { SOURCE_DATE_EPOCH: FIXTURE_EPOCH }) });
let out;
try { out = JSON.parse(captured); }
catch (e) {
  throw new Error('captured --json did not parse at ' + Buffer.byteLength(captured) +
    ' bytes; the runner is truncating stdout: ' + e.message);
}
const acme = {
  description: 'company/params.example.yaml through run.cjs (illustrative Acme Security fixture, team.bdrs=1 supplied)',
  verdicts: Object.fromEntries(Object.entries(out.mix.engines).map(([k, v]) => [k, v.verdict])),
  budget_monthly: Object.fromEntries(Object.entries(out.mix.engines).map(([k, v]) => [k, v.budget_monthly])),
  budget_share_bps: Object.fromEntries(Object.entries(out.mix.engines).map(([k, v]) => [k, v.budget_share_bps])),
  allocated_total_usd: out.mix.allocated_total,
  unallocated_total_usd: out.mix.unallocated_total,
  capacity: out.capacity,
  target_clearance: out.status.target_clearance,
  scenarios_fixed_plan: out.scenarios.fixed_plan.map(s => ({
    scenario: s.scenario, factor: s.factor, new_aes: s.new_aes,
    gross_capacity_usd: s.gross_capacity_usd, exit_arr_usd: s.exit_arr_usd,
    shortfall_usd: s.shortfall_usd, bdr_capacity_utilization: s.bdr_capacity_utilization,
    status: s.status
  })),
  scenarios_reoptimized: out.scenarios.reoptimized.map(s => ({
    scenario: s.scenario, factor: s.factor, new_aes: s.new_aes,
    total_bdrs: s.total_bdrs, total_ses: s.total_ses,
    sales_payroll_run_rate_usd: s.sales_payroll_run_rate_usd,
    year1_sales_comp_usd: s.year1_sales_comp_usd, exit_arr_usd: s.exit_arr_usd,
    status: s.status
  })),
  json_bytes: Buffer.byteLength(captured)
};

const fixtures = {
  generated_by: 'engine/gen-fixtures.cjs (run deliberately; tests pin these exactly)',
  model_version: E.MODEL_VERSION,
  mix_version: require('./mix.cjs').MIX_VERSION,
  fixture_epoch: FIXTURE_EPOCH,
  workbook_schedule: workbook,
  solver_default: solver,
  acme_example: acme
};
fs.writeFileSync(path.join(__dirname, 'fixtures.json'), JSON.stringify(fixtures, null, 2) + '\n');
console.log('fixtures.json written for model ' + E.MODEL_VERSION);
