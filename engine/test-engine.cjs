/* Capacity model verification.
 * Two named fixtures, pinned in engine/fixtures.json:
 *   workbook_schedule  forced deck hire months; parity to the source
 *                      workbook within a stated tolerance (the workbook
 *                      rounds monthly cells; the model computes exactly)
 *   solver_default     the solver at DEFAULTS; pinned exactly
 * Plus behavior tests: current-team inputs, ramp cohorts, proration,
 * shortfall invariant, and the solver objective.
 */
require('./engine.cjs');
const E = globalThis.ENGINE;
const FX = require('./fixtures.json');
const D = () => JSON.parse(JSON.stringify(E.DEFAULTS));

let pass = 0, fail = 0;
function ok(name, got, want, tol) {
  const good = Math.abs(got - want) <= (tol === undefined ? 0 : tol);
  if (good) { pass++; console.log('  ok  ' + name + '  (' + Math.round(got) + ')'); }
  else { fail++; console.log('FAIL  ' + name + '  got ' + got + ' want ' + want + (tol ? ' ±' + tol : ' exactly')); }
}
function okTrue(name, v) { v ? (pass++, console.log('  ok  ' + name)) : (fail++, console.log('FAIL  ' + name)); }

const prof = E.profileFor(178);
const steadyMo = 1000000 / 12;

console.log('--- unit economics (workbook seat yields, ±$10 for workbook cell rounding) ---');
ok('steady state at $120K / 178d ~ $1.0M', E.steadyAnnual(120000, 178, 0), 1000000, 500);
ok('month-1 hire year-1 yield = $600K', E.seatYear1(1, steadyMo, prof), 600000, 5);
ok('month-3 hire = $433K (workbook Rep I)', E.seatYear1(3, steadyMo, prof), 433334, 5);
ok('month-6 hire = $200K (workbook Rep K)', E.seatYear1(6, steadyMo, prof), 200001, 5);
ok('carried ramped = $1.0M', E.seatYear1(-9, steadyMo, prof), 999996, 10);
ok('carried tenure-4 = $850K (Rep C)', E.seatYear1(-2, steadyMo, prof), 849999, 10);
ok('carried tenure-3 = $767K (Rep D)', E.seatYear1(-1, steadyMo, prof), 766666, 10);

console.log('--- FIXTURE workbook_schedule (forced deck months; parity within stated tolerance) ---');
const W = FX.workbook_schedule;
let gross = 0;
W.forced_hire_months.forEach(m => gross += E.seatYear1(m, steadyMo, prof));
ok('computed gross, exact pin', Math.round(gross), W.computed_gross_usd);
ok('computed net-new, exact pin', Math.round(gross * 0.7), W.computed_net_new_usd);
ok('computed exit ARR, exact pin', Math.round(1200000 + gross * 0.7 + 1000000 - 70000), W.computed_exit_arr_usd);
ok('workbook parity: gross within $' + W.parity_tolerance_usd, gross, W.workbook_reported_gross_usd, W.parity_tolerance_usd);
ok('workbook parity: exit within $' + (W.parity_tolerance_usd + 10), 1200000 + gross * 0.7 + 1000000 - 70000, W.workbook_reported_exit_arr_usd, W.parity_tolerance_usd + 10);
ok('in-year AE comp (workbook rule)', 1732500 + 0.165 * gross * 0.7, 2536200, 300);

console.log('--- FIXTURE solver_default (exact pins) ---');
const S = FX.solver_default;
const r = E.compute(D());
ok('gross capacity, exact pin', Math.round(r.grossCapacity), S.gross_capacity_usd);
ok('exit ARR, exact pin', Math.round(r.exitArr), S.exit_arr_usd);
ok('new AE hires, exact pin', r.newSeats.length, S.new_ae_hires);
okTrue('hire months exact: ' + r.newSeats.map(s => s.hireMonth).join(','),
  JSON.stringify(r.newSeats.map(s => s.hireMonth)) === JSON.stringify(S.new_ae_hire_months));
