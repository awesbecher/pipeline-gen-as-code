/* Invariant tests that mirror machine-checked theorems in formal/.
 * Theorem names sit inline on each test. These assert the JavaScript
 * calculators, not the Lean kernel. Zero runtime dependencies.
 * Deterministic sweeps only.
 *
 * Harness matches engine/test-engine.cjs (ok / okTrue).
 *
 * Theorems already fully asserted by a pinned fixture or an existing
 * suite, not re-tested here:
 *   Mix.spend_floor_respected -> engine/test-mix.cjs spend-floor sweep
 *   Mix.acme_bps / Mix.acme_allocated -> engine/fixtures.json acme_example
 *     plus test-mix allocation conservation on the Acme-shaped case
 *   Solver.solverDefault_* fixture pins -> engine/test-engine.cjs
 *     solver_default block and engine/test-formal-parity.cjs
 *   Support.solverDefault_* fixture pins -> same
 *   Support.avpsFor exact table -> engine/test-engine.cjs v0.3.2 block
 */
'use strict';
require('./engine.cjs');
const E = globalThis.ENGINE;
const MIX = require('./mix.cjs');
const FX = require('./fixtures.json');

let pass = 0, fail = 0;
function ok(name, got, want, tol) {
  const good = Math.abs(got - want) <= (tol === undefined ? 0 : tol);
  if (good) { pass++; console.log('  ok  ' + name + '  (' + Math.round(got) + ')'); }
  else { fail++; console.log('FAIL  ' + name + '  got ' + got + ' want ' + want + (tol ? ' ±' + tol : ' exactly')); }
}
function okTrue(name, v) { v ? (pass++, console.log('  ok  ' + name)) : (fail++, console.log('FAIL  ' + name)); }

const D = () => JSON.parse(JSON.stringify(E.DEFAULTS));

function mixBase(over) {
  return Object.assign({
    acv: 120000, cash_monthly_pipeline: 25000,
    team: { aes_ramped: 2, aes_ramping: 2, bdrs: 1, gtm_engineer: true },
    product: { self_serve: 'no', developer_facing: false },
    constraints: [], engines_running: []
  }, over || {});
}

/* Largest-remainder, same rule as engine/mix.cjs apportion. Used only
 * to state Apportion.shares_eq_floor_or_succ against that helper. */
function apportion(keys, pool, weightOf) {
  const totalW = keys.reduce((s, k) => s + weightOf(k), 0);
  if (!keys.length || totalW <= 0) return {};
  const exact = keys.map(k => ({ k: k, x: pool * weightOf(k) / totalW }));
  const floors = {};
  let used = 0;
  exact.forEach(e => { floors[e.k] = Math.floor(e.x); used += floors[e.k]; });
  exact.sort((a, b) => (b.x - Math.floor(b.x)) - (a.x - Math.floor(a.x)));
  for (let i = 0; used < pool && i < exact.length; i++, used++) floors[exact[i].k] += 1;
  return floors;
}

function capacityOf(months, existingGross, steadyMo, prof) {
  let g = existingGross;
  months.forEach(m => { g += E.seatYear1(m, steadyMo, prof); });
  return g;
}

function frontLoaded(n, cap) {
  const out = [];
  for (let m = 1; m <= 12 && out.length < n; m++) {
    for (let k = 0; k < cap && out.length < n; k++) out.push(m);
  }
  return out;
}

function bdrCapacityOf(hires, existing) {
  let c = existing * 12 * 12;
  hires.forEach(m => { c += (13 - m) * 12; });
  return c;
}

function headcountAt(existing, hires, m) {
  return existing + hires.filter(h => h <= m).length;
}

console.log('--- Mix.allocated_add_unallocated (Acme + constraint sweep) ---');
const acme = MIX.recommend(mixBase({ engines_running: ['manual_outbound'] }));
ok('Mix.allocated_add_unallocated Acme cash 25000',
  acme.allocated_total + acme.unallocated_total, 25000);
