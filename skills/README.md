# Skills in this bundle

Four skills, one operating loop. Resolve the bundle root from each
skill file's own location. Company state never goes in a plugin cache.

| Skill | What it does | Claude Code | Codex |
|-------|----------------|-------------|-------|
| `nine-engines/` | Full procedure: intake, verdicts, plan, weekly loop | Read by the commands below | Clone-first via `.agents/skills/nine-engines/`; default prompts below all run this path |
| `setup/` | Interview params, run the calculators, write PLAN.md | `/nine-engines:setup` | "Build my pipeline engine mix and 90-day plan." / "Check my sales capacity against my ARR target." / "Write the board memo for my pipeline plan." |
| `monday/` | This week's touches from PLAN.md | `/nine-engines:monday` | No default prompt; ask for this week's Monday plan. The skill is `skills/monday/SKILL.md`. |
| `review/` | Score the week, persist overrides | `/nine-engines:review` | No default prompt; ask to review the week against monday.md. The skill is `skills/review/SKILL.md`. |

Codex default prompts are the three strings in
`.codex-plugin/plugin.json` (`interface.defaultPrompt`). They are the
setup/plan path. Monday and review are skills the agent follows when
asked; they are not extra default prompts.

Hard gate, every skill that produces numbers: if `engine/run.cjs` or
`bin/nine-engines` is missing relative to the bundle root, STOP. You
have the portable skill only. Clone or install the plugin. Do not
hand-apply verdicts.

A human approves every external send, in every engine, always.
