/* Regenerates engine/fixtures.json from the current model.
 * Run deliberately: node engine/gen-fixtures.cjs
 * Tests assert EXACT equality against the committed file, so a model
 * change that moves any number is a conscious, reviewed decision.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
require('./engine.js');
const E = globalThis.ENGINE;

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
  shortfall_usd: Math.round(r.shortfall)
};

/* Fixture 3: the committed Acme example through the full runner. */
const out = JSON.parse(execFileSync('node', [path.join(__dirname, 'run.cjs'), '--example', '--json'], { encoding: 'utf8' }));
const acme = {
  description: 'company/params.example.yaml through run.cjs (illustrative Acme Security fixture, team.bdrs=1 supplied)',
  verdicts: Object.fromEntries(Object.entries(out.mix.engines).map(([k, v]) => [k, v.verdict])),
  budget_monthly: Object.fromEntries(Object.entries(out.mix.engines).map(([k, v]) => [k, v.budget_monthly])),
  budget_share_bps: Object.fromEntries(Object.entries(out.mix.engines).map(([k, v]) => [k, v.budget_share_bps])),
  allocated_total_usd: out.mix.allocated_total,
  unallocated_total_usd: out.mix.unallocated_total,
  capacity: out.capacity,
  target_clearance: out.status.target_clearance
};

const fixtures = {
  generated_by: 'engine/gen-fixtures.cjs (run deliberately; tests pin these exactly)',
  model_version: E.MODEL_VERSION,
  workbook_schedule: workbook,
  solver_default: solver,
  acme_example: acme
};
fs.writeFileSync(path.join(__dirname, 'fixtures.json'), JSON.stringify(fixtures, null, 2) + '\n');
console.log('fixtures.json written for model ' + E.MODEL_VERSION);
