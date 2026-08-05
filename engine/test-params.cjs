/* Input layer verification: every fail-open case from the release
 * audit must now fail closed with a field-specific error, and the CLI
 * contract (--help, --version, --example, exit codes) must hold. */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const PARAMS = require('./params.cjs');

let pass = 0, fail = 0;
function ok(name, v, detail) {
  if (v) { pass++; console.log('  ok  ' + name); }
  else { fail++; console.log('FAIL  ' + name + (detail ? '  [' + detail + ']' : '')); }
}

const GOOD = [
  'company: X', 'acv: 120000', 'cycle_days: 178', 'cash_monthly_pipeline: 25000',
  'team:', '  aes_ramped: 2', '  aes_ramping: 1', '  bdrs: 1', '  gtm_engineer: true',
  'product:', '  self_serve: "no"', 'constraints: []'
].join('\n');

function load(yaml) { return PARAMS.load(yaml, false); }
function errFor(yaml, needle) {
  const r = load(yaml);
  return r.errors.some(e => e.includes(needle)) ? true : JSON.stringify(r.errors);
}

console.log('--- happy path ---');
const good = load(GOOD);
ok('valid file has zero errors', good.errors.length === 0, JSON.stringify(good.errors));
ok('normalized team integers', good.params.team.aes_ramped === 2 && good.params.team.bdrs === 1);

console.log('--- audit fail-open cases now fail closed ---');
ok('standard YAML block list parses',
  load(GOOD.replace('constraints: []', 'constraints:\n  - no_phone')).params.constraints[0] === 'no_phone');
const bareYes = load(GOOD.replace('self_serve: "no"', 'self_serve: yes'));
ok('bare yes normalized to "yes" with a warning',
  bareYes.errors.length === 0 && bareYes.params.product.self_serve === 'yes' &&
  bareYes.warnings.some(w => w.includes('normalized')));
ok('quoted number rejected with guidance', errFor(GOOD.replace('acv: 120000', 'acv: "120000"'), 'quoted number') === true);
ok('negative budget rejected', errFor(GOOD.replace('cash_monthly_pipeline: 25000', 'cash_monthly_pipeline: -5000'), 'cash_monthly_pipeline') === true);
ok('negative ACV rejected', errFor(GOOD.replace('acv: 120000', 'acv: -120000'), 'acv') === true);
ok('negative headcount rejected', errFor(GOOD.replace('  bdrs: 1', '  bdrs: -3'), 'team.bdrs') === true);
ok('zero cycle rejected', errFor(GOOD.replace('cycle_days: 178', 'cycle_days: 0'), 'cycle_days') === true);
ok('fractional AEs rejected', errFor(GOOD.replace('  aes_ramped: 2', '  aes_ramped: 2.5'), 'whole number') === true);
ok('misspelled budget field rejected as unknown', errFor(GOOD.replace('cash_monthly_pipeline', 'cash_monthly_pipelin'), 'unknown field') === true);
ok('missing required field reported', errFor(GOOD.replace('acv: 120000\n', ''), 'acv: required') === true);
ok('unknown constraint value rejected', errFor(GOOD.replace('constraints: []', 'constraints: [no_faxes]'), 'no_faxes') === true);
ok('unknown top-level key rejected', errFor(GOOD + '\nsurprise_key: 1', 'surprise_key') === true);
ok('bad self_serve enum rejected', errFor(GOOD.replace('"no"', '"maybe"'), 'self_serve') === true);
ok('bad stage enum rejected', errFor('stage: series-z\n' + GOOD, 'series-z') === true);
ok('churn above bound rejected', errFor(GOOD + '\narr_target_12mo_usd: 1\ncapacity:\n  base_arr_usd: 1\n  churn_pct: 0.9', 'churn_pct') === true);
ok('capacity without target rejected', errFor(GOOD + '\ncapacity:\n  base_arr_usd: 1', 'arr_target_12mo_usd') === true);
ok('tenure list length mismatch rejected', errFor(GOOD.replace('  gtm_engineer: true', '  gtm_engineer: true\n  aes_ramping_tenure_months: [4, 3]'), 'one tenure per ramping AE') === true);
ok('control characters rejected', errFor(GOOD.replace('company: X', 'company: "XY"'), 'control characters') === true);
ok('tabs rejected with guidance', errFor(GOOD.replace('  aes_ramped', '\t aes_ramped'), 'tab') === true);
ok('YAML anchors rejected as unsupported', errFor(GOOD.replace('company: X', 'company: &anchor X'), 'unsupported') === true);
ok('duplicate keys rejected', errFor(GOOD + '\nacv: 5', 'duplicate') === true);
ok('malformed JSON gives a clean error', PARAMS.load('{ nope', true).errors[0].includes('invalid JSON'));
const viaJson = PARAMS.load(JSON.stringify({
  company: 'X', acv: 120000, cycle_days: 178, cash_monthly_pipeline: 25000,
  team: { aes_ramped: 2, aes_ramping: 1, bdrs: 1, gtm_engineer: true },
  product: { self_serve: 'no' }, constraints: []
}), true);
ok('equivalent JSON input validates', viaJson.errors.length === 0, JSON.stringify(viaJson.errors));
ok('schema_version mismatch rejected', errFor('schema_version: 9\n' + GOOD, 'schema_version') === true);

