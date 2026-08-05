---
name: setup
description: Interview the company parameters and generate the pipeline plan. Use when the user wants to set up, rebuild, or rerun their Nine Engines pipeline plan, or when company parameters (budget, team, ACV) have changed.
---

Run the nine-engines skill end to end (skills/nine-engines/SKILL.md).

Paths: resolve the bundle root from this skill file's own location
(`<root>/skills/<name>/SKILL.md`, so the root is two directories up).
No environment variable is required; `CLAUDE_PLUGIN_ROOT`,
`CLAUDE_PROJECT_DIR`, slash commands, and `$ARGUMENTS` are
Claude-specific and may not exist. The user's company state
(`company/params.yaml`, `plan/`) lives in the directory you are working
in, never in the bundle. Never write plans into the bundle and never run
the bundled example as if it were the user's data. From a cloned repo both variables are unset; use the repo root.

1. If `company/params.yaml` exists in the working directory, read it
   back to the user in three lines and ask what changed. If not, run
   the intake interview from skills/nine-engines/references/intake.md
   in its three batches and write that file.
2. Run, with the params path passed explicitly:
   <root>/bin/nine-engines company/params.yaml
   If validation fails, fix the named fields with the user; never
   bypass the errors. Show the verdict table. Let the user argue.
3. Record any overridden verdict in the plan's Approved Overrides
   section with: model recommendation, approved verdict, approved
   budget, rationale, approver, and date. Overrides persist across
   reruns; re-apply them on top of fresh model output and say so.
4. Generate `plan/PLAN.md` in the working directory per
   skills/nine-engines/references/plan-template.md, pulling operating
   cards from `<root>/playbook/`.
5. Close by asking for an owner per run_now engine if any are unnamed.
