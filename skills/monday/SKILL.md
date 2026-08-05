---
name: monday
description: Write this week's pipeline plan from the current PLAN.md. Use at the start of a work week or when the user says monday, weekly plan, or this week's pipeline touches.
---

The Monday move of the nine-engines weekly loop.

1. Read "${CLAUDE_PROJECT_DIR:-.}/plan/PLAN.md" (the user's project,
   never the plugin directory); stop and suggest /nine-engines:setup
   if missing.
2. Read "${CLAUDE_PROJECT_DIR:-.}/plan/review.md" if present; last
   week's verdicts and any approved overrides roll forward.
3. Write "${CLAUDE_PROJECT_DIR:-.}/plan/monday.md" per the template in skills/nine-engines/
   references/plan-template.md: two to four concrete touches per running
   engine, one Friday number each, and the waiting-on list.
4. Anything that involves an external send gets drafted for approval,
   never sent. A human approves every external send, in every engine,
   always.

$ARGUMENTS
