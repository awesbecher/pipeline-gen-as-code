/* Documentation agreement: the README, the committed example, and the
 * pinned fixtures must publish the same numbers, the retired claims
 * must stay retired, and voice rules hold. */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const FX = require('./fixtures.json');

let pass = 0, fail = 0;
function ok(name, v, detail) {
  if (v) { pass++; console.log('  ok  ' + name); }
  else { fail++; console.log('FAIL  ' + name + (detail ? '  [' + detail + ']' : '')); }
}
const root = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const money = n => '$' + Math.round(n).toLocaleString('en-US');

console.log('--- README numbers come from fixtures ---');
const readme = read('README.md');
const S = FX.solver_default, A = FX.acme_example;
ok('README quotes solver gross ' + money(S.gross_capacity_usd), readme.includes(money(S.gross_capacity_usd)));
ok('README quotes solver exit ' + money(S.exit_arr_usd), readme.includes(money(S.exit_arr_usd)));
ok('README quotes hire months', readme.includes(S.new_ae_hire_months.join(', ')));
ok('README quotes allocated total', readme.includes(money(A.allocated_total_usd)));
ok('README quotes payroll run rate', readme.includes(money(A.capacity.sales_payroll_run_rate_usd)));
['automated_outbound', 'manual_outbound', 'abm', 'events'].forEach(e => {
  ok('README quotes ' + e + ' budget ' + money(A.budget_monthly[e]), readme.includes(money(A.budget_monthly[e])));
});

console.log('--- retired claims stay retired ---');
const proseFiles = ['README.md', 'CLAUDE.md', 'AGENTS.md',
  'skills/nine-engines/SKILL.md', 'skills/nine-engines/references/math.md',
  'skills/nine-engines/references/engines.md', 'playbook/00-portfolio.md'];
proseFiles.forEach(f => {
  const s = read(f);
  ok(f + ': no "verified to the dollar"', !/verified to the dollar/i.test(s));
  ok(f + ': no "lands in the same forecast"', !/lands? in the same forecast/i.test(s));
});
ok('README labels the fixture as illustrative', /illustrative/i.test(readme));
ok('README does not claim "Real output, not a promise"', !readme.includes('Real output, not a promise'));
ok('README states the model boundary (spend not converted to meetings)', /not convert(ed)? .*(engine )?spend into meetings|spend is not converted/i.test(readme));

console.log('--- committed example agrees with the runner ---');
const live = execFileSync('node', [path.join(__dirname, 'run.cjs'), '--example', '--json'], { encoding: 'utf8' });
const committed = read('examples/acme/output.json');
ok('examples/acme/output.json matches a fresh --example --json run', live.trim() === committed.trim());
const board = read('examples/acme/BOARD.md');
ok('BOARD.md carries the illustrative label', board.includes('Illustrative fixture'));
ok('BOARD.md quotes the fixture gross', board.includes(money(S.gross_capacity_usd)));
const outJson = JSON.parse(committed);
const sumBudget = Object.values(outJson.mix.engines).reduce((s, e) => s + e.budget_monthly, 0);
ok('committed output conserves cash exactly', sumBudget === outJson.mix.allocated_total &&
  outJson.mix.allocated_total + outJson.mix.unallocated_total === outJson.inputs_normalized.cash_monthly_pipeline);

console.log('--- source registry integrity ---');
const sources = read('docs/SOURCES.md');
const idPattern = /\b(AO|PLG|MO|ABM|CP|PM|SEO|SC|EV|CAP|MIX)-\d+\b/g;
const registryIds = new Set(sources.match(idPattern));
ok('registry defines claim IDs', registryIds.size >= 30, String(registryIds.size));
let missing = [];
['examples/acme/PLAN.md', 'examples/acme/monday.md', 'examples/acme/review.md']
  .concat(fs.readdirSync(path.join(root, 'playbook')).filter(f => f.endsWith('.md')).map(f => 'playbook/' + f))
  .forEach(f => {
    (read(f).match(idPattern) || []).forEach(id => { if (!registryIds.has(id)) missing.push(f + ':' + id); });
  });
ok('every cited claim ID resolves in the registry', missing.length === 0, missing.slice(0, 5).join(', '));
ok('registry labels operator heuristics', (sources.match(/OPERATOR HEURISTIC/g) || []).length >= 5);

console.log('--- plan artifact validation (committed example) ---');
const plan = read('examples/acme/PLAN.md');
ok('PLAN.md names an owner per funded engine', (plan.match(/Owner: /g) || []).length >= 6);
ok('PLAN.md carries tripwires', (plan.match(/Tripwire:/g) || []).length >= 4);
ok('PLAN.md has the Approved Overrides section', plan.includes('## Approved overrides'));

console.log('--- PLAN.md dollar figures come from fixtures ---');
Object.keys(A.budget_monthly).filter(e => A.budget_monthly[e] > 0).forEach(e => {
  ok('PLAN.md quotes ' + e + ' budget ' + money(A.budget_monthly[e]), plan.includes(money(A.budget_monthly[e])));
});
ok('PLAN.md quotes allocated total ' + money(A.allocated_total_usd), plan.includes(money(A.allocated_total_usd)));
const CAP = A.capacity;
[['gross capacity', CAP.gross_capacity_usd], ['gross needed', CAP.gross_needed_usd],
 ['exit ARR', CAP.exit_arr_usd], ['payroll run rate', CAP.sales_payroll_run_rate_usd],
 ['year-1 sales comp', CAP.year1_sales_comp_usd]].forEach(pair => {
  ok('PLAN.md quotes ' + pair[0] + ' ' + money(pair[1]), plan.includes(money(pair[1])));
});
ok('review.md persists an override with all fields', ['Model recommendation', 'Approved verdict', 'Rationale', 'Approver'].every(k => read('examples/acme/review.md').includes(k)));
ok('monday.md ends on the standing rule', read('examples/acme/monday.md').includes('A human approves every external send'));

console.log('--- voice ---');
const everything = ['README.md', 'CHANGELOG.md', 'docs/SOURCES.md', 'docs/RELEASE.md', 'docs/PRIVACY.md',
  'examples/acme/PLAN.md', 'examples/acme/monday.md', 'examples/acme/review.md', 'examples/acme/BOARD.md']
  .concat(proseFiles);
let dashes = [];
everything.forEach(f => { if (read(f).includes(String.fromCharCode(0x2014))) dashes.push(f); });
ok('zero em dashes across prose and generated artifacts', dashes.length === 0, dashes.join(', '));

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
