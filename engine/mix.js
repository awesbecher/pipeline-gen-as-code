/* The Nine Engines · mix engine
 * Maps a company's parameters to an engine portfolio: which of the nine
 * pipeline engines to run now, which to instrument for next year, which to
 * defer, and how to split the monthly pipeline budget.
 *
 * Deterministic and explainable on purpose. Every verdict carries a reason a
 * CEO can argue with. The thresholds below are knobs, not laws; they encode
 * the playbook at wesbecher.llc/pipeline and default to its logic.
 * Companion: engine.js (capacity math, verified against the workbook).
 * No em dashes in this file.
 */

(function (root) {
  'use strict';

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

  // Verdicts: run_now (staff and fund this quarter), instrument_now (start the
  // slow flywheel with a small allocation), defer (revisit at the named gate),
  // blocked (a stated constraint rules it out).
  function verdict(kind, reason, weight) {
    return { verdict: kind, reason: reason, weight: weight || 0 };
  }

  function has(list, x) { return (list || []).indexOf(x) >= 0; }

  function recommend(p) {
    var acv = p.acv || 0;
    var cash = p.cash_monthly_pipeline || 0;
    var team = p.team || {};
    var aes = (team.aes_ramped || 0) + (team.aes_ramping || 0);
    var cons = p.constraints || [];
    var selfServe = (p.product && p.product.self_serve) || 'no';
    var enterprise = acv >= 75000;
    var r = {};

    // 01 Automated Outbound: the baseline layer for nearly everyone.
    if (has(cons, 'no_email')) {
      r.automated_outbound = verdict('blocked', 'Constraint: no email outbound.');
    } else if (!team.gtm_engineer && aes === 0) {
      r.automated_outbound = verdict('defer',
        'Needs one owner. Hire or name the GTM engineer first; the engine runs on one.');
    } else {
      r.automated_outbound = verdict('run_now',
        'The baseline layer: one GTM engineer, waterfall enrichment, warmed domains, human-approved sends.', 2);
    }

    // 02 PLG: only where the product can be self-served.
    if (selfServe === 'no') {
      r.plg = verdict('defer', 'No self-serve surface. Revisit when a free tier or trial exists.');
    } else if (selfServe === 'yes') {
      r.plg = verdict(acv < 50000 ? 'run_now' : 'instrument_now',
        acv < 50000
          ? 'Self-serve product at a velocity price point: the product is the SDR. Wire usage to PQLs now.'
          : 'Self-serve exists under an enterprise motion: instrument PQL scoring; sales works the queue.',
        acv < 50000 ? 3 : 1);
    } else {
      r.plg = verdict('instrument_now',
        'Partial self-serve: define the entry model (reverse trial is the default answer) and instrument usage.', 1);
    }

    // 03 Manual Outbound: earns its cost above a personalization-worthy ACV.
    if (has(cons, 'no_phone')) {
      r.manual_outbound = verdict(acv >= 50000 ? 'instrument_now' : 'defer',
        'Constraint: no phone coverage. Run the tiered program on email and LinkedIn only; it works at reduced power.');
    } else if (acv < 25000) {
      r.manual_outbound = verdict('defer',
        'Below a $25K ACV the math rarely clears a rep-led motion; let automated outbound and PLG carry it.');
    } else {
      r.manual_outbound = verdict('run_now',
        'ACV clears the bar for tiered, rep-led outbound. The deep-dive program is the operating manual.', 3);
    }

    // 04 ABM: enterprise ACV plus a nameable market.
    if (enterprise) {
      r.abm = verdict(aes >= 1 ? 'run_now' : 'instrument_now',
        aes >= 1
          ? 'Enterprise ACV and reps to route to: named list, signal architecture, stage scoring.'
          : 'Enterprise ACV but no rep coverage yet: build the named list and signals; route when a rep lands.',
        aes >= 1 ? 2 : 1);
    } else {
      r.abm = verdict('defer', 'Below enterprise ACV, ABM overhead beats its yield; signals still feed outbound.');
    }

    // 05 Community + Partner: category-dependent, always slow.
    if (has(cons, 'no_community_capacity')) {
      r.community_partner = verdict('defer', 'Constraint: nobody to host it. A dead community is worse than none.');
    } else if (p.product && (p.product.developer_facing || selfServe !== 'no')) {
      r.community_partner = verdict('instrument_now',
        'Practitioner-facing product: pick one lane (community or partner), start the value engine now; it pays next year.', 1);
    } else {
      r.community_partner = verdict('instrument_now',
        'Partner lane only: marketplace listing plus two or three co-sell relationships; the 25 percent channel bar is the graduation gate.', 1);
    }

    // 06 Paid Media: an accelerant that needs a list and real budget.
    if (has(cons, 'no_paid_budget') || cash < 8000) {
      r.paid_media = verdict('defer',
        'Under about $8K a month, LinkedIn ABM spend fragments below the learning threshold. Bank it.');
    } else if (r.abm.verdict === 'defer') {
      r.paid_media = verdict('defer', 'Paid without a named list is spray. Stand up the ABM list first.');
    } else if (r.abm.verdict === 'instrument_now') {
      r.paid_media = verdict('defer',
        'The named list is still being built and nobody routes yet; turn paid on when ABM runs.');
    } else {
      r.paid_media = verdict('run_now',
        'Named list exists and budget clears the floor: full-funnel creative, demo asks only at warm retargeting.', 1);
    }

    // 07 SEO + AEO: instrument early, always; months to pay.
    r.seo_aeo = verdict('instrument_now',
      'Start the clusters and versus pages now; AI-referred traffic converts about five times organic, months from now.', 1);

    // 08 Social: founder-led, nearly free, compounding.
    r.social_content = verdict(has(cons, 'founder_wont_post') ? 'defer' : 'run_now',
      has(cons, 'founder_wont_post')
        ? 'Founder-led is the mechanism; without the founder, park it rather than ghost-write badly.'
        : 'Three founder posts a week plus daily comments; capture engaged accounts into outbound.', 1);

    // 09 Events: enterprise motion with real budget, pre-booked or not at all.
    if (has(cons, 'no_events_budget')) {
      r.events = verdict('blocked', 'Constraint: no events budget.');
    } else if (enterprise && cash >= 15000) {
      r.events = verdict('run_now',
        'Enterprise ICP: one or two ICP-dense events a quarter, list built six weeks out, half the meetings pre-booked.', 2);
    } else {
      r.events = verdict('defer',
        'Until ACV and budget support it, attend rather than sponsor; a dinner beats a booth anyway.');
    }

    // Budget split: run_now engines share ~85 percent of monthly cash by
    // weight; instrument_now engines share the rest equally.
    var runs = [], instruments = [];
    ENGINES.forEach(function (e) {
      if (r[e].verdict === 'run_now') runs.push(e);
      if (r[e].verdict === 'instrument_now') instruments.push(e);
    });
    var runWeight = runs.reduce(function (s, e) { return s + r[e].weight; }, 0);
    ENGINES.forEach(function (e) {
      var share = 0;
      if (r[e].verdict === 'run_now' && runWeight > 0) {
        share = 0.85 * (r[e].weight / runWeight);
      } else if (r[e].verdict === 'instrument_now' && instruments.length > 0) {
        share = 0.15 / instruments.length;
      }
      r[e].budget_share = Math.round(share * 100) / 100;
      // Floor, not round: allocations must never sum past the cash.
      r[e].budget_monthly = Math.floor(share * cash);
      r[e].label = LABELS[e];
    });

    return {
      engines: r,
      run_now: runs,
      instrument_now: instruments,
      notes: [
        'Weights and thresholds are knobs; argue with them in the reasons.',
        'Every engine lands in the same forecast. Tie the plan to seats with engine.js.',
        'A human approves every external send, in every engine, always.'
      ]
    };
  }

  var api = { ENGINES: ENGINES, LABELS: LABELS, recommend: recommend };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.MIX = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
