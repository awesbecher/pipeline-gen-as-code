/* ============================================================
   SALES CAPACITY ENGINE
   Ported from Wesbecher_Capacity_Model_1.2M_to_7M.xlsx.
   Ramp vector, haircut math, bridge, and AE comp rule mirror
   the workbook exactly; rep velocity and support scheduling
   generalize it for arbitrary inputs.
   ============================================================ */
(function (root) {
  'use strict';

  /* ---------- locked methodology (2026 playbook) ---------- */
  var FUNNEL = { mtgToQual: 0.16, qualToPov: 0.27, povToWin: 0.81 };
  var WIN_PER_MTG = FUNNEL.mtgToQual * FUNNEL.qualToPov * FUNNEL.povToWin; /* 3.4992% */
  var ANCHOR = { dealsPerYear: 8.3333, cycleDays: 178 }; /* $1.0M at $120K ACV, 178-day median */
  var SELL_WEEKS = 49;
  var STEADY_CAP = 3000000;

  var RAMP_PROFILES = {
    fast: { key: 'fast', label: 'Fast-cycle ramp', months: [2, 2, 2], note: 'cycles under 120 days' },
    std:  { key: 'std',  label: 'Playbook standard ramp', months: [3, 3, 3], note: '120 to 220-day cycles' },
    long: { key: 'long', label: 'Enterprise ramp', months: [4, 4, 4], note: 'cycles over 220 days' }
  };
  var RATES = [0, 0.5, 0.9, 1];

  function profileFor(cycleDays) {
    if (cycleDays < 120) return RAMP_PROFILES.fast;
    if (cycleDays <= 220) return RAMP_PROFILES.std;
    return RAMP_PROFILES.long;
  }

  /* ---------- default assumptions (editable in Advanced) ---------- */
  var DEFAULTS = {
    baseArr: 1200000,
    churnPct: 0.06,
    expansion: 1000000,
    targetArr: 7000000,
    acv: 120000,
    cycleDays: 178,
    rampedAes: 2,
    rampingAes: 2,
    adv: {
      haircut: 0.30,
      maxPerMonth: 2,
      steadyOverride: 0,      /* 0 = derive from cycle + ACV */
      aePerSe: 2.5,
      aePerBdr: 2.5,
      leadership: true,
      loaded: false,          /* +25% payroll load */
      comp: {
        ae:     { label: 'Enterprise AE',            base: 165000, variable: 165000 },
        se:     { label: 'Sales engineer',           base: 180000, variable: 80000 },
        bdr:    { label: 'BDR',                      base: 85000,  variable: 35000 },
        avp:    { label: 'Sales leader (Area VP)',   base: 185000, variable: 185000 },
        bdrMgr: { label: 'BDR manager',              base: 165000, variable: 75000 },
        seLead: { label: 'SE lead (Field CTO)',      base: 225000, variable: 100000 }
      }
    }
  };

  /* ---------- unit economics ---------- */
  function steadyAnnual(acv, cycleDays, override) {
    if (override && override > 0) return override;
    var deals = ANCHOR.dealsPerYear * ANCHOR.cycleDays / cycleDays;
    return Math.min(STEADY_CAP, deals * acv);
  }

  function monthlyRate(tenureMonth, prof) {
    if (tenureMonth < 1) return 0;
    var b = prof.months, t = tenureMonth;
    if (t <= b[0]) return RATES[0];
    if (t <= b[0] + b[1]) return RATES[1];
    if (t <= b[0] + b[1] + b[2]) return RATES[2];
    return RATES[3];
  }

  function seatMonths(hireMonth, steadyMo, prof) {
    var out = [];
    for (var c = 1; c <= 12; c++) out.push(monthlyRate(c - hireMonth + 1, prof) * steadyMo);
    return out;
  }

  function sum(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return s; }
  function seatYear1(hireMonth, steadyMo, prof) { return sum(seatMonths(hireMonth, steadyMo, prof)); }

  function seatLabel(i) {
    var s = '';
    do { s = String.fromCharCode(65 + (i % 26)) + s; i = Math.floor(i / 26) - 1; } while (i >= 0);
    return s;
  }

  /* ---------- the full model ----------
   * Optional current-team inputs (all integers):
   *   inp.bdrs          current BDR count (derived from AE ratio if absent)
   *   inp.ses           current SE count (derived from AE ratio if absent)
   *   inp.salesLeaders  current sales leaders (derived if absent)
   *   inp.rampingTenures  tenure in months, one per ramping AE, as of
   *                       plan month 1 (defaults to a 4/3 stagger)
   * Every derivation is recorded in the returned assumptions list. */
  function compute(inp) {
    var adv = inp.adv;
    var assumptions = [];
    var prof = profileFor(inp.cycleDays);
    var steady = steadyAnnual(inp.acv, inp.cycleDays, adv.steadyOverride);
    var steadyMo = steady / 12;
    var load = adv.loaded ? 1.25 : 1;

    /* bridge requirement */
    var churnD = inp.baseArr * inp.churnPct;
    var expansionNet = inp.expansion - churnD;
    var netNewNeeded = inp.targetArr - inp.baseArr - expansionNet;
    var grossNeeded = netNewNeeded > 0 ? netNewNeeded / (1 - adv.haircut) : 0;

    /* carried seats: ramped at tenure 11+ (full productivity by
     * definition), ramping placed by real tenure when supplied */
    var seats = [];
    var i;
    for (i = 0; i < inp.rampedAes; i++) seats.push({ kind: 'ramped', hireMonth: -9 });
    var tenures = inp.rampingTenures && inp.rampingTenures.length === inp.rampingAes
      ? inp.rampingTenures.slice()
      : null;
    if (!tenures) {
      tenures = [];
      for (i = 0; i < inp.rampingAes; i++) tenures.push(i % 2 === 0 ? 4 : 3);
      if (inp.rampingAes > 0) assumptions.push(
        'Ramping AE tenure not supplied; assumed a 4/3-month stagger (set team.aes_ramping_tenure_months to use real cohorts).');
    }
    tenures.forEach(function (t) { seats.push({ kind: 'ramping', hireMonth: 2 - t, tenure: t }); });
    var existingGross = 0;
    seats.forEach(function (s) { existingGross += seatYear1(s.hireMonth, steadyMo, prof); });

    /* greedy front-loaded hiring, then slide trailing seats later while the target still clears */
    var newSeats = [];
    var shortfall = 0;
    if (grossNeeded > existingGross && steadyMo > 0) {
      var cum = existingGross, m, k, y;
      outer:
      for (m = 1; m <= 12; m++) {
        y = seatYear1(m, steadyMo, prof);
        if (y <= 0) break;
        for (k = 0; k < adv.maxPerMonth; k++) {
          newSeats.push({ kind: 'new', hireMonth: m });
          cum += y;
          if (cum >= grossNeeded) break outer;
        }
      }
      if (cum < grossNeeded) shortfall = grossNeeded - cum;
      else {
        /* relaxation pass: last seat first, push later while covered and month has room */
        var total = function () {
          var t = existingGross;
          newSeats.forEach(function (s) { t += seatYear1(s.hireMonth, steadyMo, prof); });
          return t;
        };
        var countIn = function (mm, excl) {
          var c = 0;
          newSeats.forEach(function (s, idx) { if (idx !== excl && s.hireMonth === mm) c++; });
          return c;
        };
        for (i = newSeats.length - 1; i >= 0; i--) {
          while (newSeats[i].hireMonth < 12) {
            var next = newSeats[i].hireMonth + 1;
            if (countIn(next, i) >= adv.maxPerMonth) break;
            var old = newSeats[i].hireMonth;
            newSeats[i].hireMonth = next;
            if (total() < grossNeeded) { newSeats[i].hireMonth = old; break; }
          }
        }
        newSeats.sort(function (a, b) { return a.hireMonth - b.hireMonth; });
      }
    }
    seats = seats.concat(newSeats);

    /* per-seat detail */
    var monthly = [0,0,0,0,0,0,0,0,0,0,0,0];
    seats.forEach(function (s, idx) {
      s.label = 'Rep ' + seatLabel(idx);
      s.months = seatMonths(s.hireMonth, steadyMo, prof);
      s.quarters = [sum(s.months.slice(0,3)), sum(s.months.slice(3,6)), sum(s.months.slice(6,9)), sum(s.months.slice(9,12))];
      s.year1 = sum(s.months);
      s.status = s.kind === 'ramped' ? 'carried in, ramped'
               : s.kind === 'ramping' ? 'carried, ramp month ' + (s.tenure || (1 - s.hireMonth + 1))
               : 'hire, month ' + s.hireMonth;
      for (var c = 0; c < 12; c++) monthly[c] += s.months[c];
    });

    /* display grouping: same-month new-hire pairs share a row like the deck */
    var rows = [];
    for (i = 0; i < seats.length; i++) {
      var s = seats[i], nx = seats[i + 1];
      if (s.kind === 'new' && nx && nx.kind === 'new' && nx.hireMonth === s.hireMonth) {
        rows.push({
          label: 'Reps ' + seatLabel(i) + '-' + seatLabel(i + 1),
          status: '2 hires, month ' + s.hireMonth,
          seats: 2, hireMonth: s.hireMonth,
          quarters: s.quarters.map(function (q, qi) { return q + nx.quarters[qi]; }),
          rates: s.quarters.map(function (q) { return q / (steadyMo * 3); }), /* per-seat intensity */
          year1: s.year1 + nx.year1
        });
        i++;
      } else {
        rows.push({
          label: s.label, status: s.status, seats: 1, hireMonth: s.hireMonth,
          quarters: s.quarters,
          rates: s.quarters.map(function (q) { return q / (steadyMo * 3); }),
          year1: s.year1
        });
      }
    }

    /* bridge actuals */
    var grossCapacity = sum(monthly);
    var haircutD = grossCapacity * adv.haircut;
    var netNewLogo = grossCapacity - haircutD;
    var logos = netNewLogo / inp.acv;
    var exitArr = inp.baseArr + expansionNet + netNewLogo;
    var exitRunRate = monthly[11] * 12;

    /* activity funnel, company level */
    var meetings = netNewLogo > 0 ? Math.ceil((netNewLogo / inp.acv) / WIN_PER_MTG) : 0;
    var quals = Math.round(meetings * FUNNEL.mtgToQual);
    var povs = Math.round(quals * FUNNEL.qualToPov);
    var wins = Math.round(logos);
    var seatMeetingsY1 = Math.round((seatYear1(1, steadyMo, prof) / inp.acv) / WIN_PER_MTG);

    /* ---------- supporting build ---------- */
    var existingAes = inp.rampedAes + inp.rampingAes;
    var totalAes = seats.length;
    var aeCountAt = function (m) {
      var c = existingAes;
      newSeats.forEach(function (s) { if (s.hireMonth <= m) c++; });
      return c;
    };
    function schedule(perAe, existingCount) {
      var have = existingCount, hires = [];
      for (var m = 1; m <= 12; m++) {
        var need = Math.ceil(aeCountAt(m) / perAe);
        while (have < need) { hires.push(m); have++; }
      }
      return hires;
    }
    var existingSes, existingBdrs;
    if (inp.ses != null) existingSes = inp.ses;
    else {
      existingSes = Math.ceil(existingAes / adv.aePerSe);
      assumptions.push('Current SE count not supplied; derived ' + existingSes + ' from the ' + adv.aePerSe + ' AE-per-SE ratio (set team.ses to use the real number).');
    }
    if (inp.bdrs != null) existingBdrs = inp.bdrs;
    else {
      existingBdrs = Math.ceil(existingAes / adv.aePerBdr);
      assumptions.push('Current BDR count not supplied; derived ' + existingBdrs + ' from the ' + adv.aePerBdr + ' AE-per-BDR ratio (set team.bdrs to use the real number).');
    }
    var seHires = schedule(adv.aePerSe, existingSes);
    var bdrHires = schedule(adv.aePerBdr, existingBdrs);
    var totalSes = existingSes + seHires.length;
    var totalBdrs = existingBdrs + bdrHires.length;

    /* leadership: AVP at 5+ AEs (1 per 8), BDR manager at 3+ BDRs, SE lead at 3+ SEs */
    var leaders = [];
    var suppliedLeaders = inp.salesLeaders != null ? inp.salesLeaders : null;
    if (adv.leadership) {
      var avpNeed = totalAes >= 5 ? Math.max(1, Math.floor(totalAes / 8)) : 0;
      var avpHave = suppliedLeaders != null
        ? Math.min(suppliedLeaders, Math.max(avpNeed, suppliedLeaders))
        : (existingAes >= 5 ? Math.max(1, Math.floor(existingAes / 8)) : 0);
      if (suppliedLeaders == null && adv.leadership) assumptions.push(
        'Current sales leadership not supplied; derived from AE count (set team.sales_leaders to use the real number). Carried leadership is only priced when supplied.');
      for (i = avpHave; i < avpNeed; i++) leaders.push({ role: 'avp', month: newSeats.length ? newSeats[0].hireMonth : 1 });
      var bmNeed = totalBdrs >= 3 ? 1 : 0, bmHave = existingBdrs >= 3 ? 1 : 0;
      for (i = bmHave; i < bmNeed; i++) leaders.push({ role: 'bdrMgr', month: bdrHires.length ? bdrHires[Math.min(bdrHires.length - 1, Math.max(0, 2 - existingBdrs))] : 1 });
      var slNeed = totalSes >= 3 ? 1 : 0, slHave = existingSes >= 3 ? 1 : 0;
      for (i = slHave; i < slNeed; i++) leaders.push({ role: 'seLead', month: seHires.length ? seHires[Math.min(seHires.length - 1, Math.max(0, 2 - existingSes))] : 1 });
    }

    /* ---------- burn ---------- */
    var comp = adv.comp;
    var prorate = function (m) { return m < 1 ? 1 : (13 - m) / 12; };
    var attain = 1 - adv.haircut;
    var aeVarRate = comp.ae.variable / steady; /* workbook: $165K variable per $1.0M capacity = 16.5% of net new bookings */
    var aeVarPool = aeVarRate * netNewLogo;

    var newAeBase = 0;
    newSeats.forEach(function (s) { newAeBase += prorate(s.hireMonth) * comp.ae.base; });
    var carriedAeBase = existingAes * comp.ae.base;
    var newGross = grossCapacity - existingGross;
    var aeVarNew = grossCapacity > 0 ? aeVarPool * (newGross / grossCapacity) : 0;
    var aeVarCarried = aeVarPool - aeVarNew;

    function roleCost(months, c) {
      var base = 0, vari = 0;
      months.forEach(function (m) { base += prorate(m) * c.base; vari += prorate(m) * c.variable * attain; });
      return { base: base, variable: vari, total: base + vari };
    }
    var seCostNew = roleCost(seHires, comp.se);
    var bdrCostNew = roleCost(bdrHires, comp.bdr);
    var seCostCarried = roleCost(new Array(existingSes).fill(0), comp.se);
    var bdrCostCarried = roleCost(new Array(existingBdrs).fill(0), comp.bdr);
    var leaderCost = { base: 0, variable: 0, total: 0 }, leaderRows = [];
    leaders.forEach(function (l) {
      var c = comp[l.role], r = roleCost([l.month], c);
      leaderCost.base += r.base; leaderCost.variable += r.variable; leaderCost.total += r.total;
      leaderRows.push({ role: l.role, label: c.label, month: l.month, cost: r.total * load, ote: c.base + c.variable });
    });

    /* Carried leadership is priced only when the count is supplied;
     * a derived count would invent payroll for people who may not exist. */
    var carriedLeaderCost = 0;
    if (suppliedLeaders != null && suppliedLeaders > 0) {
      carriedLeaderCost = suppliedLeaders * (comp.avp.base + comp.avp.variable * attain);
    }
    var buildCost = (newAeBase + aeVarNew + seCostNew.total + bdrCostNew.total + leaderCost.total) * load;
    var carriedCost = (carriedAeBase + aeVarCarried + seCostCarried.total + bdrCostCarried.total + carriedLeaderCost) * load;
    var totalCost = buildCost + carriedCost;

    var oteAll = totalAes * (comp.ae.base + comp.ae.variable)
               + totalSes * (comp.se.base + comp.se.variable)
               + totalBdrs * (comp.bdr.base + comp.bdr.variable);
    leaders.forEach(function (l) { oteAll += comp[l.role].base + comp[l.role].variable; });
    if (suppliedLeaders != null) oteAll += suppliedLeaders * (comp.avp.base + comp.avp.variable);
    var runRate = oteAll * load;

    /* BDR capacity check: 12 SAO points a month per BDR, pods source
     * 2 of 3 meetings. New hires are prorated by months active in the
     * plan year; a month-9 BDR contributes 4 months, not 12. */
    var bdrMeetingsNeeded = meetings * (2 / 3);
    var bdrFleetCapacity = existingBdrs * 12 * 12;
    bdrHires.forEach(function (m) { bdrFleetCapacity += (13 - m) * 12; });
    var bdrUtil = bdrFleetCapacity > 0 ? bdrMeetingsNeeded / bdrFleetCapacity : 0;

    /* Shortfall as a final invariant over actual computed capacity,
     * covering zero-productivity and forced-schedule cases. */
    var shortfallFinal = Math.max(0, grossNeeded - grossCapacity);
    if (shortfallFinal < 1) shortfallFinal = 0;

    return {
      inputs: inp, prof: prof, steady: steady, steadyMo: steadyMo,
      dealsPerYear: steady / inp.acv,
      seatYear1M1: seatYear1(1, steadyMo, prof),
      rampQuarters: [0, 1, 2, 3].map(function (q) {
        return sum(seatMonths(1, steadyMo, prof).slice(q * 3, q * 3 + 3));
      }),
      churnD: churnD, expansionNet: expansionNet,
      netNewNeeded: netNewNeeded, grossNeeded: grossNeeded,
      existingGross: existingGross, newSeats: newSeats, seats: seats, rows: rows,
      monthly: monthly, grossCapacity: grossCapacity, haircutD: haircutD,
      netNewLogo: netNewLogo, logos: logos, exitArr: exitArr, exitRunRate: exitRunRate,
      shortfall: shortfallFinal, covered: grossNeeded <= existingGross,
      assumptions: assumptions,
      lastHireMonth: newSeats.length ? newSeats[newSeats.length - 1].hireMonth : 0,
      activity: { meetings: meetings, quals: quals, povs: povs, wins: wins,
                  weekly: meetings / SELL_WEEKS, seatMeetingsY1: seatMeetingsY1, funnel: FUNNEL },
      team: { totalAes: totalAes, existingAes: existingAes, newAes: newSeats.length,
              totalSes: totalSes, newSes: seHires.length, seHires: seHires,
              totalBdrs: totalBdrs, newBdrs: bdrHires.length, bdrHires: bdrHires,
              leaders: leaderRows },
      burn: { newAeBase: newAeBase * load, aeVarNew: aeVarNew * load, aeVarPool: aeVarPool * load,
              seNew: seCostNew.total * load, bdrNew: bdrCostNew.total * load,
              leadership: leaderCost.total * load,
              buildCost: buildCost, carriedCost: carriedCost, totalCost: totalCost,
              runRate: runRate, runRateMo: runRate / 12,
              perDollar: netNewLogo > 0 ? totalCost / netNewLogo : 0,
              pctOfExit: exitArr > 0 ? totalCost / exitArr : 0 },
      bdrCheck: { needed: bdrMeetingsNeeded, capacity: bdrFleetCapacity, util: bdrUtil }
    };
  }

  /* Hiring solver contract, tested in test-engine.cjs:
   * 1. Add up to adv.maxPerMonth seats per month, front-loaded, until
   *    year-1 gross clears grossNeeded.
   * 2. Then push each hire as late as possible while the target still
   *    clears and no month exceeds adv.maxPerMonth.
   * Objective: fewest hires, then latest feasible start dates. */
  root.ENGINE = {
    MODEL_VERSION: '0.3.0',
    DEFAULTS: DEFAULTS, FUNNEL: FUNNEL, ANCHOR: ANCHOR,
    profileFor: profileFor, steadyAnnual: steadyAnnual,
    seatYear1: seatYear1, seatMonths: seatMonths, compute: compute
  };
})(typeof window !== 'undefined' ? window : globalThis);
