/* The Nine Engines · mix engine
 * Maps a company's parameters to an engine portfolio: which of the nine
 * pipeline engines to run now, which to instrument for next year, which
 * to defer, and how a monthly budget could be split across them.
 *
 * Deterministic and explainable on purpose. Every verdict carries a
 * reason and the exact decision inputs that produced it. The thresholds
 * are knobs, not laws; they encode the playbook at
 * wesbecher.llc/pipeline and default to its logic.
 *
 * Scope, stated plainly: this model allocates budget across engines as
 * a starting hypothesis. It does not convert engine spend into meetings
 * or bookings, and it is not connected to the capacity model in
 * engine.js. Treat the split as a management starting point to argue
 * with, not a forecast.
 * No em dashes in this file.
 */

(function (root) {
  'use strict';

  var MIX_VERSION = '0.3.2';

  var ENGINES = [
    'automated_outbound', 'plg', 'manual_outbound', 'abm',
    'community_partner', 'paid_media', 'seo_aeo', 'social_content', 'events'
  ];

  var LABELS = {
    automated_outbound: 'Automated Outbound',
    plg: 'Product-Led Growth',
    manual_outbound: 'Manual Outbound + Cold Calling',
    abm: 'ABM',
    community_partner: 'Community + Partner Led',
    paid_media: 'Paid Media',
    seo_aeo: 'SEO + AEO',
    social_content: 'Social Content',
    events: 'Events'
  };

  /* Channels each engine depends on, used to keep every reason legal
   * under the stated constraints. A verdict may never recommend a
   * channel a constraint excludes. */
  var CHANNELS = {
    automated_outbound: ['email'],
    plg: [],
    manual_outbound: ['phone', 'email', 'linkedin'],
    abm: [],
    community_partner: [],
    paid_media: [],
    seo_aeo: [],
    social_content: [],
    events: ['email', 'phone', 'linkedin']
  };

  function verdict(kind, reason, weight, inputs) {
    return { verdict: kind, reason: reason, weight: weight || 0, decision_inputs: inputs || [] };
  }

  function has(list, x) { return (list || []).indexOf(x) >= 0; }

  function recommend(p) {
    var acv = p.acv || 0;
    var cash = p.cash_monthly_pipeline || 0;
    var team = p.team || {};
    var aes = (team.aes_ramped || 0) + (team.aes_ramping || 0);
    var cons = p.constraints || [];
    var running = p.engines_running || [];
    var selfServe = (p.product && p.product.self_serve) || 'no';
    var devFacing = !!(p.product && p.product.developer_facing);
    var enterprise = acv >= 75000;
    var noEmail = has(cons, 'no_email');
    var noPhone = has(cons, 'no_phone');
    var r = {};

    /* 01 Automated Outbound: the baseline layer for nearly everyone. */
    if (noEmail) {
      r.automated_outbound = verdict('blocked', 'Constraint: no email outbound.', 0, ['constraints']);
    } else if (!team.gtm_engineer && aes === 0) {
      r.automated_outbound = verdict('defer',
        'Needs one owner. Hire or name the GTM engineer first; the engine runs on one.',
        0, ['team.gtm_engineer', 'team.aes_ramped', 'team.aes_ramping']);
    } else {
      r.automated_outbound = verdict('run_now',
        'The baseline layer: one GTM engineer, waterfall enrichment, warmed domains, human-approved sends.',
        2, ['team.gtm_engineer', 'team.aes_ramped', 'team.aes_ramping', 'constraints']);
    }

    /* 02 PLG: only where the product can be self-served. */
    if (selfServe === 'no') {
      r.plg = verdict('defer', 'No self-serve surface. Revisit when a free tier or trial exists.',
        0, ['product.self_serve']);
    } else if (selfServe === 'yes') {
      r.plg = verdict(acv < 50000 ? 'run_now' : 'instrument_now',
        acv < 50000
          ? 'Self-serve product at a velocity price point: the product is the SDR. Wire usage to PQLs now.'
          : 'Self-serve exists under an enterprise motion: instrument PQL scoring; sales works the queue.',
        acv < 50000 ? 3 : 1, ['product.self_serve', 'acv']);
    } else {
      r.plg = verdict('instrument_now',
        'Partial self-serve: define the entry model (reverse trial is the default answer) and instrument usage.',
        1, ['product.self_serve']);
    }

    /* 03 Manual Outbound: earns its cost above a personalization-worthy
     * ACV. Channel legs drop out under constraints; with neither phone
     * nor email the rep-led motion does not clear its cost bar. */
    if (noPhone && noEmail) {
      r.manual_outbound = verdict('defer',
        'Constraints leave a LinkedIn-only rep motion, which does not clear the cost bar for rep-led outbound.',
        0, ['constraints', 'acv']);
    } else if (noPhone) {
      r.manual_outbound = verdict(acv >= 50000 ? 'instrument_now' : 'defer',
        acv >= 50000
          ? 'Constraint: no phone coverage. Run the tiered program on email and LinkedIn only; it works at reduced power.'
          : 'No phone coverage and a sub-$50K ACV: let automated outbound carry it.',
        acv >= 50000 ? 1 : 0, ['constraints', 'acv']);
    } else if (noEmail) {
      r.manual_outbound = verdict(acv >= 25000 ? 'run_now' : 'defer',
        acv >= 25000
          ? 'Rep-led motion on phone and LinkedIn; the email leg is off by constraint. The deep-dive program still applies.'
          : 'Below a $25K ACV the math rarely clears a rep-led motion.',
        acv >= 25000 ? 3 : 0, ['constraints', 'acv']);
    } else if (acv < 25000) {
      r.manual_outbound = verdict('defer',
        'Below a $25K ACV the math rarely clears a rep-led motion; let automated outbound and PLG carry it.',
        0, ['acv']);
    } else {
      r.manual_outbound = verdict('run_now',
        'ACV clears the bar for tiered, rep-led outbound. The deep-dive program is the operating manual.',
        3, ['acv', 'constraints']);
    }

    /* 04 ABM: enterprise ACV plus a nameable market. */
    if (enterprise) {
      r.abm = verdict(aes >= 1 ? 'run_now' : 'instrument_now',
        aes >= 1
          ? 'Enterprise ACV and reps to route to: named list, signal architecture, stage scoring.'
          : 'Enterprise ACV but no rep coverage yet: build the named list and signals; route when a rep lands.',
        aes >= 1 ? 2 : 1, ['acv', 'team.aes_ramped', 'team.aes_ramping']);
    } else {
      r.abm = verdict('defer', 'Below enterprise ACV, ABM overhead beats its yield; signals still feed outbound.',
        0, ['acv']);
    }

    /* 05 Community + Partner: category-dependent, always slow. */
    if (has(cons, 'no_community_capacity')) {
      r.community_partner = verdict('defer', 'Constraint: nobody to host it. A dead community is worse than none.',
        0, ['constraints']);
    } else if (devFacing || selfServe !== 'no') {
      r.community_partner = verdict('instrument_now',
        'Practitioner-facing product: pick one lane (community or partner), start the value engine now; it pays next year.',
        1, ['product.developer_facing', 'product.self_serve']);
    } else {
      r.community_partner = verdict('instrument_now',
        'Partner lane only: marketplace listing plus two or three co-sell relationships; the 25 percent channel bar is the graduation gate.',
        1, ['product.developer_facing', 'product.self_serve']);
    }

    /* 06 Paid Media: an accelerant that needs a routed list and budget. */
    if (has(cons, 'no_paid_budget')) {
      r.paid_media = verdict('defer',
        'Paid media is off by constraint (no_paid_budget), whatever the pipeline budget allows.',
        0, ['constraints']);
    } else if (cash < 8000) {
      r.paid_media = verdict('defer',
        'Under about $8K a month, LinkedIn ABM spend fragments below the learning threshold. Bank it.',
        0, ['cash_monthly_pipeline']);
    } else if (r.abm.verdict === 'defer') {
      r.paid_media = verdict('defer', 'Paid without a named list is spray. Stand up the ABM list first.',
        0, ['cash_monthly_pipeline', 'acv']);
    } else if (r.abm.verdict === 'instrument_now') {
      r.paid_media = verdict('defer',
        'The named list is still being built and nobody routes yet; turn paid on when ABM runs.',
        0, ['cash_monthly_pipeline', 'acv', 'team.aes_ramped', 'team.aes_ramping']);
    } else {
      r.paid_media = verdict('run_now',
        'Named list exists and budget clears the floor: full-funnel creative, demo asks only at warm retargeting.',
        1, ['cash_monthly_pipeline', 'acv', 'team.aes_ramped', 'team.aes_ramping']);
    }

    /* 07 SEO + AEO: instrument early, always; months to pay. */
    r.seo_aeo = verdict('instrument_now',
      'Start the clusters and versus pages now; the flywheel pays months from now (see the source registry for the conversion claim).',
      1, []);

    /* 08 Social: founder-led, nearly free, compounding. */
    r.social_content = verdict(has(cons, 'founder_wont_post') ? 'defer' : 'run_now',
      has(cons, 'founder_wont_post')
        ? 'Founder-led is the mechanism; without the founder, park it rather than ghost-write badly.'
        : 'Three founder posts a week plus daily comments; capture engaged accounts into outbound.',
      has(cons, 'founder_wont_post') ? 0 : 1, ['constraints']);

    /* 09 Events: enterprise motion with real budget, pre-booked or not
     * at all. Pre-event outreach adapts to the surviving channels. */
    if (has(cons, 'no_events_budget')) {
      r.events = verdict('blocked', 'Constraint: no events budget.', 0, ['constraints']);
    } else if (enterprise && cash >= 15000) {
      var preBook = 'list built six weeks out, half the meetings pre-booked';
      if (noEmail && noPhone) preBook = 'list built six weeks out, meetings pre-booked over LinkedIn only';
      else if (noEmail) preBook = 'list built six weeks out, meetings pre-booked by phone and LinkedIn';
      else if (noPhone) preBook = 'list built six weeks out, meetings pre-booked by email and LinkedIn';
      r.events = verdict('run_now',
        'Enterprise ICP: one or two ICP-dense events a quarter, ' + preBook + '.',
        2, ['acv', 'cash_monthly_pipeline', 'constraints']);
    } else {
      r.events = verdict('defer',
        'Until ACV and budget support it, attend rather than sponsor; a dinner beats a booth anyway.',
        0, ['acv', 'cash_monthly_pipeline']);
    }

    /* Budget split in basis points, largest-remainder, exact totals.
     * run_now engines share 8500 bps by weight; instrument_now engines
     * split 1500 bps equally. Unfunded pools are reported, not hidden. */
    function apportion(keys, pool, weightOf) {
      var totalW = keys.reduce(function (s, k) { return s + weightOf(k); }, 0);
      if (!keys.length || totalW <= 0) return {};
      var exact = keys.map(function (k) { return { k: k, x: pool * weightOf(k) / totalW }; });
      var floors = {};
      var used = 0;
      exact.forEach(function (e) { floors[e.k] = Math.floor(e.x); used += floors[e.k]; });
      exact.sort(function (a, b) { return (b.x - Math.floor(b.x)) - (a.x - Math.floor(a.x)); });
      for (var i = 0; used < pool && i < exact.length; i++, used++) floors[exact[i].k] += 1;
      return floors;
    }

    /* Spend floors, enforced against the ALLOCATION rather than the
     * total pipeline budget. Qualifying on total cash and then funding
     * an engine below the floor its own reason cites is a contradiction:
     * a $15K sponsorship program funded at $3,862 buys nothing. When the
     * split cannot carry a floor, the engine is not funded this cycle
     * and the split is recomputed without it. */
    var SPEND_FLOORS = { paid_media: 8000, events: 15000 };
    var FLOOR_WHY = {
      paid_media: 'below the learning threshold, paid spend fragments across audiences and teaches nothing',
      events: 'below a sponsorship-grade program, the spend buys a booth and no pipeline'
    };
    var runs, instruments, runBps, instBps;
    var floorCuts = [];
    var guard = 0;
    while (true) {
      runs = []; instruments = [];
      ENGINES.forEach(function (e) {
        if (r[e].verdict === 'run_now') runs.push(e);
        if (r[e].verdict === 'instrument_now') instruments.push(e);
      });
      runBps = apportion(runs, 8500, function (k) { return r[k].weight; });
      instBps = apportion(instruments, 1500, function () { return 1; });

      var worst = null, worstRatio = 1;
      runs.forEach(function (e) {
        if (SPEND_FLOORS[e] === undefined) return;
        var monthly = Math.floor(cash * (runBps[e] || 0) / 10000);
        var ratio = monthly / SPEND_FLOORS[e];
        if (ratio < 1 && ratio < worstRatio) { worst = { key: e, monthly: monthly, ratio: ratio }; worstRatio = ratio; }
      });
      if (!worst || guard++ > ENGINES.length) break;
      floorCuts.push(worst);
      r[worst.key] = verdict('defer',
        'Qualifies on ICP and budget, but the split funds it at $' + worst.monthly.toLocaleString('en-US') +
        ' a month against its own $' + SPEND_FLOORS[worst.key].toLocaleString('en-US') +
        ' floor: ' + FLOOR_WHY[worst.key] + '. Not funded this cycle; raise the pipeline budget or concentrate it here deliberately.',
        0, ['cash_monthly_pipeline', 'acv']);
    }

    /* Already-running annotation. This flags continuity; it does not
     * change the verdict. Current engine performance is not yet a
     * model input, and pretending otherwise would be dishonest. */
    ENGINES.forEach(function (e) {
      r[e].already_running = has(running, e);
      if (r[e].already_running) {
        r[e].reason += ' Already running per your intake; this verdict applies to continued funding.';
      }
    });

    var allocated = 0;
    ENGINES.forEach(function (e) {
      var bps = runBps[e] || instBps[e] || 0;
      r[e].budget_share_bps = bps;
      r[e].budget_monthly = Math.floor(cash * bps / 10000);
      allocated += r[e].budget_monthly;
      r[e].label = LABELS[e];
    });

    var notes = [
      'Weights and thresholds are knobs; argue with them in the reasons.',
      'The split is a starting allocation hypothesis, not a forecast. Engine spend is not yet converted into meetings or bookings; the capacity model in engine.cjs answers staffing separately.',
      'A human approves every external send, in every engine, always.'
    ];
    floorCuts.forEach(function (c) {
      notes.push(LABELS[c.key] + ' qualified but the split could only fund it at $' + c.monthly.toLocaleString('en-US') +
        ' against a $' + SPEND_FLOORS[c.key].toLocaleString('en-US') +
        ' floor, so it is deferred and its share went back to the engines that clear their own bar.');
    });
    if (!runs.length) notes.push('No engine cleared run_now, so the 85 percent run pool ($' + Math.floor(cash * 0.85) + ') is intentionally unallocated. Fix the blockers before spending it.');
    if (!instruments.length) notes.push('No engine is instrumenting, so the 15 percent instrument pool is unallocated.');

    return {
      mix_version: MIX_VERSION,
      engines: r,
      run_now: runs,
      instrument_now: instruments,
      allocated_total: allocated,
      unallocated_total: cash - allocated,
      notes: notes
    };
  }

  var api = { MIX_VERSION: MIX_VERSION, ENGINES: ENGINES, LABELS: LABELS, CHANNELS: CHANNELS, recommend: recommend };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.MIX = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