ok('existing gross, exact pin', Math.round(r.existingGross), S.existing_gross_usd);
ok('shortfall, exact pin', Math.round(r.shortfall), S.shortfall_usd);
okTrue('target cleared: exit >= 7.0M', r.exitArr >= 7000000 - 1);
okTrue('activity meetings ' + r.activity.meetings + ' ~ 1100-1500', r.activity.meetings > 1000 && r.activity.meetings < 1600);
okTrue('wins ' + r.activity.wins + ' ~ 40', r.activity.wins >= 38 && r.activity.wins <= 44);
okTrue('burn total in 3.5M-6M', r.burn.totalCost > 3500000 && r.burn.totalCost < 6000000);
okTrue('derivation assumptions disclosed (SE, BDR, leadership, ramp stagger)',
  r.assumptions.length >= 3 && r.assumptions.join(' ').includes('derived'));

console.log('--- solver objective: fewest hires, then latest feasible starts ---');
okTrue('front-loaded: last hire month ' + r.lastHireMonth + ' in 1..7', r.lastHireMonth <= 7 && r.lastHireMonth >= 1);
okTrue('overshoot < one month-1 seat', r.grossCapacity >= r.grossNeeded && (r.grossCapacity - r.grossNeeded) < 600000);
okTrue('no month exceeds maxPerMonth', (() => {
  const per = {};
  r.newSeats.forEach(s => per[s.hireMonth] = (per[s.hireMonth] || 0) + 1);
  return Object.values(per).every(c => c <= E.DEFAULTS.adv.maxPerMonth);
})());
okTrue('minimal: dropping the last hire misses the target', (() => {
  const months = r.newSeats.map(s => s.hireMonth).slice(0, -1);
  let g = r.existingGross;
  months.forEach(m => g += E.seatYear1(m, r.steadyMo, r.prof));
  return g < r.grossNeeded;
})());
okTrue('maximally delayed: any single hire moved later breaks target or cap', (() => {
  const base = r.newSeats.map(s => s.hireMonth);
  for (let i = 0; i < base.length; i++) {
    const trial = base.slice();
    if (trial[i] >= 12) continue;
    trial[i] += 1;
    const count = trial.filter(m => m === trial[i]).length;
    let g = r.existingGross;
    trial.forEach(m => g += E.seatYear1(m, r.steadyMo, r.prof));
    if (g >= r.grossNeeded && count <= E.DEFAULTS.adv.maxPerMonth) return false;
  }
  return true;
})());

console.log('--- current-team inputs change the answer ---');
const b0 = E.compute(Object.assign(D(), { bdrs: 0 }));
const b4 = E.compute(Object.assign(D(), { bdrs: 4 }));
okTrue('BDR count drives hires: 0 current -> ' + b0.team.newBdrs + ' new, 4 current -> ' + b4.team.newBdrs + ' new',
  b0.team.newBdrs > b4.team.newBdrs);
/* Carried and hired heads are priced on the same basis, so swapping a
 * month-1 hire for a carried BDR must not move total payroll. What
 * moves cost is total head-months, not who is on the roster first. */
okTrue('carried and hired BDRs are priced consistently (same fleet, same cost)',
  b0.team.totalBdrs === b4.team.totalBdrs && Math.abs(b0.burn.totalCost - b4.burn.totalCost) < 1,
  'fleet ' + b0.team.totalBdrs + '/' + b4.team.totalBdrs + ', cost delta ' + Math.round(Math.abs(b0.burn.totalCost - b4.burn.totalCost)));
okTrue('new-BDR spend falls exactly by the carried heads it replaces',
  Math.abs((b0.burn.bdrNew - b4.burn.bdrNew) - 4 * (E.DEFAULTS.adv.comp.bdr.base + E.DEFAULTS.adv.comp.bdr.variable * 0.7)) < 1);
/* A surplus roster is carried honestly and costs more. */
const b8 = E.compute(Object.assign(D(), { bdrs: 8 }));
okTrue('a surplus BDR roster raises year-1 comp above the lean plan',
  b8.team.totalBdrs === 8 && b8.burn.totalCost > b4.burn.totalCost + 100000);
