/* Engine verification against the workbook and deck numbers */
require('./engine.js');
const E = globalThis.ENGINE;
const D = JSON.parse(JSON.stringify(E.DEFAULTS));

let pass = 0, fail = 0;
function ok(name, got, want, tol) {
  const good = Math.abs(got - want) <= (tol === undefined ? 1 : tol);
  if (good) { pass++; console.log('  ok  ' + name + '  (' + Math.round(got) + ')'); }
  else { fail++; console.log('FAIL  ' + name + '  got ' + got + ' want ' + want); }
}
function okTrue(name, v) { v ? (pass++, console.log('  ok  ' + name)) : (fail++, console.log('FAIL  ' + name)); }

const prof = E.profileFor(178);
console.log('--- unit economics ---');
ok('steady state at $120K / 178d ~ $1.0M', E.steadyAnnual(120000, 178, 0), 1000000, 500);
const steadyMo = 1000000 / 12;
ok('month-1 hire year-1 yield = $600K', E.seatYear1(1, steadyMo, prof), 600000, 5);
ok('month-3 hire = $433K (workbook Rep I)', E.seatYear1(3, steadyMo, prof), 433334, 5);
ok('month-6 hire = $200K (workbook Rep K)', E.seatYear1(6, steadyMo, prof), 200001, 5);
ok('carried ramped = $1.0M', E.seatYear1(-9, steadyMo, prof), 999996, 10);
ok('carried prior Oct = $850K (Rep C)', E.seatYear1(-2, steadyMo, prof), 849999, 10);
ok('carried prior Nov = $767K (Rep D)', E.seatYear1(-1, steadyMo, prof), 766666, 10);

console.log('--- workbook grid reproduction (forced deck hire months) ---');
const deckMonths = [-9, -9, -2, -1, 1, 1, 2, 2, 3, 4, 6, 7];
let gross = 0;
deckMonths.forEach(m => gross += E.seatYear1(m, steadyMo, prof));
ok('gross capacity = $6.958M', gross, 6958328, 50);
const net = gross * 0.7;
ok('net new-logo = $4.871M', net, 4870830, 50);
ok('exit ARR = $7.0008M', 1200000 + net + 1000000 - 70000, 7000830, 60);
ok('in-year AE comp = $2.536M (workbook rule)', 1732500 + 0.165 * net, 2536200, 300);

console.log('--- solver at tool defaults ---');
const r = E.compute(D);
okTrue('no shortfall', r.shortfall === 0);
okTrue('target cleared: exit ' + Math.round(r.exitArr) + ' >= 7.0M', r.exitArr >= 7000000 - 1);
okTrue('front-loaded: last hire month ' + r.lastHireMonth + ' <= 7', r.lastHireMonth <= 7 && r.lastHireMonth >= 1);
okTrue('seat count sane: ' + r.newSeats.length + ' new (deck used 8)', r.newSeats.length >= 5 && r.newSeats.length <= 9);
okTrue('overshoot < one seat: ' + Math.round(r.grossCapacity - r.grossNeeded), r.grossCapacity >= r.grossNeeded && (r.grossCapacity - r.grossNeeded) < 600000);
ok('existing gross = $3.617M (A-D carried)', r.existingGross, 3616661, 60);
okTrue('activity meetings ' + r.activity.meetings + ' ~ 1100-1500', r.activity.meetings > 1000 && r.activity.meetings < 1600);
okTrue('wins ' + r.activity.wins + ' ~ 40', r.activity.wins >= 38 && r.activity.wins <= 44);
okTrue('burn total ' + Math.round(r.burn.totalCost) + ' in 3.5M-6M', r.burn.totalCost > 3500000 && r.burn.totalCost < 6000000);
okTrue('SE adds ' + r.team.newSes + ', BDR adds ' + r.team.newBdrs, r.team.newSes >= 2 && r.team.newBdrs >= 2);
okTrue('leadership rows: ' + r.team.leaders.map(l => l.label + '@m' + l.month).join(', '), r.team.leaders.length >= 1);
console.log('     hire months: ' + r.newSeats.map(s => s.hireMonth).join(','));
console.log('     exit ' + Math.round(r.exitArr) + ' | gross ' + Math.round(r.grossCapacity) + ' | build cost ' + Math.round(r.burn.buildCost) + ' | total comp ' + Math.round(r.burn.totalCost) + ' | $' + r.burn.perDollar.toFixed(2) + ' per $1 net-new');

console.log('--- edge cases ---');
const cov = E.compute(Object.assign({}, D, { targetArr: 3000000 }));
okTrue('covered case: no hires', cov.covered && cov.newSeats.length === 0);
const imp = E.compute(Object.assign({}, D, { targetArr: 60000000 }));
okTrue('impossible case flags shortfall', imp.shortfall > 0);
okTrue('impossible case still front-loads all months', imp.newSeats.length >= 16);
const fast = E.compute(Object.assign({}, D, { acv: 50000, cycleDays: 75 }));
okTrue('fast profile at 75d', fast.prof.key === 'fast');
okTrue('fast steady ' + Math.round(fast.steady) + ' ~ $989K', Math.abs(fast.steady - 8.3333 * 178 / 75 * 50000) < 1000);
const ent = E.compute(Object.assign({}, D, { acv: 250000, cycleDays: 280 }));
okTrue('enterprise profile at 280d', ent.prof.key === 'long');
const zeroTeam = E.compute(Object.assign({}, D, { rampedAes: 0, rampingAes: 0 }));
okTrue('zero carried team still solves or flags', zeroTeam.shortfall >= 0);
console.log('     zero-team hires: ' + zeroTeam.newSeats.length + ', shortfall ' + Math.round(zeroTeam.shortfall));

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