ok('Mix.allocated_add_unallocated Acme allocated 24999', acme.allocated_total, FX.acme_example.allocated_total_usd);

const CONSTRAINTS = ['no_email', 'no_phone', 'no_paid_budget', 'no_events_budget', 'no_community_capacity', 'founder_wont_post'];
const CASHES = [6000, 25000, 40000, 90000, 120000];
let conserveFail = 0, bpsFail = 0, unfundedFail = 0, shareFail = 0, floorOrSuccFail = 0;
CASHES.forEach(cash => {
  for (let mask = 0; mask < 64; mask++) {
    const cons = CONSTRAINTS.filter((_, i) => mask & (1 << i));
    const out = MIX.recommend(mixBase({ cash_monthly_pipeline: cash, constraints: cons }));
    if (out.allocated_total + out.unallocated_total !== cash) conserveFail++;
    const sumBps = MIX.ENGINES.reduce((s, e) => s + out.engines[e].budget_share_bps, 0);
    const bothPools = out.run_now.length > 0 && out.instrument_now.length > 0;
    if (bothPools && sumBps !== 10000) bpsFail++;
    MIX.ENGINES.forEach(e => {
      const g = out.engines[e];
      const funded = g.verdict === 'run_now' || g.verdict === 'instrument_now';
      if (!funded && (g.budget_share_bps !== 0 || g.budget_monthly !== 0)) unfundedFail++;
    });
    const runWeights = {};
    out.run_now.forEach(e => { runWeights[e] = out.engines[e].weight; });
    const runShares = apportion(out.run_now, 8500, k => runWeights[k]);
    const runSum = Object.values(runShares).reduce((s, n) => s + n, 0);
    if (out.run_now.length && Object.values(runWeights).reduce((s, w) => s + w, 0) > 0) {
      if (runSum !== 8500) shareFail++;
      const totalW = Object.values(runWeights).reduce((s, w) => s + w, 0);
      out.run_now.forEach(e => {
        const exact = 8500 * runWeights[e] / totalW;
        const fl = Math.floor(exact);
        const got = runShares[e];
        if (got !== fl && got !== fl + 1) floorOrSuccFail++;
      });
    }
    const instShares = apportion(out.instrument_now, 1500, () => 1);
    const instSum = Object.values(instShares).reduce((s, n) => s + n, 0);
    if (out.instrument_now.length) {
      if (instSum !== 1500) shareFail++;
      out.instrument_now.forEach(e => {
        const exact = 1500 / out.instrument_now.length;
        const fl = Math.floor(exact);
        const got = instShares[e];
        if (got !== fl && got !== fl + 1) floorOrSuccFail++;
      });
    }
  }
});
okTrue('Mix.allocated_add_unallocated: 5 cash x 64 constraints conserve', conserveFail === 0);
okTrue('Mix.totalBps_eq: both-pool cases sum to 10000 bps', bpsFail === 0);
okTrue('Apportion.sum_shares: run 8500 and instrument 1500 when nonempty', shareFail === 0);
okTrue('Apportion.shares_eq_floor_or_succ: each share is floor or floor+1', floorOrSuccFail === 0);
okTrue('Mix.bps_eq_zero_of_not_funded: unfunded engines carry 0 bps and $0', unfundedFail === 0);

console.log('--- Mix.constraint_* (verdict and zero allocation) ---');
const rich = over => MIX.recommend(mixBase(Object.assign({ cash_monthly_pipeline: 120000 }, over)));

const noEmail = rich({ constraints: ['no_email'] });
okTrue('Mix.constraint_noEmail_blocks_automated: blocked',
  noEmail.engines.automated_outbound.verdict === 'blocked');
ok('Mix.constraint_noEmail_blocks_automated: $0', noEmail.engines.automated_outbound.budget_monthly, 0);

const noPhoneEmail = rich({ constraints: ['no_phone', 'no_email'] });
okTrue('Mix.constraint_noPhoneEmail_defers_manual: defer',
  noPhoneEmail.engines.manual_outbound.verdict === 'defer');
