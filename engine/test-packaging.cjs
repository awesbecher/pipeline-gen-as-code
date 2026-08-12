/* Packaging and portability: the failures that only show up once the
 * code leaves this repository. Captured stdout, CommonJS resolution
 * under a hostile ancestor package.json, manifest shape, and skill
 * discovery from a clone. These are the defects OpenAI's install test
 * found in 0.3.0; each one has a test here now.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

let pass = 0, fail = 0;
function ok(name, v, detail) {
  if (v) { pass++; console.log('  ok  ' + name); }
  else { fail++; console.log('FAIL  ' + name + (detail ? '  [' + detail + ']' : '')); }
}
const root = path.resolve(__dirname, '..');
const RUN = path.join(root, 'engine', 'run.cjs');
const FX = require('./fixtures.json');
/* Committed artifacts pin their generation date; captures must use the
 * same one or the byte comparison fails on the clock rather than on a
 * real difference. */
const ENV = Object.assign({}, process.env, { SOURCE_DATE_EPOCH: FX.fixture_epoch });

/* ---------- 1. captured stdout is complete ----------
 * console.log followed by process.exit(0) truncated --json at the pipe
 * buffer (8,192 bytes on macOS) for every consumer that captured the
 * output instead of redirecting it to a file. A file redirect kept
 * working, which is why CI stayed green while installed agents broke.
 * Both capture APIs are tested because they buffer differently. */
console.log('--- captured JSON is complete on every capture path ---');
const committed = fs.readFileSync(path.join(root, 'examples', 'acme', 'output.json'), 'utf8');

const viaExec = execFileSync('node', [RUN, '--example', '--json'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, env: ENV });
const viaSpawn = spawnSync('node', [RUN, '--example', '--json'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, env: ENV }).stdout;
const execBytes = Buffer.byteLength(viaExec);
const spawnBytes = Buffer.byteLength(viaSpawn);

ok('execFileSync capture parses as JSON', (() => { try { JSON.parse(viaExec); return true; } catch (e) { return false; } })(),
  execBytes + ' bytes');
ok('spawnSync capture parses as JSON', (() => { try { JSON.parse(viaSpawn); return true; } catch (e) { return false; } })(),
  spawnBytes + ' bytes');
ok('both capture paths return identical bytes', execBytes === spawnBytes, execBytes + ' vs ' + spawnBytes);
ok('captured output is longer than one pipe buffer (the old truncation point)',
  execBytes > 8192, execBytes + ' bytes');
ok('capture matches the committed fixture byte for byte', viaExec === committed,
  execBytes + ' captured vs ' + Buffer.byteLength(committed) + ' committed');
ok('captured byte count matches the pinned fixture', execBytes === FX.acme_example.json_bytes,
  execBytes + ' vs pinned ' + FX.acme_example.json_bytes);
/* A large board memo travels the same path. */
const board = execFileSync('node', [RUN, '--example', '--board'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, env: ENV });
ok('captured board memo is complete', board.trim().endsWith('A human approves every external send, in every engine, always.'),
  Buffer.byteLength(board) + ' bytes');
ok('the runner never calls process.exit after writing stdout',
  !/process\.exit\(0\)/.test(fs.readFileSync(RUN, 'utf8')));

/* ---------- 2. CommonJS survives a hostile ancestor ----------
 * A plugin cache installed under a directory whose package.json says
 * "type": "module" turned engine.js and mix.js into ES modules, and the
 * runner died with "MIX.recommend is not a function". The .cjs
 * extensions make the module system explicit regardless of ancestors. */
