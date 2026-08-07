---
name: review
description: Score the week against Monday's plan and roll what moved. Use at the end of a work week or when the user says review, Friday numbers, or how did the week go.
---

The Friday move of the nine-engines weekly loop.

1. Read `plan/monday.md` in the project root and ask the user for the Friday numbers it named
   (batch the questions, one line per engine).
2. Append this week's review block to the TOP of
   `plan/review.md` per the
   template: the table, what moved (two sentences), what changes next
   week (one decision), tripwires checked.
3. If any engine sits at its tripwire, say so plainly and propose the
   move the playbook card prescribes; the user decides.
4. Record any approved override in full (model recommendation,
   approved verdict, budget, rationale, approver, date); overrides
   persist across reruns.
5. If verdict-level assumptions changed (budget, team, ACV), suggest
   rerunning /nine-engines:setup rather than patching the plan quietly.

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