ok('Mix.constraint_noPhoneEmail_defers_manual: $0', noPhoneEmail.engines.manual_outbound.budget_monthly, 0);

const noComm = rich({ constraints: ['no_community_capacity'] });
okTrue('Mix.constraint_noCommunity_defers_community: defer (community_partner)',
  noComm.engines.community_partner.verdict === 'defer');
ok('Mix.constraint_noCommunity_defers_community: $0', noComm.engines.community_partner.budget_monthly, 0);

const noFounder = rich({ constraints: ['founder_wont_post'] });
okTrue('Mix.constraint_founderWontPost_defers_social: defer',
  noFounder.engines.social_content.verdict === 'defer');
ok('Mix.constraint_founderWontPost_defers_social: $0', noFounder.engines.social_content.budget_monthly, 0);

const noPaid = rich({ constraints: ['no_paid_budget'] });
okTrue('Mix.constraint_noPaidBudget_defers_paid: defer',
  noPaid.engines.paid_media.verdict === 'defer');
ok('Mix.constraint_noPaidBudget_defers_paid: $0', noPaid.engines.paid_media.budget_monthly, 0);

const noEvents = rich({ constraints: ['no_events_budget'] });
okTrue('Mix.constraint_noEventsBudget_blocks_events: blocked',
  noEvents.engines.events.verdict === 'blocked');
ok('Mix.constraint_noEventsBudget_blocks_events: $0', noEvents.engines.events.budget_monthly, 0);

console.log('--- Capacity.seatYear1_antitone ---');
[75, 178, 280].forEach(cycle => {
  const prof = E.profileFor(cycle);
  const steadyMo = E.steadyAnnual(120000, cycle, 0) / 12;
  let broken = 0;
  for (let m = 1; m <= 11; m++) {
    if (E.seatYear1(m + 1, steadyMo, prof) > E.seatYear1(m, steadyMo, prof)) broken++;
  }
  okTrue('Capacity.seatYear1_antitone cycle=' + cycle + ' m in 1..11', broken === 0);
});

console.log('--- Hiring.capacityOf_le_frontLoaded / hireCount_minimal ---');
const def = E.compute(D());
const cap = E.DEFAULTS.adv.maxPerMonth;
[1, 3, 5, 7, 9].forEach(n => {
  const front = frontLoaded(n, cap);
  const late = [];
  for (let m = 12; m >= 1 && late.length < n; m--) {
    for (let k = 0; k < cap && late.length < n; k++) late.push(m);
  }
  late.reverse();
  const mid = frontLoaded(n, cap).map((m, i) => Math.min(12, m + (i % 3)));
  const cFront = capacityOf(front, def.existingGross, def.steadyMo, def.prof);
  const cLate = capacityOf(late, def.existingGross, def.steadyMo, def.prof);
  const cMid = capacityOf(mid, def.existingGross, def.steadyMo, def.prof);
  okTrue('Hiring.capacityOf_le_frontLoaded n=' + n + ' late<=front', cLate <= cFront + 1e-6);
  okTrue('Hiring.capacityOf_le_frontLoaded n=' + n + ' shifted<=front', cMid <= cFront + 1e-6);
});

/* hireCount_minimal is about feasible schedules. maxPerMonth is 2, so
 * N-1 hires cannot all sit in month 1. Front-loading under the cap is
 * the most capacity that count can book; it must still miss. */
const nHires = def.newSeats.length;
const fewer = frontLoaded(nHires - 1, cap);
okTrue('Hiring.hireCount_minimal: N-1 front-loaded under cap still misses',
  capacityOf(fewer, def.existingGross, def.steadyMo, def.prof) < def.grossNeeded);

console.log('--- Solver.relax_feasible / relax_clears / Inputs.exitArr_ge_target ---');
const GRID = [];
[3000000, 7000000, 12000000].forEach(targetArr =>
  [0, 2].forEach(rampedAes =>
    [90, 178].forEach(cycleDays =>
      GRID.push({ targetArr, rampedAes, rampingAes: rampedAes ? 0 : 2, cycleDays }))));