console.log('--- CommonJS resolution under an ESM ancestor ---');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pgac-esm-'));
try {
  fs.writeFileSync(path.join(tmp, 'package.json'), JSON.stringify({ name: 'hostile-ancestor', type: 'module', version: '1.0.0' }));
  const cache = path.join(tmp, 'plugin-cache');
  fs.mkdirSync(cache);
  ['engine', 'company', 'skills', 'playbook', 'bin'].forEach(d => {
    fs.cpSync(path.join(root, d), path.join(cache, d), { recursive: true });
  });
  /* No package.json of its own: the .cjs extension has to carry it. */
  const r = spawnSync('node', [path.join(cache, 'engine', 'run.cjs'), '--example', '--json'],
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, cwd: cache });
  ok('runner exits 0 beneath an ancestor package.json with "type": "module"', r.status === 0,
    (r.stderr || '').split('\n')[0]);
  ok('output still parses there', (() => { try { return JSON.parse(r.stdout).model_version.length > 0; } catch (e) { return false; } })());
  ok('no ES module error surfaced', !/is not a function|Cannot use import|require\(\) of ES Module/.test(r.stderr || ''),
    (r.stderr || '').split('\n')[0]);
  /* The wrapper resolves its own root, with no environment variables. */
  const w = spawnSync(path.join(cache, 'bin', 'nine-engines'), ['--example'],
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, cwd: os.tmpdir(), env: { PATH: process.env.PATH } });
  ok('bin/nine-engines works from an unrelated cwd with a stripped environment', w.status === 0,
    (w.stderr || '').split('\n')[0]);
  ok('wrapper output is the engine mix', /Engine mix/.test(w.stdout || ''));
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

/* ---------- 3. implementation files are unambiguous CommonJS ---------- */
console.log('--- module system is explicit ---');
const engineFiles = fs.readdirSync(path.join(root, 'engine')).filter(f => /\.(js|cjs|mjs)$/.test(f));
ok('no bare .js remains in engine/', engineFiles.every(f => f.endsWith('.cjs')), engineFiles.filter(f => !f.endsWith('.cjs')).join(', '));
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
ok('plugin root package.json declares CommonJS', pkg.type === 'commonjs', String(pkg.type));
ok('package.json documents a maintained Node floor (18 and 20 are end of life)',
  /(>=\s*)?(22|24)/.test(String(pkg.engines && pkg.engines.node)) && !/18|20/.test(String(pkg.engines && pkg.engines.node)),
  String(pkg.engines && pkg.engines.node));
ok('package.json test script runs every suite',
  ['test-engine', 'test-mix', 'test-params', 'test-docs', 'test-packaging'].every(s => pkg.scripts.test.includes(s)));
ok('no runtime dependencies', !pkg.dependencies || Object.keys(pkg.dependencies).length === 0);

/* ---------- 4. manifests ---------- */
console.log('--- manifests ---');
const codex = JSON.parse(fs.readFileSync(path.join(root, '.codex-plugin', 'plugin.json'), 'utf8'));
const iface = codex.interface || {};
['displayName', 'shortDescription', 'longDescription', 'developerName', 'category'].forEach(f => {
  ok('codex interface.' + f + ' is a non-empty string', typeof iface[f] === 'string' && iface[f].trim().length > 0);
});
ok('codex interface.capabilities is an array of strings',
  Array.isArray(iface.capabilities) && iface.capabilities.length > 0 && iface.capabilities.every(c => typeof c === 'string' && c.trim()));
const dp = iface.defaultPrompt || iface.default_prompt;
ok('codex interface.defaultPrompt exists (the official validator requires it)', Array.isArray(dp) && dp.length > 0);
ok('codex defaultPrompt has at most 3 entries', Array.isArray(dp) && dp.length <= 3, dp && String(dp.length));
ok('every codex defaultPrompt entry is under 128 characters',
  Array.isArray(dp) && dp.every(s => typeof s === 'string' && s.length > 0 && s.length <= 128),
  Array.isArray(dp) ? dp.map(s => s.length).join(', ') : 'n/a');
ok('codex manifest carries no rejected top-level fields', !codex.hooks);
const claudePlugin = JSON.parse(fs.readFileSync(path.join(root, '.claude-plugin', 'plugin.json'), 'utf8'));
const claudeMarket = JSON.parse(fs.readFileSync(path.join(root, '.claude-plugin', 'marketplace.json'), 'utf8'));
ok('claude and codex manifests agree on the plugin name', claudePlugin.name === codex.name);
ok('all manifests agree on version',
  claudePlugin.version === codex.version && claudeMarket.metadata.version === codex.version && pkg.version === codex.version,
  [claudePlugin.version, codex.version, claudeMarket.metadata.version, pkg.version].join(' / '));