console.log('--- extreme values ---');
ok('infinite-scale ACV rejected', errFor(GOOD.replace('acv: 120000', 'acv: 999999999999'), 'acv') === true);
ok('personas as block list parses', load(GOOD + '\npersonas:\n  - CISO\n  - "VP Eng"').params.personas.length === 2);

console.log('--- CLI contract ---');
const RUN = path.join(__dirname, 'run.cjs');
function cli(args, stdinFile) {
  return spawnSync('node', [RUN].concat(args), { encoding: 'utf8' });
}
ok('--help prints usage, exit 0', (() => { const r = cli(['--help']); return r.status === 0 && r.stdout.includes('Usage:') && !r.stdout.includes('Engine mix'); })());
ok('--version prints versions, exit 0', (() => { const r = cli(['--version']); return r.status === 0 && /model .*params schema/.test(r.stdout); })());
ok('no arguments exits 2 with usage', (() => { const r = cli([]); return r.status === 2 && r.stderr.includes('Usage:'); })());
ok('missing file exits 2, no silent example fallback', (() => { const r = cli(['/nonexistent/params.yaml']); return r.status === 2 && r.stderr.includes('--example'); })());
ok('--example runs with an explicit fixture notice', (() => { const r = cli(['--example']); return r.status === 0 && (r.stdout + r.stderr).includes('Illustrative') || (r.stderr.includes('illustrative')); })());
const tmp = path.join(os.tmpdir(), 'pgac-bad-' + process.pid + '.yaml');
fs.writeFileSync(tmp, GOOD.replace('cash_monthly_pipeline: 25000', 'cash_monthlly_pipeline: 25000'));
ok('invalid file exits 2 with the field named', (() => { const r = cli([tmp]); return r.status === 2 && r.stderr.includes('cash_monthlly_pipeline'); })());
fs.writeFileSync(tmp, GOOD);
ok('valid minimal file runs without capacity, exit 0', (() => { const r = cli([tmp]); return r.status === 0 && r.stdout.includes('Capacity model not run'); })());
ok('--json emits versioned finite output', (() => {
  const r = cli([tmp, '--json']);
  if (r.status !== 0) return false;
  const d = JSON.parse(r.stdout);
  return d.output_schema_version === 3 && d.params_schema_version === 1 && d.capacity === null;
})());
ok('markdown escapes pipe in company name', (() => {
  fs.writeFileSync(tmp, GOOD.replace('company: X', 'company: "Acme | DROP"'));
  const r = cli([tmp]);
  return r.status === 0 && r.stdout.includes('Acme \\| DROP');
})());
fs.unlinkSync(tmp);

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
