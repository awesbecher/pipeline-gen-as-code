# Running the tested engines

Two deterministic engines, zero dependencies, Node only.

## engine/mix.js · params to portfolio

    node engine/run.cjs <params.yaml>   # markdown out; --json / --board
    node engine/run.cjs --example       # the Acme fixture, explicit only
    node engine/test-mix.cjs            # verdicts, thresholds, sweep

`recommend(params)` returns per-engine verdicts (run_now,
instrument_now, defer, blocked), a reason and decision_inputs per
verdict, and an exact budget split in basis points: run_now engines
share 8500 bps by weight, instrument_now engines split 1500 bps
equally, allocated and unallocated totals reported so cash always
reconciles to the dollar. The split is a starting allocation
hypothesis; it is not connected to the capacity forecast. Thresholds (the $25K manual bar, $50K PLG
velocity line, $75K enterprise line, $8K paid floor, $15K events floor)
are knobs in mix.js, commented where they live.

## engine/engine.js · seats to bookings

    node engine/test-engine.cjs      # named, pinned fixtures

Ported from the Sales Capacity Model workbook. Two named fixtures in
engine/fixtures.json anchor it: workbook-schedule reproduces the
workbook's forced hiring grid within a stated $50 tolerance (the
workbook rounds monthly cells to whole dollars; the model computes
exactly, and its own values are pinned exactly), and solver-default
pins the solver's outputs to the dollar. The methodology, locked: ramp is $0 / $125K / $225K / $250K per
tenure quarter (monthly 0 / 41,667 / 75,000 / 83,333); steady-state
derives from ACV and cycle (the anchor: $1.0M a year at $120K ACV on a
178-day cycle); a 30 percent haircut turns gross capacity into net new
ARR; support builds at 2.5 AEs per SE and per BDR; leadership loads in
at the stated thresholds.

The canonical solver check: defaults ($1.2M base, 6 percent churn,
$1.0M expansion, $7.0M target, $120K ACV, 178 days, 2 ramped + 2
ramping AEs) produce gross capacity $6,991,639 and exit ARR $7,022,147
with seven new hires (fixture solver_default, pinned exactly). Current
BDR, SE, leadership, and ramp-cohort inputs are honored when supplied
and disclosed as derived assumptions when not. If a change moves a
pinned number, the change is wrong or the fixture regeneration is a
deliberate reviewed act.

Solver objective, tested: fewest hires that clear the target at a max
of two per month, front-loaded, then each hire pushed as late as
feasibility allows. The workbook's own forced schedule (8 hires) is
the separate workbook_schedule fixture.

## What the numbers are for

The mix decides where the money goes; the capacity model decides whether
the bookings target is physically reachable with the seats and ramp
times stated. A plan that funds engines but cannot staff the resulting
meetings fails in Q3, quietly. Run both, always.

Every benchmark claim resolves to a claim ID in docs/SOURCES.md with
source, evidence class, and confidence; unsourced numbers are labeled
Andrew operator heuristics.
