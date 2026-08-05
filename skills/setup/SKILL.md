---
name: setup
description: Interview the company parameters and generate the pipeline plan. Use when the user wants to set up, rebuild, or rerun their Nine Engines pipeline plan, or when company parameters (budget, team, ACV) have changed.
---

Run the nine-engines skill end to end (skills/nine-engines/SKILL.md).

Paths: when running as an installed plugin, bundled code lives under
${CLAUDE_PLUGIN_ROOT} and the user's company state lives in their
project, ${CLAUDE_PROJECT_DIR}. Never write plans into the plugin
directory and never run the bundled example as if it were the user's
data. From a cloned repo both variables are unset; use the repo root.

1. If "${CLAUDE_PROJECT_DIR:-.}/company/params.yaml" exists, read it
   back to the user in three lines and ask what changed. If not, run
   the intake interview from skills/nine-engines/references/intake.md
   in its three batches and write that file.
2. Run, with the params path passed explicitly:
   node "${CLAUDE_PLUGIN_ROOT:-.}/engine/run.cjs" "${CLAUDE_PROJECT_DIR:-.}/company/params.yaml"
   If validation fails, fix the named fields with the user; never
   bypass the errors. Show the verdict table. Let the user argue.
3. Record any overridden verdict in the plan's Approved Overrides
   section with: model recommendation, approved verdict, approved
   budget, rationale, approver, and date. Overrides persist across
   reruns; re-apply them on top of fresh model output and say so.
4. Generate "${CLAUDE_PROJECT_DIR:-.}/plan/PLAN.md" per
   skills/nine-engines/references/plan-template.md, pulling operating
   cards from playbook/ (under ${CLAUDE_PLUGIN_ROOT:-.} when installed).
5. Close by asking for an owner per run_now engine if any are unnamed.

$ARGUMENTS