let relaxBad = 0, missWhenReachable = 0;
GRID.forEach(g => {
  const out = E.compute(Object.assign(D(), g));
  const per = {};
  out.newSeats.forEach(s => { per[s.hireMonth] = (per[s.hireMonth] || 0) + 1; });
  const feasible = Object.values(per).every(c => c <= E.DEFAULTS.adv.maxPerMonth)
    && out.newSeats.every(s => s.hireMonth >= 1 && s.hireMonth <= 12);
  if (!feasible) relaxBad++;
  const maxFront = frontLoaded(12 * E.DEFAULTS.adv.maxPerMonth, E.DEFAULTS.adv.maxPerMonth);
  const maxCap = capacityOf(maxFront, out.existingGross, out.steadyMo, out.prof);
  if (maxCap + 1e-6 >= out.grossNeeded) {
    if (out.shortfall !== 0) missWhenReachable++;
    if (out.exitArr + 1 < out.inputs.targetArr) missWhenReachable++;
  }
});
okTrue('Solver.relax_feasible: months in 1..12 and at most maxPerMonth (' + GRID.length + ' cases)',
  relaxBad === 0);
okTrue('Solver.Inputs.exitArr_ge_target / relax_clears: reachable => shortfall 0',
  missWhenReachable === 0);
ok('Solver.Inputs.exitArr_ge_target on DEFAULTS: shortfall_usd', def.shortfall, 0);

console.log('--- Support.ratioHires / supportHeadcount_covers / avpsFor_covers ---');
const aeHires = def.newSeats.map(s => s.hireMonth);
const existingAes = def.team.existingAes;
const existingSes = def.team.totalSes - def.team.seHires.length;
const existingBdrs = def.team.totalBdrs - def.team.bdrHires.length;
const ratio = E.DEFAULTS.adv.aePerSe;
let monthMiss = 0;
for (let m = 1; m <= 12; m++) {
  const aes = headcountAt(existingAes, aeHires, m);
  const ses = headcountAt(existingSes, def.team.seHires, m);
  const bdrs = headcountAt(existingBdrs, def.team.bdrHires, m);
  const need = Math.ceil(aes / ratio);
  if (ses < need || bdrs < need) monthMiss++;
}
okTrue('Support.ratioHires_covers / supportHeadcount_covers: SE and BDR every month',
  monthMiss === 0);
let avpMiss = 0;
for (let n = 5; n <= 40; n++) {
  if (n > 8 * E.avpsFor(n)) avpMiss++;
}
okTrue('Support.avpsFor_covers: n <= 8 * avpsFor(n) for n=5..40', avpMiss === 0);

console.log('--- Support.bdrPlan_covers_meetings / bdrFill_covers ---');
okTrue('Support.bdrFill_covers DEFAULTS util <= 1', def.bdrCheck.util <= 1);
okTrue('Support.bdrPlan_covers_meetings DEFAULTS needed <= capacity',
  def.bdrCheck.needed <= def.bdrCheck.capacity + 1e-6);

/* engine/engine.cjs:323: ratio-only scheduling once reported clears at
 * 118 percent BDR utilisation. The meeting pass must close that gap. */
const ratioCap = bdrCapacityOf(def.bdrCheck.ratioHires, existingBdrs);
const ratioUtil = ratioCap > 0 ? def.bdrCheck.needed / ratioCap : Infinity;
okTrue('118% regression witness: ratio-only util exceeds 100% on DEFAULTS',
  ratioUtil > 1);
okTrue('118% regression: meeting pass util <= 100% (was 118% on ratio-only)',
  def.bdrCheck.util <= 1);

let utilOver = 0;
GRID.forEach(g => {
  const out = E.compute(Object.assign(D(), g));
  if (out.bdrCheck.util > 1 && out.status.overall === 'clears') utilOver++;
});
okTrue('Support.bdrFill_covers: no GRID case clears above 100% util', utilOver === 0);

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
