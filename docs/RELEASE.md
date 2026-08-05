# Release record

## 0.3.1 (prepared, not published)

Branch: `claude/v0.3.1-board-truth-hotfix`. Nothing is pushed, tagged,
released, or resubmitted. This section is the checklist for the owner.

What it fixes: the board memo can no longer report that a plan clears
while its support layer is over capacity, scenarios can no longer hide a
staffing or payroll change, captured JSON can no longer truncate, the
engines can no longer be reinterpreted as ES modules inside a plugin
cache, and every leadership seat the plan assumes is priced. Full detail
in CHANGELOG.md.

Verification on this branch:

    npm test                       # 251 assertions across five suites
    claude plugin validate .
    python3 validate_plugin.py .   # OpenAI's official Codex validator

Both official validators pass. CI runs them, plus Node 18, 20, and 22 on
Ubuntu and Node 18 and 22 on macOS.

### Waiting on the owner

1. Review the branch and open the PR. Nothing here is published.
2. Tag v0.3.1 and cut the release once the PR merges.
3. Re-check the plugin directory listing. The 0.3.0 submission is under
   review; if it publishes against the old manifest, resubmit at
   platform.claude.com/plugins/submit.
4. Codex: the manifest now passes the official validator, but a clean
   end-to-end install through the Codex CLI has not been run on the
   owner's machine. The README stays clone-first until it has.
5. Design-partner phase: five to ten CEO and VC readers pressure-test the
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
