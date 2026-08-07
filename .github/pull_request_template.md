## What changed

<!-- Behavior, not code. What does the model, the runner, or the
documentation do after this that it did not do before? -->

## Why

<!-- The defect, the source correction, or the decision behind it. Link
the issue if there is one. -->

## What a reviewer should look at first

<!-- One or two files, or one number. -->

---

## Checklist

**Tests**

- [ ] `npm test` passes locally. All five suites: test-engine,
      test-mix, test-params, test-docs, test-packaging.
- [ ] Assertion count before and after:
- [ ] New behavior has a test. A bug fix has a regression test that
      fails on the old code.

**Fixtures**

- [ ] Fixtures unchanged, **or** regenerated deliberately with
      `node engine/gen-fixtures.cjs`.
- [ ] If regenerated: the values that moved and why they moved are
      listed below, and `examples/acme/` was regenerated to match.

<!-- Fixture diff and reason: -->

**Documentation**

- [ ] README, CLAUDE.md, AGENTS.md, the skill references, the playbook
      cards, and docs/MODEL_CARD.md updated where this change makes them
      wrong.
- [ ] CHANGELOG.md entry added under the right version.

**Schema and version impact**

- [ ] Stated below. `model_version`, `mix_version`,
      `params_schema_version`, `output_schema_version`, package version,
      or none.
- [ ] If a version moved, every plugin manifest agrees with
      `package.json`.
- [ ] Breaking changes to the input contract or the JSON shape are
      called out for anyone consuming them.

<!-- Version impact: -->

**Claims and numbers**

- [ ] Every new quantitative claim cites a claim ID in docs/SOURCES.md
      or carries the ANDREW OPERATOR HEURISTIC label.
- [ ] New registry rows carry a resolvable URL, sample size, cohort,
      method, evidence class, and confidence.
- [ ] No invented benchmark numbers.

<!-- Claim IDs cited: -->

**Data hygiene**

- [ ] No real ARR, payroll, customer names, or pipeline data anywhere in
      the diff, including test fixtures and issue links.
- [ ] No API keys, tokens, or credentials, including in example
      commands.

**Writing rules**

- [ ] No em dashes. No en dashes in prose.
- [ ] Active voice, specific nouns, short sentences, operator tone, no
      AI filler.
- [ ] Nothing in this diff describes the model as a forecast or implies
      engine spend converts into meetings or bookings.

**Scope**

- [ ] No new runtime dependencies.
- [ ] No new engines and no expansion into forecasting, attribution, or
      CRM behavior.
