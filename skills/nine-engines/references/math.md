# Running the tested engines

Two deterministic engines, zero dependencies, Node only.

## engine/mix.js · params to portfolio

    node engine/run.cjs              # company/params.yaml, markdown out
    node engine/run.cjs --json       # machine-readable
    node engine/test-mix.cjs         # 18 scenario tests

`recommend(params)` returns per-engine verdicts (run_now,
instrument_now, defer, blocked), a reason per verdict, and a budget
split: run_now engines share 85 percent of monthly cash by weight,
instrument_now engines split 15 percent equally, allocations floored so
they never sum past the cash. Thresholds (the $25K manual bar, $50K PLG
velocity line, $75K enterprise line, $8K paid floor, $15K events floor)
are knobs in mix.js, commented where they live.

## engine/engine.js · seats to bookings

    node engine/test-engine.cjs      # 29 tests against the workbook

Ported from the Sales Capacity Model workbook and verified to the
dollar. The methodology, locked: ramp is $0 / $125K / $225K / $250K per
tenure quarter (monthly 0 / 41,667 / 75,000 / 83,333); steady-state
derives from ACV and cycle (the anchor: $1.0M a year at $120K ACV on a
178-day cycle); a 30 percent haircut turns gross capacity into net new
ARR; support builds at 2.5 AEs per SE and per BDR; leadership loads in
at the stated thresholds.

The canonical check: defaults ($1.2M base, 6 percent churn, $1.0M
expansion, $7.0M target, $120K ACV, 178 days, 2 ramped + 2 ramping AEs)
produce gross capacity $6,958,328 and exit ARR $7,000,830 with seven new
hires. If a change to engine.js moves those numbers, the change is
wrong.

Note: run.cjs plans NEW hires in months 1 through 12 with a max of two a
month (the workbook's rule), then relaxes hires later where the target
still clears, so its seat plan can differ from the deck's fixed example
while landing the same bridge.

## What the numbers are for

The mix decides where the money goes; the capacity model decides whether
the bookings target is physically reachable with the seats and ramp
times stated. A plan that funds engines but cannot staff the resulting
meetings fails in Q3, quietly. Run both, always.

Benchmark ranges are directional, drawn from operating experience; the
2026 market data is industry-reported.
