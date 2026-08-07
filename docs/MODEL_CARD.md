# Model card

Project: pipeline-gen-as-code (The Nine Engines)
Maintainer: Andrew Wesbecher, andrew@wesbecher.llc
Versions in this card: model 0.3.2, mix 0.3.2, params schema v1,
output schema v4. The runner prints all four on every run, and every
generated artifact carries them alongside the generation date and a
parameter hash.
Status: design-partner beta. No real-company case study exists yet.

## What this model does

It takes a company's parameters and returns two things: a verdict and a
budget number for each of nine pipeline engines, and a sales capacity
plan against a 12-month ARR target. It also writes a board memo, a
90-day plan, and a weekly operating loop from those outputs.

It is deterministic. The same parameters produce the same numbers on
every run, on every machine, with no network calls and no runtime
dependencies. Every verdict carries its reason and the exact decision
inputs that produced it.

It is not a statistical model. Nothing here is fitted to a training set.
The constants are an operator's numbers, written down where you can read
them and argue with them.

## Intended use

- A founder or revenue leader deciding where next quarter's pipeline
  comes from and what it costs.
- A first pass at whether an ARR target is staffable at all, and what
  hiring and payroll it would take.
- A board conversation with the assumptions on the table instead of
  inside a spreadsheet nobody opens.
- A starting hypothesis that a competent operator overrides. Overrides
  are first-class: the model records its recommendation, your decision,
  your rationale, the approver, and the date, and re-applies your
  standing decisions on every rerun.

## Out-of-scope use

- Forecasting. The model does not predict bookings, pipeline, or
  revenue, and no output should be entered into a forecast as a
  commitment.
- Board or investor reporting of expected results. The board memo
  reports a plan and its assumptions, not an outcome.
- Compensation decisions, quota setting, or performance management for
  named individuals.
- Fundraising materials that present these numbers as measured
  performance.
- Any use where the reader will not see the assumptions. The model is
  only useful with its reasons attached.

## The two calculations, and the gap between them

The repository runs two separate calculators, and they do not feed each
other.

**Engine allocation** (`engine/mix.cjs`). Nine engines, one of three
verdicts each (run now, instrument now, defer), and an exact split of
the monthly pipeline budget in basis points. Run-now engines share an 85
percent pool by weight, instrument-now engines share 15 percent, and any
engine with a published minimum monthly spend (paid media $8,000, events
$15,000) is funded only when the split actually reaches that floor.
Otherwise it defers and says so, and its share returns to the engines
that clear their own bar. Unallocated cash is reported, never hidden.

**Sales capacity** (`engine/engine.cjs`). Seat-level ramp math against
an ARR target: gross capacity, net-new ARR after a haircut, exit ARR, an
AE hiring schedule by month, BDR and SE support, leadership seats, and
sales payroll run rate. Staffing reports three verdicts, AE bookings
capacity, BDR support capacity, and overall, and overall never reads
"clears" while a support layer is over capacity.

**Engine spend is not converted into meetings or bookings.** There is no
function anywhere in this repository that turns a dollar of engine
budget into a meeting, a pipeline dollar, or a booking. The allocation
answers "where should this money go, given who you are." The capacity
model answers "can a team of this shape carry this number." Nothing
joins them. Do not read the two outputs as one funnel.

## Empirically validated versus operator heuristic

Be precise about what the test suite proves.

**What the suite proves.** Five suites and 340 assertions on the 0.3.2
release, run on Node 18, 20, and 22 on Ubuntu and Node 18 and 22 on
macOS:

- Deterministic implementation. The math is reproducible and the
  invariants hold across swept inputs, not only on the fixture.
- Regression behavior. Every defect fixed since 0.2.0 carries a test
  that fails on the old code.
- Pinned fixtures. `engine/fixtures.json` holds exact pins for the
  workbook-schedule fixture (parity with the source workbook within a
  stated $50 tolerance, because the workbook rounds monthly cells), the
  solver-default fixture (pinned to the dollar), and the Acme example.
- Documentation consistency. The README, the committed plan, and the
  board memo must publish the same numbers as the fixtures, and the docs
  suite fails if they drift.
- Fail-closed inputs. Every input the audit found failing open now fails
  closed with a named field and exit code 2.
- Packaging. Captured stdout is complete, the engines resolve as
  CommonJS under an ESM ancestor, both official plugin manifests
  validate, and the skills depend on no Claude-specific variable.

