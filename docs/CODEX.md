# Codex CLI install

Verified against Codex CLI 0.147.0-alpha.6.5, the version named in the
README. Commands below are the ones that README publishes. A passing
CI validator is not the same as a clean install on your machine.

## Exact commands

From a directory where Codex can see GitHub:

```text
codex plugin marketplace add awesbecher/pipeline-gen-as-code --ref v0.3.2
codex plugin add nine-engines@wesbecher
```

`--ref v0.3.2` pins the marketplace add to the released tag. Adding
`main` tracks whatever landed since the last release.

Clone-first still works, and needs no plugin step:

```bash
git clone https://github.com/awesbecher/pipeline-gen-as-code
cd pipeline-gen-as-code
```

`AGENTS.md` briefs the agent. `.agents/skills/nine-engines/` makes the
skill discoverable from a fresh clone. Then:

```bash
bin/nine-engines --example --board
bin/nine-engines doctor
```

## Plugin cache vs project directory

Two install modes, and mixing them is the usual failure.

**Clone mode.** The clone is the project root. Write
`company/params.yaml` and `plan/` inside the clone. Both are gitignored.

**Plugin mode.** The Codex plugin cache is read-only and holds code
only. Company state goes in the caller's own project directory, the one
you are working in, never in the cache. Run the engine out of the cache
and pass the params path explicitly:

```bash
/path/to/plugin-cache/bin/nine-engines ./company/params.yaml --board > plan/BOARD.md
```

Codex does not set `CLAUDE_PLUGIN_ROOT` or `CLAUDE_PROJECT_DIR`. The
wrapper and the skills resolve the bundle root from their own file
location. Do not depend on those variables.

## Known failure modes

1. **Skill-only copy.** If you copied `skills/` and nothing else,
   `engine/run.cjs` and `bin/nine-engines` are missing. The skill must
   STOP. There are no numbers until you clone or install the plugin.
   Doctor cannot run in that case; it is `engine/run.cjs`. A doctor
   report of `skill-only` is only reachable if `run.cjs` exists but
   `bin/nine-engines` does not.
2. **Writing into the cache.** Params and plans in the plugin cache are
   in the wrong place and can be overwritten on the next plugin update.
3. **Running `--example` as the company.** `--example` is the bundled
   Acme fixture. It is illustrative. Pass your own params path.
4. **No params path.** The runner exits 2 rather than falling back to
   sample data. That is the contract.
5. **Ancestor `package.json` with `"type": "module"`.** The engines are
   `.cjs` so they still load. If you see `MIX.recommend is not a
   function`, you are not running this repository's files.
6. **Validator green, CLI install unproven.** CI runs OpenAI's
   `validate_plugin.py` against a pinned commit of `openai/codex`. That
   checks the manifest shape. A clean `codex plugin add` on the owner's
   machine is still an owner action; see docs/RELEASE.md.

## After install

```bash
bin/nine-engines doctor
cp company/params.example.yaml company/params.yaml
# or, in plugin mode, copy into the project directory, not the cache
bin/nine-engines company/params.yaml --board
```

A human approves every external send, in every engine, always.
