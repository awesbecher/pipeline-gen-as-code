# Contributing

This is a small, opinionated repository with a single maintainer. The
bar for a merge is that the code and the claims say the same thing after
your change as they did before it. Read this before opening a pull
request.

## Run the tests

```bash
npm test
```

That runs all five suites in order:

```bash
node engine/test-engine.cjs     # capacity: named, pinned fixtures plus swept invariants
node engine/test-mix.cjs        # verdicts, spend floors, constraint sweep, allocation conservation
node engine/test-params.cjs     # schema: every fail-open case fails closed
node engine/test-docs.cjs       # README, plan, and board numbers must match the fixtures
node engine/test-packaging.cjs  # captured stdout, ESM ancestor, manifests, skills, workflow shape
```

All five must pass locally before you open a pull request, not only in
CI. There are no runtime dependencies and there is no build step, so
this takes seconds. CI runs the same chain on Node 18, 20, and 22 on
Ubuntu and Node 18 and 22 on macOS, plus both official plugin
validators.

## The fixtures are exact pins

`engine/fixtures.json` holds pinned values for the workbook-schedule
fixture, the solver-default fixture, and the Acme example. The tests
compare against those numbers exactly, except for the workbook-schedule
parity check, which carries a stated $50 tolerance because the source
workbook rounds monthly cells while the model computes exactly.

Regenerating them is a deliberate, reviewed act:

```bash
node engine/gen-fixtures.cjs
```

If your pull request regenerates fixtures, say so in the description,
say why the numbers moved, and paste the diff of the changed values. A
fixture diff is a claim that the model's answer changed on purpose. A
pull request that quietly regenerates fixtures to make a failing test
pass will be closed.

The same applies to `examples/acme/`. The docs suite runs the example
live and compares it byte for byte with the committed output, so a model
change means regenerating the committed artifacts too.

## Every number needs a source or a label

Every quantitative claim in this repository resolves to a claim ID in
[docs/SOURCES.md](docs/SOURCES.md) or carries the label **ANDREW
OPERATOR HEURISTIC**. There is no third option. The docs suite checks
that every claim ID cited in the playbook and the example plans resolves
in the registry.

A new benchmark claim needs all of this in its registry row:

- A resolvable URL that you fetched yourself, not a URL you inferred
  from a citation.
- Sample size.
- Cohort: who was measured, over what period, in what market.
- Method: how the number was produced, including the attribution model
  if one applies.
- Evidence class and confidence, per the tables at the top of
  SOURCES.md.
- A correction note if it replaces or contradicts an existing row.

If a number has no resolvable primary source, label it an operator
heuristic and strip the implied external authority. That is a normal,
respectable outcome. Do not soften a missing source with "commonly
cited" or "widely reported."

## Model changes need a version bump and a changelog entry

- Capacity math, ramp, solver, support scheduling, or payroll: bump
  `MODEL_VERSION` in `engine/engine.cjs`.
- Verdicts, thresholds, spend floors, weights, or allocation: bump
  `MIX_VERSION` in `engine/mix.cjs`.
- Input contract: bump `SCHEMA_VERSION` in `engine/params.cjs`. Adding
  an optional field is compatible. Renaming, removing, retyping, or
  tightening validation on an existing field is breaking.
- JSON output shape: bump `OUTPUT_SCHEMA_VERSION` in `engine/run.cjs`.
- Release version: `package.json`, and every plugin manifest must agree
  with it. The packaging suite enforces that.

Add a CHANGELOG.md entry under the new version describing what changed
in behavior, not what changed in code. If the change fixes a defect, the
entry names the defect and the pull request adds a regression test that
fails on the old code.

Behavior changes also need their documentation updated in the same pull
request: README, CLAUDE.md, AGENTS.md, the skill references,
docs/MODEL_CARD.md, and the affected playbook cards.

## Writing rules

These are enforced partly by the docs suite and entirely by review:

- No em dashes anywhere. En dashes only as a table placeholder, never in
  prose.
- Active voice. Specific nouns. Short sentences. Operator tone.
- No AI filler, no throat-clearing, no summary paragraphs that repeat
  the section above them.
- Never invent a benchmark number. If you do not have the source open,
  you do not have the number.
- State limits plainly. This repository's credibility comes from what it
  refuses to claim.
- Do not describe the model as a forecast, and do not imply engine spend
  converts into meetings or bookings.

## Contributions that are wanted

- **Source corrections.** A row in docs/SOURCES.md that points at a dead
  URL, a misread figure, a magnitude error, or a claim that its source
  does not actually support. These are the most valuable pull requests
  in the repository. Use the source correction issue form first.
- **Additional ramp or compensation profiles.** Real ramp curves for
  cycles and segments the three current profiles serve badly, and
  compensation structures that differ from the enterprise defaults.
  Bring the data behind the curve.
- **Connector documentation.** Verified setup for tools the nine engines
  run on, with pinned versions, the exact command, and API keys kept out
  of command history and out of stored configs. Say what you verified it
  against and when.
- **Test coverage for edge inputs.** Boundary values, degenerate teams,
  zero and maximum budgets, conflicting constraints, unusual ramp
  cohorts, and any input that makes a calculator return something quiet
  and wrong.
- **Bug reports with a reproduction.** A params file with the
  confidential numbers removed and the exact command beats a
  description.

## Contributions that are not wanted

- **New engines.** Nine is the model. A tenth engine changes the
  methodology, not the code, and that conversation happens before any
  pull request.
- **Scope expansion into forecasting.** No pipeline forecast, no
  conversion of engine spend into meetings or bookings, no attribution
  model, no CRM sync of predicted numbers. The gap between the two
  calculators is deliberate and documented in
  [docs/MODEL_CARD.md](docs/MODEL_CARD.md).
- **Runtime dependencies.** Zero is the number. The calculators run on
  bare Node with no install step, and that property is tested. This
  includes helper libraries, YAML parsers, and test frameworks.
- **Telemetry, analytics, or any network call from the calculators.**
- **Refactors with no behavior change.** Style rewrites, module system
  changes, and reorganizations cost review time and risk the pinned
  fixtures for nothing.

## Opening the pull request

Fill in the checklist in the pull request template. Say what changed,
what moved in the fixtures if anything, which claim IDs back any new
number, and what a reviewer should look at first. Confirm that no
confidential company data appears anywhere in the diff.

Questions before you build something large: andrew@wesbecher.llc.