const b100 = E.compute(Object.assign(D(), { bdrs: 100 }));
okTrue('surplus BDRs carried honestly: 100 current -> total ' + b100.team.totalBdrs + ', payroll grows',
  b100.team.totalBdrs === 100 && b100.burn.runRate > b4.burn.runRate + 1000000);
const s3 = E.compute(Object.assign(D(), { ses: 3 }));
okTrue('SE count supplied is respected', s3.team.totalSes >= 3 && s3.team.newSes <= Math.max(0, s3.team.totalSes - 3));
const led = E.compute(Object.assign(D(), { salesLeaders: 1 }));
okTrue('supplied leadership is priced into carried payroll', led.burn.carriedCost > r.burn.carriedCost + 200000);
okTrue('no derived sales-leadership assumption when supplied', !led.assumptions.join(' ').includes('sales leadership not supplied'));

console.log('--- ramp cohorts ---');
const cohortEqual = E.compute(Object.assign(D(), { rampingTenures: [4, 3] }));
ok('explicit 4/3 tenures reproduce the default stagger exactly', Math.round(cohortEqual.grossCapacity), S.gross_capacity_usd);
const cohortLate = E.compute(Object.assign(D(), { rampingTenures: [1, 1] }));
okTrue('younger cohorts lower carried gross (tenure 1,1 vs 4,3)', cohortLate.existingGross < r.existingGross - 100000);
okTrue('cohort input silences the stagger assumption', !cohortEqual.assumptions.join(' ').includes('stagger'));

console.log('--- BDR capacity proration ---');
okTrue('prorated fleet capacity is below full-year naive for late hires', (() => {
  const naive = r.team.totalBdrs * 144;
  const prorated = r.bdrCheck.capacity;
  return r.team.bdrHires.some(m => m > 1) ? prorated < naive : prorated === naive;
})());

console.log('--- edge cases and the shortfall invariant ---');
const cov = E.compute(Object.assign(D(), { targetArr: 3000000 }));
okTrue('covered case: no hires, shortfall 0', cov.covered && cov.newSeats.length === 0 && cov.shortfall === 0);
const imp = E.compute(Object.assign(D(), { targetArr: 60000000 }));
okTrue('impossible case flags shortfall', imp.shortfall > 0);
okTrue('impossible case shortfall equals needed minus capacity', Math.abs(imp.shortfall - (imp.grossNeeded - imp.grossCapacity)) < 1);
okTrue('impossible case still front-loads all months', imp.newSeats.length >= 16);
const fast = E.compute(Object.assign(D(), { acv: 50000, cycleDays: 75 }));
okTrue('fast profile at 75d', fast.prof.key === 'fast');
okTrue('fast steady ~ derived anchor', Math.abs(fast.steady - 8.3333 * 178 / 75 * 50000) < 1000);
const ent = E.compute(Object.assign(D(), { acv: 250000, cycleDays: 280 }));
okTrue('enterprise profile at 280d', ent.prof.key === 'long');
const zeroTeam = E.compute(Object.assign(D(), { rampedAes: 0, rampingAes: 0 }));
okTrue('zero carried team still solves or flags', zeroTeam.shortfall >= 0);
okTrue('every returned number is finite', (() => {
  let good = true;
  (function walk(o) {
    if (o === null || o === undefined) return;
    if (typeof o === 'number') { if (!isFinite(o)) good = false; return; }
    if (Array.isArray(o)) return o.forEach(walk);
    if (typeof o === 'object') return Object.keys(o).forEach(k => k === 'inputs' ? null : walk(o[k]));
  })(r);
  return good;
})());

console.log('--- invariants that hold for every input, not just the fixture ---');
/* The board-truth rule: a plan may never report that it clears while a
 * support layer is over capacity. Swept, not assumed. */
const GRID = [];
[60000, 120000, 400000].forEach(acv =>
  [90, 178, 280].forEach(cycleDays =>
    [0, 2, 8].forEach(rampedAes =>
      [0, 3].forEach(bdrs =>
        [3000000, 7000000, 25000000].forEach(targetArr =>
          GRID.push({ acv, cycleDays, rampedAes, bdrs, targetArr }))))));
