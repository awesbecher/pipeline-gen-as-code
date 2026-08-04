---
description: Interview the company parameters and generate the pipeline plan
---

Run the nine-engines skill end to end (skills/nine-engines/SKILL.md).

1. If company/params.yaml exists, read it back to the user in three
   lines and ask what changed. If not, run the intake interview from
   skills/nine-engines/references/intake.md in its three batches and
   write company/params.yaml.
2. Run `node engine/run.cjs` and show the verdict table. Let the user
   argue; record any overridden verdict with their reason.
3. Generate plan/PLAN.md per skills/nine-engines/references/
   plan-template.md, pulling the operating cards from playbook/.
4. Close by asking for an owner per run_now engine if any are unnamed.

$ARGUMENTS
