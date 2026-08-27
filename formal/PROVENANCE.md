# Provenance

Request id: `0a5a913e-6fbe-4862-93e6-717ff6f63e2a`
Date: 2026-08-27
Prover: Harmonic Aristotle
Export inner directory: `ffc12892-1f76-4407-90c1-9da980bc355e_aristotle/`
Flattened into `formal/` byte for byte. Lean sources are not edited.

Repo commit the model was built from: unknown. The export and `ARISTOTLE_SUMMARY.md` do not name a git SHA. This tree vendors the export against `pipeline-gen-as-code` v0.3.2 on `main` at `f00ecb716c06d4de58405ef129b3988d7f7e40af`.

Tarball pin (courier, not kept on the branch):
- file: `_inbox/aristotle-0a5a913e.tar.gz`
- size: 29853 bytes
- sha256: `c960e21d6f9c70b72923c598759840e4f9c276b46f6a51ef02fdf5e1698b4e1f`

## Axiom check

Every theorem in `RequestProject/` is intended to depend only on Lean's standard axioms: `propext`, `Classical.choice`, `Quot.sound`. The sources contain no `sorry` and no `native_decide`. `lake build` in this directory is the machine check. The JavaScript calculators are not themselves proved; they are pinned by fixtures and by the invariant tests in `engine/`.

## Theorems

Names below are the `theorem` declarations in the vendored sources, grouped by file.

### `RequestProject/Apportionment.lean`

- `sum_shares`
- `sum_shares_le`
- `shares_eq_floor_or_succ`

### `RequestProject/Mix.lean`

- `runBps_total`
- `instBps_total`
- `totalBps_le`
- `totalBps_eq`
- `allocated_le_cash`
- `allocated_add_unallocated`
- `bps_eq_zero_of_not_funded`
- `monthly_eq_zero_of_not_funded`
- `spend_floor_respected`
- `constraint_noEmail_blocks_automated`
- `constraint_noPhoneEmail_defers_manual`
- `constraint_noCommunity_defers_community`
- `constraint_founderWontPost_defers_social`
- `constraint_noPaidBudget_defers_paid`
- `constraint_noEventsBudget_blocks_events`
- `acme_bps`
- `acme_allocated`

### `RequestProject/Capacity.lean`

- `seatYear1_antitone`
- `seatYear1_eq_zero_of_late`
- `seatYear1_le`
- `exitArr_ge_target` (`Capacity.Bridge`)
- `shortfall_eq_zero_iff`

### `RequestProject/Hiring.lean`

- `capacityOf_le_frontLoaded`
- `hireCount_clears`
- `hireCount_minimal`

### `RequestProject/Solver.lean`

- `relaxAux_length`
- `relax_length`
- `relaxAux_clears`
- `relax_clears`
- `relaxAux_feasible`
- `relax_feasible`
- `newSeats_length`
- `newSeats_feasible`
- `newSeats_clears`
- `newSeats_minimal`
- `exitArr_ge_target` (`Solver.Inputs`)

### `RequestProject/SolverDefault.lean`

- `solverDefault_existingGross`
- `solverDefault_hireCount`
- `solverDefault_greedy`
- `solverDefault_bestMonth_last`
- `solverDefault_newSeats`
- `solverDefault_hires`
- `solverDefault_grossCapacity`
- `solverDefault_exitArr`
- `solverDefault_clears`
- `solverDefault_shortfall`
- `solverDefault_feasible`
- `solverDefault_minimal`

### `RequestProject/Support.lean`

- `needAt_covers`
- `needAt_mono`
- `supportHeadcount_covers`
- `supportHeadcount_mono`
- `avpsFor_covers`
- `avpsFor_no_slack`
- `avpsFor_eq_zero`
- `avpsFor_mono`
- `bdrFill_covers`

### `RequestProject/SupportPlan.lean`

- `ratioAux_covers`
- `ratioHires_covers`
- `ratioHires_ratio_covered`
- `bdrPlan_covers_meetings`
- `bdrPlan_covers_ratio`
- `solverDefault_ratioHires`
- `solverDefault_totalSes`
- `solverDefault_bdrMeetings`
- `solverDefault_bdrPlan`
- `solverDefault_totalBdrs`
- `solverDefault_bdrCapacity`
- `solverDefault_bdrClears`
