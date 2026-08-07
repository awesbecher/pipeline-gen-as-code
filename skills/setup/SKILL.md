---
name: setup
description: Interview the company parameters and generate the pipeline plan. Use when the user wants to set up, rebuild, or rerun their Nine Engines pipeline plan, or when company parameters (budget, team, ACV) have changed.
---

Run the nine-engines skill end to end (skills/nine-engines/SKILL.md).

Paths: resolve the bundle root from this skill file's own location
(`<root>/skills/<name>/SKILL.md`, so the root is two directories up).
No environment variable is required; `CLAUDE_PLUGIN_ROOT`,
`CLAUDE_PROJECT_DIR`, slash commands, and `$ARGUMENTS` are
Claude-specific and may not exist.

Two install modes decide where company state goes. In **clone mode**
the clone is the project root: `company/params.yaml` and `plan/` inside
it are the right destinations. In **plugin mode** the plugin cache is
read-only and holds code only: company state goes in the caller's own
project directory, the one you are working in, never in the cache.
Never run the bundled example as if it were the user's data.

1. If `company/params.yaml` exists in the project root, read it
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
4. Generate `plan/PLAN.md` in the project root per
   skills/nine-engines/references/plan-template.md, pulling operating
   cards from `<root>/playbook/`.
5. Close by asking for an owner per run_now engine if any are unnamed.