let clearsWhileOver = [], negativeSupport = [], payrollGaps = [];
const comp = E.DEFAULTS.adv.comp;
GRID.forEach(g => {
  const out = E.compute(Object.assign(D(), g, { rampingAes: 0, rampingTenures: null }));
  if (out.status.overall === 'clears' && out.bdrCheck.util > 1) {
    clearsWhileOver.push(JSON.stringify(g) + ' util ' + out.bdrCheck.util.toFixed(3));
  }
  if (out.bdrCheck.util < 0 || !isFinite(out.bdrCheck.capacity)) negativeSupport.push(JSON.stringify(g));
  /* Payroll completeness: the run rate must equal the OTE of every seat
   * the plan assumes, carried or hired. A role that appears in the plan
   * and not in this sum is a role someone forgot to pay. */
  let expected = out.team.totalAes * (comp.ae.base + comp.ae.variable)
               + out.team.totalSes * (comp.se.base + comp.se.variable)
               + out.team.totalBdrs * (comp.bdr.base + comp.bdr.variable)
               + out.team.carriedAvps * (comp.avp.base + comp.avp.variable)
               + out.team.carriedBdrMgrs * (comp.bdrMgr.base + comp.bdrMgr.variable)
               + out.team.carriedSeLeads * (comp.seLead.base + comp.seLead.variable);
  out.team.leaders.forEach(l => { expected += comp[l.role].base + comp[l.role].variable; });
  if (Math.abs(expected - out.burn.runRate) > 0.5) {
    payrollGaps.push(JSON.stringify(g) + ' expected ' + Math.round(expected) + ' got ' + Math.round(out.burn.runRate));
  }
});
okTrue('no input reports overall clearance while BDR support is over capacity (' + GRID.length + ' cases)',
  clearsWhileOver.length === 0);
if (clearsWhileOver.length) console.log('      ' + clearsWhileOver.slice(0, 3).join(' | '));
okTrue('support capacity is always finite and non-negative', negativeSupport.length === 0);
okTrue('sales payroll run rate prices every seat the plan assumes', payrollGaps.length === 0);
if (payrollGaps.length) console.log('      ' + payrollGaps.slice(0, 3).join(' | '));

/* Carried managers are priced whether they are hired or already in seat. */
const noMgrs = E.compute(Object.assign(D(), { rampedAes: 8, rampingAes: 0, bdrs: 3, ses: 3, salesLeaders: 1 }));
const withMgrs = E.compute(Object.assign(D(), { rampedAes: 8, rampingAes: 0, bdrs: 3, ses: 3, salesLeaders: 1, bdrManagers: 1, seLeads: 1 }));
okTrue('an assumed BDR manager and SE lead are hired and priced when not supplied',
  noMgrs.team.leaders.some(l => l.role === 'bdrMgr') && noMgrs.team.leaders.some(l => l.role === 'seLead'));
okTrue('supplying those managers carries them instead, at the same run rate',
  Math.abs(noMgrs.burn.runRate - withMgrs.burn.runRate) < 0.5 &&
  withMgrs.team.carriedBdrMgrs === 1 && withMgrs.team.carriedSeLeads === 1);
okTrue('the BDR manager and SE lead OTE reaches the run rate ($565,000 was missing in 0.3.0)',
  noMgrs.burn.runRate >= 565000);

/* A frozen plan is the board sensitivity path. */
const basePlan = E.compute(D());
const frozen = E.compute(Object.assign(D(), { plan: basePlan.plan }));
ok('a frozen plan reproduces its own capacity exactly', Math.round(frozen.grossCapacity), Math.round(basePlan.grossCapacity));
okTrue('a frozen plan keeps the same hire months', frozen.plan.newSeatMonths.join(',') === basePlan.plan.newSeatMonths.join(','));
const advSlow = JSON.parse(JSON.stringify(E.DEFAULTS.adv));
advSlow.steadyOverride = E.steadyAnnual(120000, 178, 0) * 0.85;
const frozenSlow = E.compute(Object.assign(D(), { plan: basePlan.plan, adv: advSlow }));
okTrue('a frozen plan under lower productivity misses instead of quietly rehiring',
  frozenSlow.newSeats.length === basePlan.newSeats.length && frozenSlow.shortfall > 0);

