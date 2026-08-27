This project was edited by [Aristotle](https://aristotle.harmonic.fun).

To cite Aristotle:
- Tag @Aristotle-Harmonic on GitHub PRs/issues
- Add as co-author to commits:
```
Co-authored-by: Aristotle (Harmonic) <aristotle-harmonic@harmonic.fun>
```

# A formal model of the `pipeline-gen-as-code` calculators

This Lean 4 project (Mathlib) is a machine-checked model of the two calculators
in the inspected repository — the marketing mix / budget allocator (`engine/mix.cjs`)
and the sales capacity model (`engine/engine.cjs`) — together with proofs of the
invariants the calculators rely on.

Everything builds with `lake build`, and no file contains `sorry`; every theorem
listed below depends only on Lean's standard axioms (`propext`,
`Classical.choice`, `Quot.sound`).

## Files

| file | what it models |
| --- | --- |
| `RequestProject/Apportionment.lean` | the largest-remainder `apportion` helper of the mix engine |
| `RequestProject/Mix.lean` | the nine engine verdicts, the basis-point split, the spend-floor loop, the constraint vocabulary |
| `RequestProject/Capacity.lean` | ramp profiles, per-seat year-one capacity, the ARR bridge |
| `RequestProject/Hiring.lean` | front-loaded hiring and the minimal hire count |
| `RequestProject/Support.lean` | support ratios, leadership coverage, the BDR top-up loop |
| `RequestProject/Solver.lean` | the relaxation pass and the solver end to end |
| `RequestProject/SolverDefault.lean` | the published `solver_default` fixture, reproduced exactly |
| `RequestProject/SupportPlan.lean` | the SE/BDR ratio schedule, the meeting plan, and their part of the fixture |

## Main results

### Budget allocation

* `Apportion.sum_shares` — the split reconciles exactly: the apportioned shares
  sum to the pool, so no basis point is created or lost.
* `Apportion.shares_eq_floor_or_succ` — no engine is ever more than one basis
  point away from its exact proportional entitlement.
* `Mix.totalBps_eq` / `Mix.totalBps_le` — exactly 10 000 basis points are handed
  out when both pools have a taker (8 500 by weight to the running engines,
  1 500 equally to the instrumenting ones), and never more than 10 000 otherwise.
* `Mix.allocated_add_unallocated` — allocated plus unallocated dollars equal the
  monthly pipeline budget, to the dollar, for any inputs.
* `Mix.bps_eq_zero_of_not_funded` — an engine that neither runs nor instruments
  gets nothing.
* `Mix.spend_floor_respected` — any funded engine carrying a spend floor (Paid
  Media $8 000, Events $15 000 a month) ends up at or above that floor; in
  particular the floor loop always terminates inside its fuel budget.
* `Mix.constraint_*` (six theorems) — each hard constraint really does switch its
  engine off and leave it unfunded.
* `Mix.acme_bps` / `Mix.acme_allocated` — the model reproduces the published
  Acme example exactly: verdicts and shares
  2125 / 0 / 3188 / 2125 / 750 / 0 / 750 / 1062 / 0 basis points, $24 999
  allocated and $1 unallocated of a $25 000 budget.

### Sales capacity

* `Capacity.seatYear1_antitone` — hiring later never books more.
* `Capacity.Bridge.exitArr_ge_target` — the bridge closes: gross capacity meeting
  the gross requirement implies exit ARR meeting the ARR target.
* `Hiring.capacityOf_le_frontLoaded` — front-loading is optimal: under a monthly
  hire cap, no schedule with the same number of hires books more in year one.
* `Hiring.hireCount_clears` / `Hiring.hireCount_minimal` — the solver's hire count
  clears the requirement whenever anything feasible does, and is the smallest
  such count.
* `Solver.relax_clears`, `Solver.relax_length`, `Solver.relax_feasible` — the
  relaxation pass that slides hires later never drops the plan below the
  requirement, never changes the number of hires, and never breaks the plan year
  or the monthly cap.
* `Solver.Inputs.exitArr_ge_target` — end to end: a solved plan reaches the ARR
  target whenever any schedule within the monthly cap could have.
* `Support.supportHeadcount_covers` — the derived SE/BDR build covers its AE
  ratio in every month.
* `Support.avpsFor_covers` / `Support.avpsFor_no_slack` — one Area VP per eight
  AEs covers the team above the threshold, with no redundant leader.
* `Support.bdrFill_covers` — the BDR top-up loop ends up covering the meeting
  plan, so reported utilisation never exceeds 100%.
* `Support.ratioHires_covers` — after the ratio pass the support headcount in
  seat meets the AE ratio in every month of the plan.
* `Support.bdrPlan_covers_meetings` / `Support.bdrPlan_covers_ratio` — the BDR
  build satisfies both constraints at once: the meeting plan and the ratio. The
  reference notes that scheduling on the ratio alone is what once let a plan
  report "clears" at 118% BDR utilisation.
* `Support.solverDefault_*` — the supporting build of the fixture, exactly:
  five SEs, six BDRs (new hires in months 1, 2, 3, 5), 780 SAO points of
  capacity against 777.33 required.
* `Solver.solverDefault_*` — the `solver_default` fixture, exactly: seven new AEs
  in months 1, 1, 2, 2, 3, 3, 5, on $3 616 652.20 of carried capacity, for
  $6 991 638.70 of gross capacity, $7 022 147.09 of exit ARR and no shortfall.

## Modelling choices

* All money and rates are rationals, not floats, so every identity above is
  exact; the reference implementation computes in IEEE doubles and therefore
  agrees after rounding. Basis points and dollars in the mix engine are natural
  numbers, matching the reference implementation's integer rounding.
* The mix model covers the arithmetic only: reason strings, labels and the
  "already running" annotation are omitted (the reference states the last does
  not change verdicts).
* In the unreachable-target case the models differ: the reference greedy loop
  stops as soon as a hire month books nothing and reports a shortfall, whereas
  the model's `hireCount` returns a full year of hires. The solver theorems are
  accordingly conditioned on some feasible schedule clearing the requirement.
