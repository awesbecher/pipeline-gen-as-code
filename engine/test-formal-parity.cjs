/* Formal/JS parity: the Lean-pinned solver_default numbers in
 * formal/PARITY.json must match the committed fixture.
 * Theorems: Solver.solverDefault_existingGross, solverDefault_grossCapacity,
 * solverDefault_exitArr, solverDefault_newSeats, Support.solverDefault_totalBdrs,
 * solverDefault_bdrPlan, solverDefault_totalSes, solverDefault_bdrCapacity.
 */
'use strict';
const path = require('path');
const FX = require('./fixtures.json');
const PARITY = require(path.join(__dirname, '..', 'formal', 'PARITY.json'));

let pass = 0, fail = 0;
function ok(name, got, want) {
  const good = JSON.stringify(got) === JSON.stringify(want);
  if (good) { pass++; console.log('  ok  ' + name); }
  else { fail++; console.log('FAIL  ' + name + '  got ' + JSON.stringify(got) + ' want ' + JSON.stringify(want)); }
}
function okTrue(name, v) { v ? (pass++, console.log('  ok  ' + name)) : (fail++, console.log('FAIL  ' + name)); }

const S = FX.solver_default;

console.log('--- formal/PARITY.json matches fixtures.json solver_default ---');
ok('existing_gross (Solver.solverDefault_existingGross, rounded)', PARITY.existing_gross, S.existing_gross_usd);
ok('gross (Solver.solverDefault_grossCapacity, rounded)', PARITY.gross, S.gross_capacity_usd);
ok('exit (Solver.solverDefault_exitArr, rounded)', PARITY.exit, S.exit_arr_usd);
ok('hires (Solver.solverDefault_newSeats)', PARITY.hires, S.new_ae_hire_months);
ok('total_bdrs (Support.solverDefault_totalBdrs)', PARITY.total_bdrs, S.total_bdrs);
ok('new_bdr_hire_months (Support.solverDefault_bdrPlan, sorted)', PARITY.new_bdr_hire_months, S.new_bdr_hire_months);
ok('total_ses (Support.solverDefault_totalSes)', PARITY.total_ses, S.total_ses);
ok('bdr_capacity (Support.solverDefault_bdrCapacity)', PARITY.bdr_capacity, S.bdr_capacity_points);

okTrue('Lean existing_gross rational is 18083261/5', PARITY.existing_gross_rational === '18083261/5');
okTrue('Lean gross rational is 69916387/10', PARITY.gross_rational === '69916387/10');
okTrue('Lean exit rational is 702214709/100', PARITY.exit_rational === '702214709/100');

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