**What the suite does not prove.** It does not establish predictive
validity. No test compares a model output to a real company's realized
bookings, pipeline, hiring, or payroll, because no such comparison
exists. Reproducibility is not accuracy. A wrong constant computes
wrongly with perfect consistency.

**What the constants are.** The core capacity and mix constants are
declared operator heuristics in [SOURCES.md](SOURCES.md):

| Claim ID | Constant | Status |
|---|---|---|
| CAP-1 | Funnel: 16 percent meeting to qualified, 27 percent qualified to POV, 81 percent POV to win | Operator heuristic, tested for reproducibility |
| CAP-2 | Steady-state anchor: $1.0M per ramped AE at $120K ACV on a 178-day cycle | Operator heuristic, lightly corroborated |
| CAP-3 | Ramp vector across tenure quarters | Operator heuristic, directionally corroborated |
| CAP-4 | 30 percent haircut from gross capacity to net-new ARR | Operator heuristic, no source found |
| CAP-5 | Support ratios of 2.5 AEs per SE and per BDR, and the leadership thresholds | Operator heuristic, no source found |
| MIX-1 | The 85/15 run and instrument split and every ACV or cash threshold | Operator heuristic, knobs by design |

The playbook's benchmark claims are a separate matter. Each one resolves
to a claim ID in SOURCES.md with a source, sample size, cohort, method,
evidence class, and confidence, or it carries the ANDREW OPERATOR
HEURISTIC label. The 2026-08-05 verification pass demoted eleven claims
and corrected six others. Those benchmarks inform the playbook cards.
They are not inputs to either calculator.

## Inputs

Inputs arrive as `company/params.yaml` (a strict documented YAML subset)
or the equivalent JSON, validated against params schema v1. Unknown keys
are rejected. Invalid input exits 2 with field-specific errors. Nothing
fails open. The three groups are published in `--help`, in the schema,
in the README, and in each verdict's decision inputs list:

**Portfolio drivers** decide engine verdicts: ACV, monthly pipeline
budget, AE and GTM-engineer coverage, product self-serve shape, and hard
constraints (no email, no phone, no paid budget, no events budget, no
community capacity, founder will not post).

**Capacity drivers** feed the staffing model: sales cycle, base ARR, ARR
target, churn, expansion, current AEs ramped and ramping, BDRs, and
optionally SEs, sales leaders, BDR managers, SE leads, and real ramp
cohort tenures.

**Narrative context** is carried into outputs and drives no verdict:
company, stage, funding, ICP, personas, and the engines already running.
Engines already running are annotated on verdicts and do not change
them. If a field cannot change the answer, the repository says so
instead of implying otherwise.

Anything the model derives rather than reads (a BDR count, an SE count,
a ramp stagger) is disclosed in the output assumptions list.

## Known failure modes

1. **No demand model sits behind the meeting count.** The capacity model
   asks how many meetings a team can work and whether the BDR layer can
   source them. It never asks whether the market will supply them at the
   assumed conversion rates. A plan can clear on paper in a market that
   will not produce the meetings.
2. **No cash or runway model.** The model reports sales payroll run rate
   and monthly pipeline spend. It does not model burn, runway, gross
   margin, cash collection, or whether the company can afford the plan
   it just produced. A plan that clears the ARR target can still be
   unfundable.
3. **Ramp and productivity constants are heuristics, not fitted
   parameters.** CAP-1 through CAP-5 are one operator's numbers. If your
   funnel converts differently, if your reps ramp faster or slower, or
   if your steady-state per-rep number is not near the anchor, every
   downstream figure moves. Recalibrate before you rely on the output.
4. **Spend floors and thresholds are knobs.** The $25K ACV rep-led bar,
   the $75K ACV ABM bar, the $8,000 paid media floor, the $15,000 events
   floor, and the 85/15 pool split are choices. They are commented where
   they live in `engine/mix.cjs`. Change one and the verdict table
   changes with it.
5. **The plan assumes hiring succeeds on schedule.** The solver returns
   hire months and prices them. It assumes those roles get filled in
   those months at the stated compensation, with no attrition, no failed
   searches, no offers declined, and no time to productivity beyond the
   ramp vector. Real hiring slips, and slipping hiring moves exit ARR.