/* ---------- 5. skill discovery and portability ---------- */
console.log('--- skills are discoverable and environment-free ---');
const agentSkill = path.join(root, '.agents', 'skills', 'nine-engines', 'SKILL.md');
ok('.agents/skills/nine-engines/SKILL.md exists for clone-first discovery', fs.existsSync(agentSkill));
const agentBody = fs.readFileSync(agentSkill, 'utf8');
ok('the clone-first skill declares the name nine-engines', /^name:\s*nine-engines\s*$/m.test(agentBody));
ok('the clone-first skill has a description in frontmatter', /^description:\s*\S/m.test(agentBody));
ok('the clone-first skill states the root-resolution rule', /three directories up/.test(agentBody));
ok('the clone-first skill points at the canonical procedure',
  /skills\/nine-engines\/SKILL\.md/.test(agentBody));
ok('the clone-first skill keeps the standing rule', /approves every external send/.test(agentBody));

const skillFiles = ['skills/nine-engines/SKILL.md', 'skills/setup/SKILL.md', 'skills/monday/SKILL.md', 'skills/review/SKILL.md', '.agents/skills/nine-engines/SKILL.md'];
skillFiles.forEach(f => {
  const s = fs.readFileSync(path.join(root, f), 'utf8');
  /* The variables may be NAMED, but only to say they are not required. */
  const commands = s.split('\n').filter(l => /^\s{4,}\S/.test(l) || /^\s*(node|<root>|\$\(|bin\/)/.test(l.trim()));
  ok(f + ': no command depends on a Claude-only variable',
    !commands.some(l => /\$\{?CLAUDE_(PLUGIN_ROOT|PROJECT_DIR)/.test(l)),
    commands.filter(l => /CLAUDE_/.test(l)).slice(0, 1).join(''));
  ok(f + ': no $ARGUMENTS placeholder outside prose',
    !/^\s*\$ARGUMENTS\s*$/m.test(s));
});
ok('the wrapper exists and is executable', (() => {
  const st = fs.statSync(path.join(root, 'bin', 'nine-engines'));
  return (st.mode & 0o111) !== 0;
})());
ok('the wrapper resolves its own root rather than reading the environment', (() => {
  const s = fs.readFileSync(path.join(root, 'bin', 'nine-engines'), 'utf8');
  return /dirname/.test(s) && !/\$\{?CLAUDE_/.test(s);
})());

/* ---------- 6. installed-layout smoke ----------
 * Bundle only what a plugin ships, run from an unrelated working
 * directory, and confirm the runner never reaches for sample data. */
console.log('--- installed layout, foreign cwd ---');
const tmp2 = fs.mkdtempSync(path.join(os.tmpdir(), 'pgac-install-'));
try {
  ['engine', 'company', 'skills', 'playbook', 'bin', 'docs'].forEach(d => {
    fs.cpSync(path.join(root, d), path.join(tmp2, d), { recursive: true });
  });
  fs.cpSync(path.join(root, 'package.json'), path.join(tmp2, 'package.json'));
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'pgac-project-'));
  fs.mkdirSync(path.join(project, 'company'));
  fs.copyFileSync(path.join(root, 'examples', 'acme', 'params.yaml'), path.join(project, 'company', 'params.yaml'));
  const r = spawnSync('node', [path.join(tmp2, 'engine', 'run.cjs'), path.join(project, 'company', 'params.yaml'), '--json'],
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, cwd: project });
  ok('installed bundle runs a project params file from a foreign cwd', r.status === 0, (r.stderr || '').split('\n')[0]);
  ok('the run is not flagged as the bundled example', (() => {
    try { return JSON.parse(r.stdout).illustrative_example === false; } catch (e) { return false; }
  })());
  const bare = spawnSync('node', [path.join(tmp2, 'engine', 'run.cjs')], { encoding: 'utf8', cwd: project });
  ok('no params file and no --example exits 2 instead of using sample data', bare.status === 2);
  fs.rmSync(project, { recursive: true, force: true });
} finally {
  fs.rmSync(tmp2, { recursive: true, force: true });
}

/* ---------- 7. the CI workflow itself parses ----------
 * A step name containing an unquoted colon is valid-looking YAML that
 * GitHub rejects outright, which takes the whole gate offline rather
 * than failing one job. Node has no YAML parser and this repo has no
 * dependencies, so check the shapes that actually break. */
