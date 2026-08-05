/* Mix engine verification: scenario verdicts, threshold boundaries,
 * the full constraint sweep, and exact allocation conservation. */
const MIX = require('./mix.cjs');

let pass = 0, fail = 0;
function is(name, got, want) {
  if (got === want) { pass++; console.log('  ok  ' + name); }
  else { fail++; console.log('FAIL  ' + name + '  got ' + got + ' want ' + want); }
}
function ok(name, v) { v ? (pass++, console.log('  ok  ' + name)) : (fail++, console.log('FAIL  ' + name)); }

function base(over) {
  return Object.assign({
    acv: 120000, cash_monthly_pipeline: 25000,
    team: { aes_ramped: 1, aes_ramping: 0, bdrs: 1, gtm_engineer: true },
    product: { self_serve: 'no', developer_facing: false },
    constraints: [], engines_running: []
  }, over || {});
}

console.log('--- scenario verdicts ---');
const a = MIX.recommend(base({ team: { aes_ramped: 1, aes_ramping: 0, bdrs: 1, gtm_engineer: true } }));
is('A: automated outbound runs', a.engines.automated_outbound.verdict, 'run_now');
is('A: manual outbound runs', a.engines.manual_outbound.verdict, 'run_now');
is('A: ABM runs', a.engines.abm.verdict, 'run_now');
is('A: events qualify but defer at $25K, unfundable to their floor', a.engines.events.verdict, 'defer');
ok('A: events defer reason names the floor and the offered amount',
  /\$15,000 floor/.test(a.engines.events.reason) && /funds it at \$/.test(a.engines.events.reason));
is('A: PLG deferred with no self-serve', a.engines.plg.verdict, 'defer');
is('A: SEO instruments', a.engines.seo_aeo.verdict, 'instrument_now');

const b = MIX.recommend(base({
  acv: 30000, cash_monthly_pipeline: 6000,
  team: { aes_ramped: 0, aes_ramping: 1, bdrs: 0, gtm_engineer: true },
  product: { self_serve: 'yes', developer_facing: true }
}));
is('B: PLG runs at velocity ACV', b.engines.plg.verdict, 'run_now');
is('B: community instruments for dev product', b.engines.community_partner.verdict, 'instrument_now');
is('B: ABM deferred below enterprise ACV', b.engines.abm.verdict, 'defer');
is('B: paid deferred under budget floor', b.engines.paid_media.verdict, 'defer');
is('B: events deferred', b.engines.events.verdict, 'defer');

const c = MIX.recommend(base({
  acv: 90000, cash_monthly_pipeline: 20000,
  team: { aes_ramped: 2, aes_ramping: 0, bdrs: 1, gtm_engineer: false },
  product: { self_serve: 'partial', developer_facing: false },
  constraints: ['no_events_budget', 'founder_wont_post', 'no_phone']
}));
is('C: events blocked by constraint', c.engines.events.verdict, 'blocked');
is('C: social deferred without the founder', c.engines.social_content.verdict, 'defer');
is('C: manual outbound degrades, not dies, without phone', c.engines.manual_outbound.verdict, 'instrument_now');
is('C: partial self-serve instruments PLG', c.engines.plg.verdict, 'instrument_now');

const d = MIX.recommend(base({
  acv: 100000, cash_monthly_pipeline: 12000,
  team: { aes_ramped: 0, aes_ramping: 0, bdrs: 0, gtm_engineer: true }
}));
is('D: ABM instruments without reps', d.engines.abm.verdict, 'instrument_now');
is('D: paid waits for ABM to run, not just exist', d.engines.paid_media.verdict, 'defer');

