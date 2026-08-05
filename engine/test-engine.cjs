/* Capacity model verification.
 * Two named fixtures, pinned in engine/fixtures.json:
 *   workbook_schedule  forced deck hire months; parity to the source
 *                      workbook within a stated tolerance (the workbook
 *                      rounds monthly cells; the model computes exactly)
 *   solver_default     the solver at DEFAULTS; pinned exactly
 * Plus behavior tests: current-team inputs, ramp cohorts, proration,
 * shortfall invariant, and the solver objective.
 */
require('./engine.js');
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
okTrue('BDR count drives year-1 comp (hiring vs carrying)', Math.abs(b0.burn.totalCost - b4.burn.totalCost) > 10000);
const b100 = E.compute(Object.assign(D(), { bdrs: 100 }));
okTrue('surplus BDRs carried honestly: 100 current -> total ' + b100.team.totalBdrs + ', payroll grows',
  b100.team.totalBdrs === 100 && b100.burn.runRate > b4.burn.runRate + 1000000);
const s3 = E.compute(Object.assign(D(), { ses: 3 }));
okTrue('SE count supplied is respected', s3.team.totalSes >= 3 && s3.team.newSes <= Math.max(0, s3.team.totalSes - 3));
const led = E.compute(Object.assign(D(), { salesLeaders: 1 }));
okTrue('supplied leadership is priced into carried payroll', led.burn.carriedCost > r.burn.carriedCost + 200000);
okTrue('no derived-leadership assumption when supplied', !led.assumptions.join(' ').includes('leadership not supplied'));

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

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
