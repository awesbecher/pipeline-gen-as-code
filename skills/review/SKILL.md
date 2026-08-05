---
name: review
description: Score the week against Monday's plan and roll what moved. Use at the end of a work week or when the user says review, Friday numbers, or how did the week go.
---

The Friday move of the nine-engines weekly loop.

1. Read "${CLAUDE_PROJECT_DIR:-.}/plan/monday.md" and ask the user for the Friday numbers it named
   (batch the questions, one line per engine).
2. Append this week's review block to the TOP of
   "${CLAUDE_PROJECT_DIR:-.}/plan/review.md" per the
   template: the table, what moved (two sentences), what changes next
   week (one decision), tripwires checked.
3. If any engine sits at its tripwire, say so plainly and propose the
   move the playbook card prescribes; the user decides.
4. Record any approved override in full (model recommendation,
   approved verdict, budget, rationale, approver, date); overrides
   persist across reruns.
5. If verdict-level assumptions changed (budget, team, ACV), suggest
   rerunning /nine-engines:setup rather than patching the plan quietly.

$ARGUMENTS
