# Roadmap

## Current state

Design-partner beta. The last released version is 0.3.2 (see
[docs/RELEASE.md](docs/RELEASE.md)), tagged and green in CI on Node 22
and 24 across Ubuntu and macOS, with both official plugin validators
passing. The 0.3.2 trust pass added the public maintainer surface: this
roadmap, a model card, a contributing guide, a security policy, issue
forms, and a pull request template.

What works today: fail-closed input validation against params schema
v1, nine deterministic engine verdicts with an exact budget split and
enforced spend floors, a tested sales capacity model with a hiring
solver and priced leadership seats, a board memo generator with two
scenario tables, a weekly operating loop with persisted management
overrides, a claim registry where every benchmark carries a source or
an operator-heuristic label, and five test suites that hold the
documentation to the pinned fixtures.

What does not exist yet: any real-company case study, any demand model,
any cash or runway model, and any completed design-partner review
round. The only worked example in the repository is Acme Security, an
explicitly illustrative made-up company.

## Non-goals

These are decisions, not a backlog.

- **Not a forecasting tool.** The model produces a starting hypothesis
  and a staffing check. It does not predict bookings, pipeline, or
  revenue, and engine spend is never converted into meetings or
  bookings. The gap between the two calculators is deliberate and
  documented in [docs/MODEL_CARD.md](docs/MODEL_CARD.md).
- **Not a CRM.** No records, no ownership, no activity tracking, no
  writes into anyone's system of record.
- **Not a data platform.** No warehouse, no pipelines, no storage of
  company data. Your parameters and plans are files on your disk.
- **No runtime dependencies.** Bare Node, no install step, no helper
  libraries, no test framework. This property is tested.
- **No telemetry.** The calculators make no network calls and collect
  nothing. That will not change.
- **No tenth engine.** Nine is the model.

## v1 exit criteria

v1 means a stranger can rely on this in a board conversation. Each
criterion below is checkable by a reader, not a matter of taste.

**1. At least one anonymized real-company case, committed.** A real
company, anonymized, published under `examples/` alongside Acme and
labeled as real rather than illustrative. It has to show, in order:
the parameters as entered, the model output, every override the
operator applied with the recorded rationale and approver, the
decisions the team actually made, and a plain section naming what the
model did not know at the time and how much that mattered. One case
clears this bar. Zero does not.

**2. Demand resolved, one way or the other.** Either the model gains a
demand layer that connects engine spend to meeting volume, with the
constants sourced or labeled and pinned in the fixtures, or the README,
the model card, and the board memo carry an explicit and permanent
statement that demand is out of scope and will not be modeled. What
does not survive to v1 is the current position of leaving the question
open.

**3. Cash and runway resolved, one way or the other.** Either the model
prices the plan against burn and runway, so a plan that clears the ARR
target but cannot be funded says so, or the same explicit and permanent
out-of-scope statement in the same three places. Today the model
reports payroll run rate and stops.

**4. Five to ten CEO and VC design-partner reviews completed.** Real
readers, each one pressure-testing the board memo and the override
flow, each review written up with what confused them, what they did not
believe, and what changed in the repository as a result. Reviews are
counted when the write-up is committed. This is the phase named in
docs/RELEASE.md and deferred twice.

**5. Every benchmark claim verified or labeled.** Zero rows in
docs/SOURCES.md marked UNVERIFIED. Each claim either carries a
resolvable primary source with sample size, cohort, and method, or
carries the ANDREW OPERATOR HEURISTIC label with the implied external
authority stripped. The 2026-08-05 pass demoted eleven claims and
corrected six. The remaining rows that still read as recommendations to
demote have to be resolved.

## After v1

Nothing here is committed, and none of it blocks v1.

- Real ramp and compensation profiles contributed from other operators'
  data, replacing the three cycle-based defaults.
- A backtest harness: run the model on a company's parameters as of
  four quarters ago and report the delta against what happened.
- More verified connector setups, with the same standard of pinned
  versions and secrets kept out of stored configs.
- A clean end-to-end install through the Codex CLI, which would let the
  README stop saying clone-first for Codex.

Argue with any of this: andrew@wesbecher.llc, or open an issue.
