---
name: monday
description: Write this week's pipeline plan from the current PLAN.md. Use at the start of a work week or when the user says monday, weekly plan, or this week's pipeline touches.
---

The Monday move of the nine-engines weekly loop.

1. Read `plan/PLAN.md` in the project root (the user's project, never
   the plugin cache); stop and suggest /nine-engines:setup if missing.
2. Read `plan/review.md` if present; last
   week's verdicts and any approved overrides roll forward.
3. Write `plan/monday.md` per the template in `<root>/skills/nine-engines/`
   references/plan-template.md: two to four concrete touches per running
   engine, one Friday number each, and the waiting-on list.
4. Anything that involves an external send gets drafted for approval,
   never sent. A human approves every external send, in every engine,
   always.

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
