# The Masterclass Pipeline Generation Playbook

Every first meeting a B2B company books comes out of one of nine
engines: Automated Outbound, Product-Led Growth, Manual Outbound + Cold
Calling, ABM, Community + Partner Led, Paid Media, SEO + AEO, Social
Content, Events. Most companies run two or three well, a few badly, and
call the rest "marketing."

This repo is that playbook, runnable. Feed it your company's parameters
(stage, ARR target, team, product shape, ICP, ACV, cycle, monthly cash
for pipeline) and your AI agent builds the plan: which engines to run
now, which to instrument for next year, which to skip and why, how the
budget splits, the first 90 days per engine, and a weekly operating
loop. The math underneath is deterministic and tested; the reasoning is
written down where you can argue with it.

The readable version lives at
[wesbecher.llc/pipeline](https://www.wesbecher.llc/pipeline). This is
the version that works for you.

## Install

**Claude Code (plugin):**

    /plugin marketplace add awesbecher/masterclass-pipeline-gen
    /plugin install nine-engines@wesbecher

Then `/nine-engines:setup` to build your plan, `/nine-engines:monday`
and `/nine-engines:review` for the weekly loop.

**Any agent that reads skills** (Claude Code, Cowork, Codex CLI,
Copilot, Gemini CLI): copy `skills/nine-engines/` into your skills
directory (`.claude/skills/`, `.agents/skills/`, `.github/skills/`, or
`.gemini/skills/`) and ask for a pipeline plan.

**The full brain (recommended):**

    git clone https://github.com/awesbecher/masterclass-pipeline-gen
    cd masterclass-pipeline-gen

Open it in Claude Code, Cowork, or Codex and say "set up my pipeline
plan." `CLAUDE.md` and `AGENTS.md` brief the agent; your parameters live
in `company/params.yaml`, your plan in `plan/`, and the weekly loop
compounds because the files are the memory. Private clone: un-ignore
`plan/` and `company/params.yaml` in `.gitignore` and commit your state.

## What is in here

    skills/nine-engines/   the operating procedure (SKILL.md + references)
    playbook/              the nine engine cards: flows, benchmarks,
                           stacks, 90-day build orders, tripwires
    engine/                the math: portfolio logic (mix.js), sales
                           capacity model (engine.js), CLI (run.cjs),
                           47 tests between them
    company/               params.example.yaml, the intake schema
    commands/              the three plugin commands
    plan/                  where your generated plan lives (gitignored)

No dependencies anywhere; the engines run on bare Node.

    node engine/run.cjs            # verdicts + capacity check
    node engine/test-mix.cjs       # 18 tests
    node engine/test-engine.cjs    # 29 tests

## The rules that travel with it

A human approves every external send, in every engine, always. The
agent drafts, queues, and reports; you own the send button.

Benchmark ranges are directional, drawn from operating experience; the
2026 market data is industry-reported. Validate against your own funnel
before you build a forecast on any of them.

## License

MIT. Fork it, run it, argue with the thresholds; they are knobs on
purpose, commented where they live in `engine/mix.js`.
