# Changelog

## 0.3.0 (2026-08-05)

Release-hardening pass against the August 2026 S-tier audit. The
public claims and the code now say the same thing.

### The product contract, made true
- Inputs are published in three groups (portfolio drivers, capacity
  drivers, narrative context) in the schema, the runner, the README,
  and every verdict's decision_inputs list. Fields that do not drive
  a verdict no longer imply they do.
- The engine split is labeled a starting allocation hypothesis;
  removed every claim that engine spend lands in the forecast.
- The two capacity fixtures are named and pinned: workbook-schedule
  (parity within a stated $50 tolerance, with the reason) and
  solver-default (exact pins). "Verified to the dollar" is gone.
- README fixture numbers are enforced against engine/fixtures.json by
  test-docs.cjs, so documentation cannot drift.

### Inputs fail closed
- New engine/params.cjs: versioned schema (v1), strict documented
  YAML subset (block lists supported) or JSON, unknown-key rejection,
  typed and bounded fields, integer headcounts, finite-only values,
  normalized booleans, control-character rejection, field-specific
  errors with exit code 2.
- run.cjs: real --help and --version; explicit --example; no implicit
  fallback to sample data; Markdown escaping of identity fields;
  non-finite serialization refused.

### Model behavior
- Current BDR, SE, and leadership counts are real inputs; every
  derivation is disclosed as an assumption in the output.
- Ramping AEs accept real tenure cohorts (team.aes_ramping_tenure_months);
  the default stagger is disclosed.
- BDR capacity prorates by hire month.
- Shortfall is computed as a final invariant.
- The hiring solver's objective is documented and property-tested.
- Constraints apply across every affected engine; a 64-subset sweep
  asserts no funded verdict recommends an excluded channel, and
  no_email plus no_phone now defers manual outbound.
- Allocation is exact: basis points summing to pools, allocated and
  unallocated totals reported, unfunded pools called out.
- JSON output v2: versions, units, warnings, assumptions, decision
  input groups, normalized inputs, target-clearance status.

### Board readiness
- --board generates BOARD.md: the ask, engine bets, cash, hires and
  timing, scenarios (downside, base, upside as stated input deltas),
  assumptions, evidence, decisions required.
- Committed illustrative fixture under examples/acme/ (params, JSON,
  BOARD.md, PLAN.md, monday.md, review.md) including a persisted
  management override.
- docs/SOURCES.md: every benchmark claim indexed with source,
  evidence class, and confidence; unsourced numbers labeled Andrew
  operator heuristics.

### Installation paths
- Skills resolve bundled code via CLAUDE_PLUGIN_ROOT and project
  state via CLAUDE_PROJECT_DIR, with the params path passed
  explicitly; an installed plugin cannot silently use sample data.
- Portable skill bundles the schema example; works standalone.
- Codex manifests rebuilt to the published Codex spec (interface
  object; marketplace source and policy shapes), pending validation
  against the Codex CLI before plugin-install support is claimed.
- CI: read-only permissions, SHA-pinned actions, Node 18/20/22
  matrix, clean-directory install smoke tests, manifest shape checks.

### Docs
- README rebuilt for CEOs and boards: buyer outcome and honest model
  boundary first, board memo and operator proof up front, one product
  category used consistently, fixture labeled as illustrative.
- docs/PRIVACY.md; protected-storage guidance for company state.
- Connector packages pinned; API keys moved out of command arguments.

## 0.2.0 (2026-08-04)

Visual identity and distribution pass: branded README, CI badge,
connectors doc, Codex-named manifests (later found invalid; fixed in
0.3.0), commands migrated to skills, paid-media/ABM interaction fix.

## 0.1.0 (2026-08-04)

Initial scaffold: nine playbook cards, capacity engine port with test
suite, mix engine, runner, plugin and skill packaging.