/* Ramped reps are fully productive on every profile, including the
 * 12-month enterprise ramp where they used to score 90 percent. */
[75, 178, 280, 400].forEach(cycleDays => {
  const one = E.compute(Object.assign(D(), { cycleDays, rampedAes: 1, rampingAes: 0 }));
  okTrue('a ramped AE is exactly 100 percent productive at ' + cycleDays + ' days',
    Math.abs(one.seats[0].year1 - one.steady) < 0.01);
});

/* Boundary guards: the module refuses nonsense instead of returning it. */
[['acv', { acv: 'x' }], ['cycleDays', { cycleDays: 0 }], ['rampedAes', { rampedAes: 1.5 }],
 ['baseArr', { baseArr: NaN }], ['adv', { adv: null }]].forEach(([field, bad]) => {
  okTrue('compute() throws on invalid ' + field, (() => {
    try { E.compute(Object.assign(D(), bad)); return false; } catch (e) { return /ENGINE\.compute/.test(e.message); }
  })());
});


console.log('--- v0.3.2: leadership coverage is the rule as written ---');
/* One AVP per eight AEs, none below five. floor() used to hold a single
 * AVP from 9 through 15 AEs, which is not one per eight. */
[[4, 0], [5, 1], [8, 1], [9, 2], [15, 2], [16, 2], [17, 3], [24, 3], [25, 4]].forEach(([aes, want]) => {
  ok('avpsFor(' + aes + ')', E.avpsFor(aes), want);
});
okTrue('the AVP constants are published, not buried',
  E.AES_PER_AVP === 8 && E.AVP_THRESHOLD_AES === 5);
/* Each leader starts when their threshold is crossed. */
const ledPlan = E.compute(D());
const avpMonths = ledPlan.team.leaders.filter(l => l.role === 'avp').map(l => l.month);
okTrue('a second AVP starts later than the first, not in the same month',
  avpMonths.length < 2 || avpMonths[1] > avpMonths[0], JSON.stringify(avpMonths));
okTrue('every leader month falls inside the plan year',
  ledPlan.team.leaders.every(l => l.month >= 1 && l.month <= 12));
okTrue('the BDR manager arrives no earlier than the third BDR', (() => {
  const mgr = ledPlan.team.leaders.find(l => l.role === 'bdrMgr');
  if (!mgr) return true;
  const existingBdrs = ledPlan.team.totalBdrs - ledPlan.team.bdrHires.length;
  const inSeatAtMgrMonth = existingBdrs + ledPlan.team.bdrHires.filter(m => m <= mgr.month).length;
  return inSeatAtMgrMonth >= 3;
})());
okTrue('a carried leader is never re-hired', (() => {
  const carried = E.compute(Object.assign(D(), { salesLeaders: 5, bdrManagers: 1, seLeads: 1 }));
  return carried.team.leaders.length === 0 &&
    carried.team.carriedAvps === 5 && carried.team.carriedBdrMgrs === 1 && carried.team.carriedSeLeads === 1;
})());
/* The leadership rule is priced into the run rate either way. */
okTrue('adding the ninth AE adds an AVP and its full OTE', (() => {
  const eight = E.compute(Object.assign(D(), { rampedAes: 8, rampingAes: 0, targetArr: 1500000 }));
  const nine = E.compute(Object.assign(D(), { rampedAes: 9, rampingAes: 0, targetArr: 1500000 }));
  const avpOte = E.DEFAULTS.adv.comp.avp.base + E.DEFAULTS.adv.comp.avp.variable;
  const aeOte = E.DEFAULTS.adv.comp.ae.base + E.DEFAULTS.adv.comp.ae.variable;
  return E.avpsFor(8) === 1 && E.avpsFor(9) === 2 &&
    Math.abs((nine.burn.runRate - eight.burn.runRate) - (avpOte + aeOte)) < 1;
})());


console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
