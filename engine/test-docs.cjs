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

console.log('--- v0.3.2: the board memo states its own limits ---');
const boardMemo = read('examples/acme/BOARD.md');
ok('board memo carries a provenance line (versions, date, params hash)',
  /model \d+\.\d+\.\d+ · mix \d+\.\d+\.\d+/.test(boardMemo) &&
  /generated \d{4}-\d{2}-\d{2}/.test(boardMemo) && /parameters [0-9a-f]{12}/.test(boardMemo));
ok('board memo opens with a decision box, not a math summary', /## Decision box/.test(boardMemo));
['Pipeline cash committed', 'New AE hires and timing', 'Incremental year-one sales comp',
 'Sales payroll run rate', 'Base margin on gross capacity', 'Downside gap',
 'Decisions required today'].forEach(row => {
  ok('decision box row: ' + row, boardMemo.includes(row));
});
ok('board memo says demand coverage is not modeled', /Demand coverage \| NOT MODELED/.test(boardMemo));
ok('board memo says cash and runway are not modeled', /Cash and runway viability \| NOT MODELED/.test(boardMemo));
ok('board memo refuses to let a staffing verdict stand in for a company plan',
  /not a statement that the company plan clears/.test(boardMemo));
ok('board memo surfaces input warnings instead of swallowing them',
  /## Warnings on these inputs/.test(boardMemo) && /illustrative example/i.test(boardMemo));
ok('the machine output carries the same not-modeled statuses', (() => {
  const out = JSON.parse(read('examples/acme/output.json'));
  const dims = (out.status.not_modeled || []).map(n => n.dimension).sort().join(',');
  return dims === 'cash_and_runway,demand_coverage' && out.params_hash && out.generated_on;
})());
ok('the example output reports the versions the code actually has', (() => {
  const out = JSON.parse(read('examples/acme/output.json'));
  const pkg = JSON.parse(read('package.json'));
  return out.model_version === FX.model_version && out.mix_version === FX.mix_version &&
    out.model_version === pkg.version;
})());
ok('every manifest agrees with package.json on the version', (() => {
  const pkg = JSON.parse(read('package.json'));
  return [read('.claude-plugin/plugin.json'), read('.codex-plugin/plugin.json')]
    .map(s => JSON.parse(s).version).every(v => v === pkg.version);
})());
/* Assertion counts are quoted in three places. They drift, and a stale
 * count in a release note is exactly the kind of small lie this repo
 * says it does not tell. Require them to agree with each other. */
ok('CHANGELOG, RELEASE and the model card quote the same assertion count', (() => {
  const latest = s => {
    const m = [...s.matchAll(/(\d{3}) assertions/g)].map(x => Number(x[1]));
    return m.length ? m[0] : null;
  };
  const a = latest(read('CHANGELOG.md')), b = latest(read('docs/RELEASE.md')), c = latest(read('docs/MODEL_CARD.md'));
  return a && a === b && b === c && a >= 276;
})(), 'see the three files');

console.log('--- v0.3.2: the public-maintainer surface exists ---');
['CONTRIBUTING.md', 'SECURITY.md', 'ROADMAP.md', 'CODEOWNERS', 'docs/MODEL_CARD.md',
 'docs/EVIDENCE-AUDIT.md', '.github/pull_request_template.md',
 '.github/ISSUE_TEMPLATE/bug_report.yml'].forEach(f => {
  ok('exists: ' + f, fs.existsSync(path.join(root, f)));
});
ok('README links the maintainer surface', (() => {
  const s = read('README.md');
  return ['CONTRIBUTING.md', 'SECURITY.md', 'docs/MODEL_CARD.md'].every(f => s.includes(f));
})());
ok('secrets are gitignored', (() => {
  const g = read('.gitignore');
  return /^\.env$/m.test(g) && /^\.env\.\*$/m.test(g) && /params\.json/.test(g);
})());
ok('no doc still advertises an end-of-life Node floor', (() => {
  const pkg = JSON.parse(read('package.json'));
  return !/18|20/.test(String(pkg.engines.node));
})());
/* The voice rule applies to the new prose too. */
['CONTRIBUTING.md', 'SECURITY.md', 'ROADMAP.md', 'docs/MODEL_CARD.md', 'docs/EVIDENCE-AUDIT.md',
  'docs/CODEX.md', 'skills/README.md', 'examples/REAL_CASE_TEMPLATE.md']
  .forEach(f => {
    ok(f + ': no em dashes', !read(f).includes(String.fromCharCode(0x2014)));
  });

console.log('--- output schema and Node matrix cannot drift from code ---');
const runSrc = read('engine/run.cjs');
const schemaVer = Number((runSrc.match(/const OUTPUT_SCHEMA_VERSION = (\d+);/) || [])[1]);
ok('run.cjs declares OUTPUT_SCHEMA_VERSION', Number.isInteger(schemaVer) && schemaVer >= 4, String(schemaVer));
const card = read('docs/MODEL_CARD.md');
const cardHeader = card.split('\n').slice(0, 12).join('\n');
ok('MODEL_CARD header output schema matches run.cjs',
  cardHeader.includes('output schema v' + schemaVer));
ok('MODEL_CARD versioning section matches run.cjs',
  card.includes('(`engine/run.cjs`, currently ' + schemaVer + ')'));
const pkgEngines = JSON.parse(read('package.json')).engines.node;
const nodeFloor = Number(String(pkgEngines).match(/(\d+)/)[1]);
ok('package.json engines floor is 22 or higher', nodeFloor >= 22, String(pkgEngines));
const wf = read('.github/workflows/tests.yml');
ok('workflow matrix is Node 22 and 24 on Ubuntu and macOS',
  /node:\s*\[22,\s*24\]/.test(wf) && /macos-latest/.test(wf));
function claimsCurrentCiRunsEol(s) {
  return /CI runs the same chain on Node 18/.test(s)
    || /run on Node 18, 20, and 22/.test(s)
    || /Node 18 or newer/.test(s);
}
ok('CONTRIBUTING current CI prose is Node 22 and 24, not 18/20',
  /Node 22 and 24/.test(read('CONTRIBUTING.md')) && !claimsCurrentCiRunsEol(read('CONTRIBUTING.md')));
ok('MODEL_CARD current CI prose is Node 22 and 24, not 18/20',
  /Node 22 and 24/.test(card) && !claimsCurrentCiRunsEol(card));
ok('README names the Node 22 floor and 22/24 CI',
  /floor is\s+Node 22/.test(readme) && /CI runs 22 and 24/.test(readme) && !claimsCurrentCiRunsEol(readme));
const agentSkill = read('.agents/skills/nine-engines/SKILL.md');
ok('.agents skill Node floor matches package engines',
  new RegExp('Node ' + nodeFloor + ' or newer').test(agentSkill) && !/Node 18/.test(agentSkill));

console.log('--- permanent demand and cash boundary; engines_running is annotation ---');
ok('README states conversion will not land until a future version',
  /will not be/.test(readme) && /meetings or bookings/.test(readme));
ok('README states cash/runway is the operator check',
  /affordability is the operator's check/.test(readme));
ok('MODEL_CARD states demand is permanently out of scope',
  /Permanently out of scope/.test(card) && /future version explicitly adds it/.test(card));
ok('board memo states the permanent demand/cash boundary',
  /permanently out of scope/.test(boardMemo));
ok('README says engines_running does not change verdicts',
  /annotation only/.test(readme) && /does not change them/.test(readme));
ok('intake says engines_running does not change verdicts',
  /does\s+not change them/.test(read('skills/nine-engines/references/intake.md')));
ok('params.example.yaml comments engines_running as narrative context',
  /narrative context; annotated on verdicts; does not change them/.test(read('company/params.example.yaml')));

console.log('--- skill-only install is a hard gate ---');
['skills/nine-engines/SKILL.md', 'skills/setup/SKILL.md', '.agents/skills/nine-engines/SKILL.md']
  .forEach(f => {
    const s = read(f);
    ok(f + ': STOPs when calculators are missing',
      /STOP/.test(s) && /engine\/run\.cjs/.test(s) && /bin\/nine-engines/.test(s));
    ok(f + ': does not hand-apply verdicts as the product',
      !/apply the decision rules[\s\S]{0,80}by hand/.test(s));
  });
ok('README says a skills-only copy has no numbers',
  /only copied `skills\/`/.test(readme) && /do not have numbers/.test(readme));

console.log('--- Codex, skills map, case template ---');
ok('docs/CODEX.md exists and quotes the README Codex CLI version',
  fs.existsSync(path.join(root, 'docs/CODEX.md')) &&
  read('docs/CODEX.md').includes('0.147.0-alpha.6.5') &&
  readme.includes('docs/CODEX.md'));
ok('skills/README.md maps setup/monday/review to Claude slash commands', (() => {
  const s = read('skills/README.md');
  return ['/nine-engines:setup', '/nine-engines:monday', '/nine-engines:review'].every(c => s.includes(c));
})());
ok('case template is labeled TEMPLATE ONLY and has the ROADMAP v1 sections', (() => {
  const s = read('examples/REAL_CASE_TEMPLATE.md');
  return /TEMPLATE ONLY/.test(s) &&
    /Parameters as entered/.test(s) && /Model output/.test(s) &&
    /Overrides/.test(s) && /Decisions the team actually made/.test(s) &&
    /What the model did not know/.test(s);
})());


console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
