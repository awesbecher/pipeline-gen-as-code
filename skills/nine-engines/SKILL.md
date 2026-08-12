---
name: nine-engines
description: Build and run a company-specific pipeline generation plan from the Nine Engines playbook. Use when the user wants a pipeline gen plan, GTM engine mix, outbound program, or weekly pipeline operating cadence, or mentions the Nine Engines. Takes company parameters (stage, ARR, team, product, ICP, ACV, cycle, monthly budget, constraints), returns an engine portfolio with budget split, per-engine 90-day build orders, and the weekly artifacts.
---

# The Nine Engines

In this model, every new-logo first meeting maps to one of nine pipeline
engines: Automated Outbound, Product-Led Growth, Manual Outbound + Cold
Calling, ABM, Community + Partner Led, Paid Media, SEO + AEO, Social
Content, Events. This skill maps a specific company onto that portfolio
and produces a plan an operator can run on Monday.

Source: the playbook at https://www.wesbecher.llc/pipeline by Andrew
Wesbecher. Repo: https://github.com/awesbecher/pipeline-gen-as-code

## The standing rule

A human approves every external send, in every engine, always. Never
send email, LinkedIn messages, or any external communication on the
user's behalf without explicit approval of the specific message. Draft,
queue, and report; the user owns the send button.

## Hard gate: the calculators must be present

Resolve the bundle root from THIS FILE's own location. This skill file
sits at `<root>/skills/nine-engines/SKILL.md`, so the root is two
directories up from the directory holding this file. That rule works
from a clone, a Claude plugin cache, and a Codex plugin cache alike.

Before any verdict, budget split, or capacity number, confirm these
files exist relative to that root:

    <root>/engine/run.cjs
    <root>/bin/nine-engines

If either is missing, STOP. You have the portable skill only: intake,
decision-rule prose, and plan templates. You do not have the tested
calculators. Do not hand-apply verdicts or invent a budget split. The
only exception is clearly labeled illustrative discussion of the rules
in `references/engines.md`, with no numbers presented as this company's
plan.

Tell the user, then point them at one of these install paths:

    git clone https://github.com/awesbecher/pipeline-gen-as-code
    cd pipeline-gen-as-code

    # Claude Code plugin
    /plugin marketplace add awesbecher/pipeline-gen-as-code
    /plugin install nine-engines@wesbecher

    # Codex CLI plugin (verified against Codex CLI 0.147.0-alpha.6.5)
    codex plugin marketplace add awesbecher/pipeline-gen-as-code --ref v0.3.2
    codex plugin add nine-engines@wesbecher

Resume only after `engine/run.cjs` and `bin/nine-engines` are on disk.

## Workflow

### 1. Intake

Look for `company/params.yaml` in the project root (the clone in clone
mode, the caller's own project directory in plugin mode; see the two
install modes below). If it exists, read it and confirm the two or
three parameters
most likely to have changed (ARR target, team, monthly budget). If it
does not exist, run the interview in `references/intake.md`: ask the
questions in batches, offer the stated defaults, then write the answers
to `company/params.yaml` matching `company/params.example.yaml`.

### 2. Verdicts

No environment variable is required: `CLAUDE_PLUGIN_ROOT`,
`CLAUDE_PROJECT_DIR`, slash commands, and `$ARGUMENTS` are
Claude-specific and may not exist. If `CLAUDE_PLUGIN_ROOT` happens to be
set, it points at the same root already resolved above.

Run the wrapper, which locates the runner from its own path:

    <root>/bin/nine-engines <path/to/company/params.yaml>
    # or, equivalently:
    node <root>/engine/run.cjs <path/to/company/params.yaml>
    # add --json for machine-readable, --board for the board memo
    # --example runs the bundled illustrative Acme fixture, on request only

Where company state goes depends on the install mode. There are two,
and they differ.

- **Clone mode.** The clone is the project root. `company/params.yaml`
  and `plan/` inside the clone are the right destinations; write them
  there. Both are gitignored.
- **Plugin mode.** The plugin cache is read-only and holds code only.
  Company state goes in the caller's own project directory, the one you
  are working in, never in the cache. Run the engine out of the cache
  and write output into the project.

Either way, pass the params path explicitly; there is no implicit
fallback to sample data.

Invalid input exits nonzero with field-specific errors; fix the named
fields with the user rather than working around validation. The
contract: portfolio drivers decide verdicts, capacity drivers feed the
staffing model, narrative context drives nothing (run --help for the
exact field groups).

Present the verdict table to the user and let them argue
with it; every threshold is a knob, and an overridden verdict with a
written reason beats a silently obeyed one. Persist every approved
override (model recommendation, approved verdict, approved budget,
rationale, approver, date) in the plan's Approved Overrides section
and in review.md; re-apply standing overrides on top of fresh model
output on every rerun, and say so.

### 3. The plan

Generate `plan/PLAN.md` using `references/plan-template.md` as the
structure. For each engine marked run_now or instrument_now, pull its
operating card: the full cards live in `playbook/` (repo) with
compressed versions in `references/engines.md` (standalone). The plan
carries, per engine: why it is on, the monthly budget, the first 90
days, the owner, the KPI bar, and the tripwire. Close the plan with the
capacity check when the params include the capacity block.

### 4. The weekly loop

On "monday" or at the start of a week: write `plan/monday.md` from the
template (this week's touches per engine, owner, and the one number per
engine that gets inspected Friday). On "review" or at week's end: write
`plan/review.md` scoring last week against its Monday plan, then roll
what moved into next week. Keep history; the files are the memory.

## Rules for everything this skill writes

- No em dashes anywhere, ever. Commas, periods, semicolons, parentheses.
  En dash only as a table placeholder.
- No AI filler (delve, tapestry, landscape, seamless, robust, "not just
  X"). Active voice, specific nouns, operator tone.
- Never invent benchmark numbers. The playbook files carry the
  complete set, each indexed by claim ID in docs/SOURCES.md with
  source, evidence class, and confidence; cite the claim ID when a
  plan quotes a number, and label unsourced values as Andrew operator
  heuristics rather than hiding them behind an industry disclaimer.
- Plans name owners and dates or they are not plans.

## References

- `references/intake.md` · the interview: questions, defaults, and the
  constraint vocabulary
- `references/engines.md` · the nine decision rules and compressed
  operating cards
- `references/plan-template.md` · PLAN.md, monday.md, review.md
  structures, including the Approved Overrides section
- `references/math.md` · running the tested engines and checking the
  numbers
- `references/params.example.yaml` · the full schema, bundled so it
  travels with a copied skill directory
