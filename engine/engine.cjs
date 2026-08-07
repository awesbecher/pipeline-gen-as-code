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
  /* Public boundary check. run.cjs validates against the params schema
   * before it gets here, but compute() is exported, so it refuses
   * nonsense rather than returning quietly broken numbers. */
  function requireFinite(name, x, opts) {
    opts = opts || {};
    if (typeof x !== 'number' || !isFinite(x)) {
      throw new TypeError('ENGINE.compute: ' + name + ' must be a finite number, got ' + JSON.stringify(x));
    }
    if (opts.gt !== undefined && x <= opts.gt) throw new RangeError('ENGINE.compute: ' + name + ' must be greater than ' + opts.gt);
    if (opts.min !== undefined && x < opts.min) throw new RangeError('ENGINE.compute: ' + name + ' must be at least ' + opts.min);
    if (opts.int && x !== Math.trunc(x)) throw new RangeError('ENGINE.compute: ' + name + ' must be a whole number');
  }

  /* Leadership coverage, stated once so the docs and the code cannot
   * drift: one Area VP per eight AEs, and none below five AEs. */
  var AES_PER_AVP = 8;
  var AVP_THRESHOLD_AES = 5;
  function avpsFor(aeCount) {
    if (aeCount < AVP_THRESHOLD_AES) return 0;
    return Math.ceil(aeCount / AES_PER_AVP);
  }
  /* Headcount in seat at plan month m, given carried staff and hire months. */
  function headcountAt(existing, hires) {
    return function (m) {
      var c = existing;
      hires.forEach(function (h) { if (h <= m) c++; });
      return c;
    };
  }
  /* The first plan month where countAt(m) satisfies the test; month 1 if
   * it is already true, month 12 if it never becomes true. */
  function monthCountReaches(countAt, test) {
    for (var m = 1; m <= 12; m++) if (test(countAt(m))) return m;
    return 12;
  }

  function compute(inp) {
    if (!inp || typeof inp !== 'object') throw new TypeError('ENGINE.compute: expected an input object');
    requireFinite('baseArr', inp.baseArr, { min: 0 });
    requireFinite('churnPct', inp.churnPct, { min: 0 });
    requireFinite('expansion', inp.expansion, { min: 0 });
    requireFinite('targetArr', inp.targetArr, { min: 0 });
    requireFinite('acv', inp.acv, { gt: 0 });
    requireFinite('cycleDays', inp.cycleDays, { gt: 0 });
    requireFinite('rampedAes', inp.rampedAes, { min: 0, int: true });
    requireFinite('rampingAes', inp.rampingAes, { min: 0, int: true });
    if (!inp.adv || typeof inp.adv !== 'object') throw new TypeError('ENGINE.compute: adv assumptions object is required');
    requireFinite('adv.haircut', inp.adv.haircut, { min: 0 });
    if (inp.adv.haircut >= 1) throw new RangeError('ENGINE.compute: adv.haircut must be below 1');
    requireFinite('adv.maxPerMonth', inp.adv.maxPerMonth, { gt: 0, int: true });
    ['bdrs', 'ses', 'salesLeaders', 'bdrManagers', 'seLeads'].forEach(function (k) {
      if (inp[k] != null) requireFinite(k, inp[k], { min: 0, int: true });
    });

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

    /* Carried seats. A ramped AE is fully productive by definition, so
     * its notional hire month sits far enough back that every plan month
     * scores at the full rate for THIS ramp profile. A fixed -9 left
     * enterprise reps at 90 percent on the 12-month profile. */
    var rampLength = prof.months[0] + prof.months[1] + prof.months[2];
    var rampedHireMonth = 1 - rampLength;
    var seats = [];
    var i;
    for (i = 0; i < inp.rampedAes; i++) seats.push({ kind: 'ramped', hireMonth: rampedHireMonth });
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

    /* A caller can freeze an approved plan (inp.plan) instead of solving.
     * Board sensitivity runs need the approved schedule held constant
     * while an assumption moves, which is a different question from
     * "what would we hire instead". */
    var frozen = inp.plan && Array.isArray(inp.plan.newSeatMonths) ? inp.plan : null;
    if (frozen) {
      frozen.newSeatMonths.forEach(function (m) { requireFinite('plan.newSeatMonths', m, { gt: 0, int: true }); });
    }

    /* greedy front-loaded hiring, then slide trailing seats later while the target still clears */
    var newSeats = [];
    var shortfall = 0;
    if (frozen) {
      frozen.newSeatMonths.forEach(function (m) { newSeats.push({ kind: 'new', hireMonth: m }); });
    } else if (grossNeeded > existingGross && steadyMo > 0) {
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
    /* BDR pods carry 12 SAO points a month each and source two of every
     * three first meetings. Capacity has to satisfy BOTH the coverage
     * ratio and the meeting plan the AE build implies; scheduling on the
     * ratio alone is what let a plan report "clears" at 118 percent BDR
     * utilization. New hires are prorated: a month-9 BDR works 4 months. */
    var BDR_POINTS_MO = 12;
    var BDR_MEETING_SHARE = 2 / 3;
    var bdrMeetingsNeeded = meetings * BDR_MEETING_SHARE;
    function bdrCapacityOf(hires, existing) {
      var c = existing * 12 * BDR_POINTS_MO;
      hires.forEach(function (m) { c += (13 - m) * BDR_POINTS_MO; });
      return c;
    }

    var seHires, bdrHires, bdrRatioHires, bdrMeetingHires = [];
    if (frozen) {
      seHires = (frozen.seHires || []).slice();
      bdrHires = (frozen.bdrHires || []).slice();
      bdrRatioHires = bdrHires.slice();
    } else {
      seHires = schedule(adv.aePerSe, existingSes);
      bdrRatioHires = schedule(adv.aePerBdr, existingBdrs);
      bdrHires = bdrRatioHires.slice();
      /* Fewest additional BDRs that cover the meeting plan, each started
       * as late as it can be and still close the remaining gap. Mirrors
       * the AE solver objective. */
      var guard = 0;
      while (bdrCapacityOf(bdrHires, existingBdrs) < bdrMeetingsNeeded && guard++ < 500) {
        var gap = bdrMeetingsNeeded - bdrCapacityOf(bdrHires, existingBdrs);
        var m = 13 - Math.ceil(gap / BDR_POINTS_MO);
        if (m < 1) m = 1;
        if (m > 12) m = 12;
        bdrMeetingHires.push(m);
        bdrHires.push(m);
      }
      bdrHires.sort(function (a, b) { return a - b; });
      if (bdrMeetingHires.length) assumptions.push(
        'BDR hiring is set by the meeting plan, not the ' + adv.aePerBdr + ' AE-per-BDR ratio: ' +
        bdrMeetingHires.length + ' of ' + bdrHires.length + ' new BDRs exist to source the ' +
        Math.round(bdrMeetingsNeeded) + ' first meetings the bookings plan implies.');
    }
    var totalSes = existingSes + seHires.length;
    var totalBdrs = existingBdrs + bdrHires.length;

    /* Leadership: AVP at 5+ AEs (1 per 8), BDR manager at 3+ BDRs, SE
     * lead at 3+ SEs. Carried managers count ONLY when the caller states
     * them. Inferring an existing manager from headcount and then leaving
     * the salary out understated payroll by six figures. */
    var leaders = [];
    var suppliedLeaders = inp.salesLeaders != null ? inp.salesLeaders : null;
    var carriedAvps = suppliedLeaders != null ? suppliedLeaders : 0;
    var carriedBdrMgrs = inp.bdrManagers != null ? inp.bdrManagers : 0;
    var carriedSeLeads = inp.seLeads != null ? inp.seLeads : 0;
    if (adv.leadership) {
      /* One AVP per eight AEs, the rule as written, encoded once.
       * floor() used to give a single AVP anywhere from 9 to 15 AEs,
       * which is not one per eight. Below the 5-AE threshold the
       * founder or head of sales carries the team and none is priced. */
      var avpNeed = avpsFor(totalAes);
      if (suppliedLeaders == null) assumptions.push(
        'Current sales leadership not supplied; the plan assumes none is in place and prices every leader it adds (set team.sales_leaders to carry existing leaders).');
      /* Each added leader starts the month their threshold is crossed,
       * not the month of the first AE hire. */
      for (i = carriedAvps; i < avpNeed; i++) {
        leaders.push({ role: 'avp', month: monthCountReaches(aeCountAt, function (c) { return avpsFor(c) >= i + 1; }) });
      }
      var bmNeed = totalBdrs >= 3 ? 1 : 0;
      if (inp.bdrManagers == null && bmNeed) assumptions.push(
        'Current BDR management not supplied; the plan hires and prices a BDR manager (set team.bdr_managers if one is already in seat).');
      var bdrCountAt = headcountAt(existingBdrs, bdrHires);
      for (i = carriedBdrMgrs; i < bmNeed; i++) {
        leaders.push({ role: 'bdrMgr', month: monthCountReaches(bdrCountAt, function (c) { return c >= 3; }) });
      }
      var slNeed = totalSes >= 3 ? 1 : 0;
      if (inp.seLeads == null && slNeed) assumptions.push(
        'Current SE leadership not supplied; the plan hires and prices an SE lead (set team.se_leads if one is already in seat).');
      var seCountAt = headcountAt(existingSes, seHires);
      for (i = carriedSeLeads; i < slNeed; i++) {
        leaders.push({ role: 'seLead', month: monthCountReaches(seCountAt, function (c) { return c >= 3; }) });
      }
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
    var carriedLeaderCost =
        carriedAvps * (comp.avp.base + comp.avp.variable * attain) +
        carriedBdrMgrs * (comp.bdrMgr.base + comp.bdrMgr.variable * attain) +
        carriedSeLeads * (comp.seLead.base + comp.seLead.variable * attain);
    var buildCost = (newAeBase + aeVarNew + seCostNew.total + bdrCostNew.total + leaderCost.total) * load;
    var carriedCost = (carriedAeBase + aeVarCarried + seCostCarried.total + bdrCostCarried.total + carriedLeaderCost) * load;
    var totalCost = buildCost + carriedCost;

    var oteAll = totalAes * (comp.ae.base + comp.ae.variable)
               + totalSes * (comp.se.base + comp.se.variable)
               + totalBdrs * (comp.bdr.base + comp.bdr.variable);
    leaders.forEach(function (l) { oteAll += comp[l.role].base + comp[l.role].variable; });
    /* Every seat the plan assumes is priced, carried or hired. */
    oteAll += carriedAvps * (comp.avp.base + comp.avp.variable);
    oteAll += carriedBdrMgrs * (comp.bdrMgr.base + comp.bdrMgr.variable);
    oteAll += carriedSeLeads * (comp.seLead.base + comp.seLead.variable);
    var runRate = oteAll * load;

    /* Support capacity is reported as its own verdict. A staffing plan
     * whose support layer runs above 100 percent has not cleared, whatever
     * the AE bookings math says. */
    var bdrFleetCapacity = bdrCapacityOf(bdrHires, existingBdrs);
    var bdrUtil = bdrFleetCapacity > 0 ? bdrMeetingsNeeded / bdrFleetCapacity : (bdrMeetingsNeeded > 0 ? Infinity : 0);
    var bdrShortPoints = Math.max(0, bdrMeetingsNeeded - bdrFleetCapacity);
    var bdrStatus = bdrMeetingsNeeded === 0 ? 'not_required'
                  : (bdrUtil > 1 ? 'over_capacity' : 'clears');
    /* The extra full-year BDRs it would take to close a gap, when one
     * survives (a frozen plan, or the hire cap). */
    var bdrAdditionalNeeded = Math.ceil(bdrShortPoints / (12 * BDR_POINTS_MO));
    var bdrEarliestFixMonth = bdrShortPoints > 0
      ? Math.max(1, Math.min(12, 13 - Math.ceil(bdrShortPoints / BDR_POINTS_MO)))
      : null;

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
              carriedAvps: carriedAvps, carriedBdrMgrs: carriedBdrMgrs, carriedSeLeads: carriedSeLeads,
              leaders: leaderRows },
      /* The approved plan, in the shape compute() accepts back as
       * inp.plan, so a sensitivity run can hold it fixed. */
      plan: { newSeatMonths: newSeats.map(function (s) { return s.hireMonth; }),
              bdrHires: bdrHires.slice(), seHires: seHires.slice() },
      /* Per-layer verdicts. Overall clears only when both clear. */
      status: {
        ae_bookings: shortfallFinal > 0 ? 'shortfall' : 'clears',
        bdr_support: bdrStatus,
        overall: shortfallFinal > 0 ? 'shortfall' : (bdrStatus === 'over_capacity' ? 'support_gap' : 'clears')
      },
      burn: { newAeBase: newAeBase * load, aeVarNew: aeVarNew * load, aeVarPool: aeVarPool * load,
              seNew: seCostNew.total * load, bdrNew: bdrCostNew.total * load,
              leadership: leaderCost.total * load,
              buildCost: buildCost, carriedCost: carriedCost, totalCost: totalCost,
              runRate: runRate, runRateMo: runRate / 12,
              perDollar: netNewLogo > 0 ? totalCost / netNewLogo : 0,
              pctOfExit: exitArr > 0 ? totalCost / exitArr : 0 },
      bdrCheck: { needed: bdrMeetingsNeeded, capacity: bdrFleetCapacity, util: bdrUtil,
                  status: bdrStatus, shortPoints: bdrShortPoints,
                  additionalBdrsNeeded: bdrAdditionalNeeded, fixByMonth: bdrEarliestFixMonth,
                  ratioHires: bdrRatioHires.slice(), meetingHires: bdrMeetingHires.slice(),
                  boundBy: bdrMeetingHires.length ? 'meeting_volume' : 'ae_ratio',
                  pointsPerBdrMonth: BDR_POINTS_MO, meetingShare: BDR_MEETING_SHARE }
    };
  }

  /* Hiring solver contract, tested in test-engine.cjs:
   * 1. Add up to adv.maxPerMonth seats per month, front-loaded, until
   *    year-1 gross clears grossNeeded.
   * 2. Then push each hire as late as possible while the target still
   *    clears and no month exceeds adv.maxPerMonth.
   * Objective: fewest hires, then latest feasible start dates. */
  var api = {
    MODEL_VERSION: '0.3.2',
    DEFAULTS: DEFAULTS, FUNNEL: FUNNEL, ANCHOR: ANCHOR,
    profileFor: profileFor, steadyAnnual: steadyAnnual,
    AES_PER_AVP: AES_PER_AVP, AVP_THRESHOLD_AES: AVP_THRESHOLD_AES, avpsFor: avpsFor,
    seatYear1: seatYear1, seatMonths: seatMonths, compute: compute
  };
  /* CommonJS is the contract. The file extension is .cjs and the plugin
   * root declares "type": "commonjs" so an ancestor package.json with
   * "type": "module" cannot turn these files into ES modules, which is
   * what produced "MIX.recommend is not a function" inside an installed
   * plugin cache. The global assignment stays for browser use. */
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.ENGINE = api;
})(typeof window !== 'undefined' ? window : globalThis);
