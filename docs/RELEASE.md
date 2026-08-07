# Release record

## 0.3.2 (prepared, not published)

Branch: `claude/v0.3.2-trust-pass`. Nothing is pushed, tagged, released
or announced. This section is the checklist for the owner.

What it fixes: the parameter parser now fails closed at the edges it
claimed to cover, the leadership rule matches the rule as written, every
output states the logic and inputs that produced it, and the board memo
declares demand coverage and cash runway as not modeled. Setup routes
that a fresh clone could not follow now work. Full detail in
CHANGELOG.md.

Verification on this branch:

    npm test                       # 281 assertions across five suites
    claude plugin validate .
    python3 validate_plugin.py .   # OpenAI's official Codex validator

### Waiting on the owner

1. Review and merge, then tag v0.3.2 and cut the release.
2. The live page at wesbecher.llc/pipeline still describes the older
   product: one forecast, engines 02 through 10, the old repo name, and
   benchmark figures this repo has since corrected. Until it is
   updated, do not send promotion traffic there. The repo-side
   mitigation is in place; the site spec is in the project handoff.
3. Protect `main`: require pull requests and the test, install-paths
   and manifests checks; block force pushes and branch deletion. Delete
   the merged branches `claude/s-tier-release-hardening`,
   `claude/v0.3.1-board-truth-hotfix`, `scaffold` and `week-two`.
4. Enable secret scanning and push protection if the account supports
   them.
5. Bump the `--ref v0.3.1` pin in the README Codex install to v0.3.2
   once the tag exists.
6. Plugin directory re-check; the 0.3.0 submission is still in review.
7. Design-partner phase: five to ten CEO and VC readers before any
   broad announcement. Publish one anonymized case before claiming the
   product changed a real plan.

## 0.3.1 (2026-08-05)

Merged to main at f9eccbe (PR #4). Tag v0.3.1 points at fc925ae, the
last commit of the release, two documentation commits after the merge.
CI green across the Node 18, 20 and 22 Ubuntu legs and the Node 18 and
22 macOS legs, which were the maintained lines at the time.

What it fixes: the board memo can no longer report that a plan clears
while its support layer is over capacity, scenarios can no longer hide a
staffing or payroll change, captured JSON can no longer truncate, the
engines can no longer be reinterpreted as ES modules inside a plugin
cache, and every leadership seat the plan assumes is priced. Full detail
in CHANGELOG.md.

Verification on the released commit:

    npm test                       # 276 assertions across five suites
    claude plugin validate .
    python3 validate_plugin.py .   # OpenAI's official Codex validator

Both official validators pass. CI runs them, plus Node 18, 20, and 22 on
Ubuntu and Node 18 and 22 on macOS.

### Waiting on the owner

1. Re-check the plugin directory listing. The 0.3.0 submission is under
   review; if it publishes against the old manifest, resubmit at
   platform.claude.com/plugins/submit.
2. Codex: the manifest now passes the official validator, but a clean
   end-to-end install through the Codex CLI has not been run on the
   owner's machine. The README stays clone-first until it has.
3. Design-partner phase: five to ten CEO and VC readers pressure-test the
   board memo and the override flow before any broad announcement.

### Known deviation from the brief

The captured-JSON acceptance criterion named 8,350 bytes, the 0.3.0
fixture size. Output schema v3 adds per-layer staffing status and the two
scenario tables, so the example JSON is now 14,108 bytes. The test
asserts byte-for-byte equality with the committed fixture and a clean
parse on both capture APIs, which is the property that matters; the
pinned byte count moved deliberately and is recorded in
engine/fixtures.json.

## 0.3.0 (2026-08-05)

Released. Tag v0.3.0 at commit 7f30331, published from main.

Applied at release: the About description, the nine topics, the social
preview card, Wikis and Projects disabled, and a plugin-directory
submission under the current repository URL with andrew@wesbecher.llc as
the contact. The design-partner phase and Codex CLI validation were
deferred by owner decision; 0.3.1 closes the Codex manifest half.

Release-hardening scope: fail-closed inputs, named and pinned fixtures,
claims narrowed to what the code does, a board memo generator, a sourced
evidence registry, and safe plugin paths. Detail in CHANGELOG.md.

## GitHub settings of record

About description:

    AI-native pipeline planning for startup CEOs and boards: explainable engine choices, budget allocation, sales capacity, and weekly execution. By Andrew Wesbecher.

Topics:

    ai-native, ai-startups, b2b-sales, board-planning, claude-code, gtm, pipeline-generation, revenue-operations, sales-capacity

## Node support

Documented and CI-tested on Node 18, 20, and 22, Ubuntu and macOS. No
runtime dependencies.