console.log('--- workflow file is well formed ---');
const wf = fs.readFileSync(path.join(root, '.github', 'workflows', 'tests.yml'), 'utf8');
const wfLines = wf.split('\n');
const badNames = [];
wfLines.forEach((line, i) => {
  const m = line.match(/^\s*(?:- )?name:\s*(.+?)\s*$/);
  if (!m) return;
  const value = m[1];
  const quoted = /^".*"$/.test(value) || /^'.*'$/.test(value);
  if (!quoted && /:\s/.test(value)) badNames.push('line ' + (i + 1) + ': ' + value);
});
ok('no workflow name holds an unquoted colon', badNames.length === 0, badNames.slice(0, 2).join(' | '));
const tabs = wfLines.map((l, i) => /\t/.test(l) ? i + 1 : null).filter(Boolean);
ok('workflow uses no tab indentation', tabs.length === 0, tabs.slice(0, 3).join(', '));
ok('workflow runs every suite', ['test-engine', 'test-mix', 'test-params', 'test-docs', 'test-packaging']
  .every(s => wf.includes(s + '.cjs')));
ok('workflow tests macOS, where the truncation reproduced', /macos-latest/.test(wf));
ok('workflow parses captured JSON instead of discarding it',
  /JSON\.parse\(out\)/.test(wf) && !/--example --json > \/dev\/null/.test(wf));
ok('workflow runs both official validators',
  /claude plugin validate/.test(wf) && /validate_plugin\.py/.test(wf));
ok('CODEX_VALIDATOR_REF is a 40-char commit SHA, not a moving branch',
  /CODEX_VALIDATOR_REF:\s*[0-9a-f]{40}/.test(wf) && !/CODEX_VALIDATOR_REF:\s*main\s*$/m.test(wf));
ok('the wrapper is committed executable', (() => {
  const { execFileSync } = require('child_process');
  try {
    const out = execFileSync('git', ['ls-files', '-s', 'bin/nine-engines'], { cwd: root, encoding: 'utf8' });
    return out.startsWith('100755');
  } catch (e) { return true; /* not a git checkout, skip */ }
})());

console.log('--- CLAUDE.md and AGENTS.md stay identical ---');
ok('CLAUDE.md and AGENTS.md are byte-identical',
  fs.readFileSync(path.join(root, 'CLAUDE.md'), 'utf8') ===
  fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8'));

console.log('--- params.example.yaml copies stay identical ---');
ok('company, acme, and skill-bundled params.example.yaml match', (() => {
  const a = fs.readFileSync(path.join(root, 'company', 'params.example.yaml'), 'utf8');
  const b = fs.readFileSync(path.join(root, 'examples', 'acme', 'params.yaml'), 'utf8');
  const c = fs.readFileSync(path.join(root, 'skills', 'nine-engines', 'references', 'params.example.yaml'), 'utf8');
  return a === b && a === c;
})());

console.log('--- doctor CLI ---');
const doc = spawnSync('node', [RUN, '--doctor'], { encoding: 'utf8', cwd: root, env: ENV });
ok('--doctor exits 0 in a clone with calculators present', doc.status === 0,
  (doc.stderr || '').split('\n')[0]);
ok('--doctor prints Node vs package engines',
  /Node: v/.test(doc.stdout) && /requires >=22/.test(doc.stdout));
ok('--doctor prints install mode clone', /Install mode: clone/.test(doc.stdout));
ok('--doctor prints params path and plan dir',
  /Params path:/.test(doc.stdout) && /Plan dir:/.test(doc.stdout));
ok('--doctor does not combine with --json',
  spawnSync('node', [RUN, '--doctor', '--json'], { encoding: 'utf8', cwd: root }).status === 2);
const docBin = spawnSync(path.join(root, 'bin', 'nine-engines'), ['doctor'],
  { encoding: 'utf8', cwd: root, env: { PATH: process.env.PATH } });
ok('bin/nine-engines doctor works', docBin.status === 0 && /Nine Engines doctor/.test(docBin.stdout),
  (docBin.stderr || '').split('\n')[0]);


console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exitCode = fail ? 1 : 0;