console.log('--- threshold boundary table ---');
function verdictAt(field, value, engine) {
  const p = base({});
  if (field === 'acv') p.acv = value;
  if (field === 'cash') p.cash_monthly_pipeline = value;
  return MIX.recommend(p).engines[engine].verdict;
}
is('manual at $24,999 defers', verdictAt('acv', 24999, 'manual_outbound'), 'defer');
is('manual at $25,000 runs', verdictAt('acv', 25000, 'manual_outbound'), 'run_now');
is('ABM at $74,999 defers', verdictAt('acv', 74999, 'abm'), 'defer');
is('ABM at $75,000 runs (with a rep)', verdictAt('acv', 75000, 'abm'), 'run_now');
/* Qualification gates on total budget are necessary but not sufficient:
 * the engine also has to be funded to its own floor by the split. */
is('events at $14,999 cash defers on the qualification gate', verdictAt('cash', 14999, 'events'), 'defer');
is('events at $15,000 cash still defers: the split cannot reach the floor', verdictAt('cash', 15000, 'events'), 'defer');
is('events run once the split can carry $15,000', verdictAt('cash', 90000, 'events'), 'run_now');
is('paid at $7,999 cash defers on the qualification gate', verdictAt('cash', 7999, 'paid_media'), 'defer');
is('paid at $8,000 cash still defers: the split cannot reach the floor', verdictAt('cash', 8000, 'paid_media'), 'defer');
is('paid runs once the split can carry $8,000', verdictAt('cash', 120000, 'paid_media'), 'run_now');

console.log('--- spend floors bind on the allocation, not the total budget ---');
const FLOORS = { paid_media: 8000, events: 15000 };
let floorViolations = [];
[6000, 8000, 12000, 15000, 25000, 40000, 60000, 75000, 90000, 120000, 250000, 1000000].forEach(cash => {
  const m = MIX.recommend(base({ cash_monthly_pipeline: cash }));
  Object.keys(FLOORS).forEach(e => {
    const g = m.engines[e];
    if (g.verdict === 'run_now' && g.budget_monthly < FLOORS[e]) {
      floorViolations.push(e + ' funded $' + g.budget_monthly + ' at cash $' + cash);
    }
    if (g.verdict !== 'run_now' && g.budget_monthly !== 0) {
      floorViolations.push(e + ' unfunded verdict carried $' + g.budget_monthly);
    }
  });
});
ok('no engine with a floor is ever funded below it', floorViolations.length === 0, floorViolations.slice(0, 3).join('; '));
const cut = MIX.recommend(base({ cash_monthly_pipeline: 25000 }));
ok('the demotion is explained in the notes', cut.notes.some(n => /floor, so it is deferred/.test(n)));
ok('cash freed by a floor demotion is reallocated, not lost',
  cut.allocated_total >= 24990 && cut.allocated_total <= 25000, 'allocated ' + cut.allocated_total);
const plgLo = MIX.recommend(base({ acv: 49999, product: { self_serve: 'yes', developer_facing: false } }));
const plgHi = MIX.recommend(base({ acv: 50000, product: { self_serve: 'yes', developer_facing: false } }));
is('PLG at $49,999 runs', plgLo.engines.plg.verdict, 'run_now');
is('PLG at $50,000 instruments', plgHi.engines.plg.verdict, 'instrument_now');

console.log('--- constraint sweep: no reason may recommend an excluded channel ---');
const CONSTRAINTS = ['no_email', 'no_phone', 'no_paid_budget', 'no_events_budget', 'no_community_capacity', 'founder_wont_post'];
/* A reason may acknowledge an exclusion ("the email leg is off"); it may
 * not recommend the excluded channel. Strip compliance language first,
 * then any surviving mention of a banned channel is a violation. */
