# Changelog

## 0.3.1 (unreleased, branch claude/v0.3.1-board-truth-hotfix)

Board truth and portability. Two independent test passes, a post-release
audit and an OpenAI install test, found defects that a board reader or an
installed agent would hit before anyone noticed internally. Every one is
fixed with a regression test that fails on the old code.

### The board memo tells the truth
- Staffing reports three verdicts instead of one: AE bookings capacity,
  BDR support capacity, and overall. Overall never reads "clears" while a
  support layer is over capacity. The 0.3.0 example said the plan cleared
  while BDR utilization sat at 118 percent.
- BDR hiring is scheduled against the larger of the AE coverage ratio and
  the meeting volume the bookings plan implies, so the recommended plan
  can source its own meetings. Support that still cannot clear reports the
  exact additional headcount and the month it is needed.
- Scenarios answer the question a board actually asks. The default table
  holds the approved hiring plan fixed and shows the ARR miss: the example
  downside now shows a $1,017,107 gap instead of three near-identical
  outcomes. A second table re-solves the plan and exposes every headcount
  and payroll change it took to hold the target, which was $2,660,000 of
  run-rate payroll the old memo hid.
- Engine spend floors bind on the money the split actually allocates, not
  on the total budget. An engine that qualifies but cannot be funded to
  its own floor defers and says so, and its share returns to the engines
  that clear their bar. At $25K a month the example now funds four engines
  properly instead of nine thinly; it no longer offers to run a $15,000
  sponsorship program on $4,250.
- Every leadership seat the plan assumes is priced. Carried BDR managers
  and SE leads are inputs (team.bdr_managers, team.se_leads); when they
  are not supplied the model hires and prices them instead of assuming
  they exist for free, which had been omitting $565,000 of run-rate OTE.
- no_paid_budget gets its own reason instead of borrowing the
  under-$8K explanation.
- Board prose clamps an already-covered target instead of printing a
  negative net-new requirement.

### It runs where it is installed
- Implementation files are `.cjs` and the plugin root declares
  `"type": "commonjs"`. An ancestor package.json with `"type": "module"`
  had turned the engines into ES modules inside a plugin cache, failing
  with "MIX.recommend is not a function".
- Successful output paths no longer call process.exit after writing.
  stdout was truncating at the 8,192-byte pipe buffer under execFileSync
  and spawnSync on macOS, so captured --json was invalid while a file
  redirect looked fine. CI now runs on macOS and parses captured output
  instead of discarding it.
- Skills resolve the bundle root from their own file location. Nothing
  depends on CLAUDE_PLUGIN_ROOT, CLAUDE_PROJECT_DIR, slash commands, or
  $ARGUMENTS, all of which are Claude-specific. Claude support is
  unchanged.
- New `bin/nine-engines` wrapper resolves its own root and needs no
  environment.
- `.agents/skills/nine-engines/SKILL.md` makes the skill discoverable
  from a fresh clone.
- Codex manifest carries interface.defaultPrompt and passes OpenAI's
  official validator. CI runs both official validators, Claude's and
  Codex's, instead of shape checks.

### Inputs and evidence
- Lists fail closed on null, nested list, map, and empty members. Invalid
  JSON constraints had normalized to an empty list, which could fund a
  channel the caller forbade.
- Inline list parsing is quote-aware: "VP Sales, Americas" survives as
  one value.
- Ramped AEs are exactly fully productive on every ramp profile; the
  enterprise profile had been scoring them at 90 percent.
- ENGINE.compute and the runner reject nonsense at the module boundary
  with named fields instead of returning quiet garbage.
- docs/SOURCES.md rebuilt with direct URLs, sample sizes, cohorts,
  methods, access dates, and evidence classes. Claims that no longer
  survive their sources are corrected in the playbook, not just in the
  registry: dial-to-meeting moves from 2 to 3 percent to the measured
  0.27 percent, visitor match separates company-level from person-level,
  and founder-content engagement drops from 3x to about 1.5x. Claims with
  no resolvable source are labeled operator judgment.
- Conflicting evidence is presented as conflicting: no universal
  AI-referral conversion multiplier is claimed, and the B2B SaaS figure
  is parity.

### Docs and claims
- Lacework proof uses the supported title, first global sales leader.
- The repo is described as built from the operating principles used in
  those roles, not as the system that produced those outcomes.
- Engine scope is stated as a model claim, not a universal one.
- Privacy language separates the local calculators from the assistant and
  connectors that process what you share with them under their own
  policies, with guidance to confirm an approved AI environment first.
- company/params.json and local variants are gitignored alongside the
  YAML.
- The HeyReach setup command is corrected and verified: that server reads
  no environment variable, `claude mcp add -e` needs KEY=value, and single
  quotes keep the secret out of the stored config.
- 251 assertions across five suites, on Node 18, 20, and 22, Ubuntu and
  macOS.

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
