/* Mix engine verification: scenario verdicts a CEO would sanity-check. */
const MIX = require('./mix.js');

let pass = 0, fail = 0;
function is(name, got, want) {
  if (got === want) { pass++; console.log('  ok  ' + name); }
  else { fail++; console.log('FAIL  ' + name + '  got ' + got + ' want ' + want); }
}
function ok(name, v) { v ? (pass++, console.log('  ok  ' + name)) : (fail++, console.log('FAIL  ' + name)); }

// Scenario A: seed AI security, enterprise ACV, tiny team, $25K/mo.
const a = MIX.recommend({
  acv: 120000, cash_monthly_pipeline: 25000,
  team: { aes_ramped: 1, aes_ramping: 0, bdrs: 1, gtm_engineer: true },
  product: { self_serve: 'no', developer_facing: false },
  constraints: []
});
is('A: automated outbound runs', a.engines.automated_outbound.verdict, 'run_now');
is('A: manual outbound runs', a.engines.manual_outbound.verdict, 'run_now');
is('A: ABM runs', a.engines.abm.verdict, 'run_now');
is('A: events run at enterprise ACV + budget', a.engines.events.verdict, 'run_now');
is('A: PLG deferred with no self-serve', a.engines.plg.verdict, 'defer');
is('A: SEO instruments', a.engines.seo_aeo.verdict, 'instrument_now');

// Scenario B: dev tool, self-serve, $30K ACV velocity, small budget.
const b = MIX.recommend({
  acv: 30000, cash_monthly_pipeline: 6000,
  team: { aes_ramped: 0, aes_ramping: 1, bdrs: 0, gtm_engineer: true },
  product: { self_serve: 'yes', developer_facing: true },
  constraints: []
});
is('B: PLG runs at velocity ACV', b.engines.plg.verdict, 'run_now');
is('B: community instruments for dev product', b.engines.community_partner.verdict, 'instrument_now');
is('B: ABM deferred below enterprise ACV', b.engines.abm.verdict, 'defer');
is('B: paid deferred under budget floor', b.engines.paid_media.verdict, 'defer');
is('B: events deferred', b.engines.events.verdict, 'defer');

// Scenario C: constraints bite.
const c = MIX.recommend({
  acv: 90000, cash_monthly_pipeline: 20000,
  team: { aes_ramped: 2, aes_ramping: 0, bdrs: 1, gtm_engineer: false },
  product: { self_serve: 'partial', developer_facing: false },
  constraints: ['no_events_budget', 'founder_wont_post', 'no_phone']
});
is('C: events blocked by constraint', c.engines.events.verdict, 'blocked');
is('C: social deferred without the founder', c.engines.social_content.verdict, 'defer');
is('C: manual outbound degrades, not dies, without phone', c.engines.manual_outbound.verdict, 'instrument_now');
is('C: partial self-serve instruments PLG', c.engines.plg.verdict, 'instrument_now');

// Scenario D: enterprise ACV and budget but no reps: ABM instruments, paid waits.
const d = MIX.recommend({
  acv: 100000, cash_monthly_pipeline: 12000,
  team: { aes_ramped: 0, aes_ramping: 0, bdrs: 0, gtm_engineer: true },
  product: { self_serve: 'no', developer_facing: false },
  constraints: []
});
is('D: ABM instruments without reps', d.engines.abm.verdict, 'instrument_now');
is('D: paid waits for ABM to run, not just exist', d.engines.paid_media.verdict, 'defer');

// Budget sanity: shares sum to ~1 when both groups exist; dollars <= cash.
const shares = MIX.ENGINES.reduce((s, e) => s + a.engines[e].budget_share, 0);
ok('A: budget shares sum to ~1.0 (' + shares.toFixed(2) + ')', Math.abs(shares - 1.0) < 0.05);
const dollars = MIX.ENGINES.reduce((s, e) => s + a.engines[e].budget_monthly, 0);
ok('A: allocated dollars within cash (' + dollars + ')', dollars <= 25000 && dollars >= 22000);
ok('A: every engine has a reason', MIX.ENGINES.every(e => a.engines[e].reason.length > 10));

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