function sanitize(reason) {
  return reason.replace(/no email outbound|the email leg is off by constraint|no phone coverage|LinkedIn only|LinkedIn-only/gi, '');
}
const BANNED = { no_email: /email|inbox/i, no_phone: /phone|dial/i };
let sweepViolations = [];
for (let mask = 0; mask < 64; mask++) {
  const cons = CONSTRAINTS.filter((_, i) => mask & (1 << i));
  const out = MIX.recommend(base({ constraints: cons }));
  MIX.ENGINES.forEach(e => {
    const g = out.engines[e];
    if (g.verdict === 'blocked' || g.verdict === 'defer') return;
    const clean = sanitize(g.reason);
    cons.forEach(cn => {
      if (BANNED[cn] && BANNED[cn].test(clean)) {
        sweepViolations.push(cons.join('+') + ' -> ' + e + ': ' + g.reason);
      }
    });
  });
}
ok('all 64 constraint subsets: zero channel violations in funded reasons', sweepViolations.length === 0);
if (sweepViolations.length) sweepViolations.slice(0, 5).forEach(v => console.log('      VIOLATION ' + v));
const both = MIX.recommend(base({ constraints: ['no_email', 'no_phone'] }));
is('no_email+no_phone: manual defers (LinkedIn-only fails the bar)', both.engines.manual_outbound.verdict, 'defer');
is('no_email+no_phone: automated blocked', both.engines.automated_outbound.verdict, 'blocked');
ok('no_email alone: manual runs on phone+LinkedIn, reason names no email leg',
  MIX.recommend(base({ constraints: ['no_email'] })).engines.manual_outbound.reason.includes('email leg is off'));
ok('events reason adapts channels under no_email (at a budget that funds events)',
  /phone and LinkedIn/.test(MIX.recommend(base({ constraints: ['no_email'], cash_monthly_pipeline: 90000 })).engines.events.reason));
ok('no_paid_budget gives paid media its own reason, not the budget-floor one',
  /off by constraint/.test(MIX.recommend(base({ constraints: ['no_paid_budget'], cash_monthly_pipeline: 120000 })).engines.paid_media.reason));

console.log('--- allocation conservation, exact ---');
[a, b, c, d, both].forEach((out, i) => {
  const cash = [25000, 6000, 20000, 12000, 25000][i];
  const sumB = MIX.ENGINES.reduce((s, e) => s + out.engines[e].budget_monthly, 0);
  ok('case ' + i + ': allocated_total equals engine sum', sumB === out.allocated_total);
  ok('case ' + i + ': allocated + unallocated equals cash exactly', out.allocated_total + out.unallocated_total === cash);
  const bpsRun = out.run_now.reduce((s, e) => s + out.engines[e].budget_share_bps, 0);
  const bpsInst = out.instrument_now.reduce((s, e) => s + out.engines[e].budget_share_bps, 0);
  ok('case ' + i + ': run pool bps ' + bpsRun + ' exact', out.run_now.length ? bpsRun === 8500 : bpsRun === 0);
  ok('case ' + i + ': instrument pool bps ' + bpsInst + ' exact', out.instrument_now.length ? bpsInst === 1500 : bpsInst === 0);
});
const none = MIX.recommend(base({
  acv: 10000, cash_monthly_pipeline: 5000,
  team: { aes_ramped: 0, aes_ramping: 0, bdrs: 0, gtm_engineer: false },
  product: { self_serve: 'no', developer_facing: false },
  constraints: ['founder_wont_post']
}));
ok('no run_now case: unfunded run pool reported in notes', none.run_now.length === 0 && none.notes.join(' ').includes('unallocated'));

console.log('--- contract fields ---');
ok('every engine carries decision_inputs', MIX.ENGINES.every(e => Array.isArray(a.engines[e].decision_inputs)));
ok('every funded engine has a reason a CEO can argue with', MIX.ENGINES.every(e => a.engines[e].reason.length > 10));
const running = MIX.recommend(base({ engines_running: ['manual_outbound'] }));
ok('already_running annotates without changing the verdict',
  running.engines.manual_outbound.already_running === true &&
  running.engines.manual_outbound.verdict === a.engines.manual_outbound.verdict &&
  running.engines.manual_outbound.reason.includes('Already running'));
ok('mix_version present', typeof running.mix_version === 'string');

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