6. **Two calculators, one document.** The board memo puts the allocation
   and the capacity plan on the same page. A reader can infer a causal
   link that the model does not compute. Say out loud that the split is
   a hypothesis when you present it.
7. **Current engine performance is collected as context, not consumed.**
   The engines you already run are annotated on the verdicts and do not
   change them. If your automated outbound is failing today, the model
   will still recommend it.
8. **Benchmarks age.** Every market statistic in SOURCES.md expires for
   planning purposes on 2027-08-05.

## Calibrating this on real data

If you have your own funnel data, use it. The order that pays best:

1. **Replace the funnel rates (CAP-1)** with your own meeting to
   qualified, qualified to POV, and POV to win, measured on closed
   cohorts rather than open pipeline.
2. **Replace the steady-state anchor (CAP-2)** with the annual bookings
   your fully ramped reps actually produce at your ACV and cycle. Pass
   the advanced steady override rather than reverse-engineering ACV.
3. **Replace the ramp vector (CAP-3)** with your own cohort curve.
   Measure the last two or three hiring classes month by month. Feed
   real tenures through `team.aes_ramping_tenure_months` so the model
   uses cohorts instead of the default stagger.
4. **Set the haircut (CAP-4)** from your own gross-to-net history:
   downgrades, clawbacks, slipped starts, and anything else that stands
   between a booking and net-new ARR.
5. **Set the support ratios (CAP-5)** from how your team actually runs,
   not from the default 2.5.
6. **Argue with the mix thresholds (MIX-1)** engine by engine. If your
   paid program is efficient at $4,000 a month, lower the floor and note
   why.
7. **Backtest before you trust it.** Run the model on your parameters as
   of four quarters ago and compare the output to what happened. Record
   the delta. That comparison, not the test suite, is what earns the
   model a role in a decision.
8. **Write down every change.** Constants you edit are yours now.
   Reviewers of your plan need to know which numbers came from the
   repository and which came from you.

## Versioning

Four version fields travel with every run and appear in the JSON output
and the runner banner:

- **`model_version`** (`engine/engine.cjs`, currently 0.3.2) covers the
  capacity model: unit economics, ramp, the hiring solver, support
  scheduling, and payroll. Change any capacity number or rule and this
  moves. `engine/fixtures.json` records the model version it was
  generated under.
- **`mix_version`** (`engine/mix.cjs`, currently 0.3.2) covers the
  engine verdicts, thresholds, spend floors, weights, and the
  allocation. Change a verdict rule or a threshold and this moves. It
  moves independently of the model version.
- **`params_schema_version`** (`engine/params.cjs`, currently 1) is the
  input contract. Adding an optional field is a compatible change.
  Renaming, removing, or retyping a field, or changing validation so
  that previously valid input is rejected, is a breaking change and
  requires a new schema version.
- **`output_schema_version`** (`engine/run.cjs`, currently 3) is the
  shape of the JSON. Anything consuming the JSON pins this. It moved to
  3 when per-layer staffing status and the two scenario tables were
  added.

The package version in `package.json` is the release version, and all
plugin manifests must agree with it (the packaging suite enforces this).
Every model or mix change requires a version bump and a CHANGELOG entry.
Fixtures are regenerated only by running `node engine/gen-fixtures.cjs`
deliberately, and the diff is reviewed.

## Data handling

The calculators run locally, make no network calls, collect no
telemetry, and send nothing anywhere. Your parameters and generated
plans stay on your disk. `company/params.yaml`, `company/params.json`,
their local variants, and everything under `plan/` are gitignored by
default so a public fork cannot leak a real company's numbers.

The assistant layer is a separate question with different properties.
When you run this through Claude Code, Cowork, Codex, or an MCP
connector, that provider processes whatever you share with it under its
own policy, your account tier, and your retention settings. Confirm you
are working in an approved AI environment before you enter real ARR,
payroll, hiring, customer, or pipeline data. Full detail in
[PRIVACY.md](PRIVACY.md).

## Status and evidence of use

This project is a design-partner beta. No real-company case study
exists yet. The only worked example in the repository is Acme Security,
an explicitly illustrative made-up company committed under
`examples/acme/`. The maintainer's operating record is described in the
README, and the model did not produce those results and does not claim
it would. It encodes how he decides.

The v1 exit criteria, including the case study and the design-partner
reviews that would change this section, are in
[ROADMAP.md](../ROADMAP.md).
