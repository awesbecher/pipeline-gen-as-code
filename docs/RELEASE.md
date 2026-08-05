# Release plan · 0.3.0

Everything in this file is PREPARED, NOT APPLIED. Publication actions
(merge to main, GitHub settings, release creation, directory
resubmission, any announcement) wait for Andrew's explicit approval.

## Sequence

1. Merge claude/s-tier-release-hardening to main after review.
2. Verify CI green on main across the Node matrix.
3. Apply the GitHub settings below.
4. Create the annotated release.
5. Private design-partner phase: five to ten CEO and VC readers
   pressure-test the board memo and override flow before any broad
   announcement (the audit's promotion recommendation).
6. Validate Codex packaging with the Codex CLI before claiming
   plugin-install support anywhere.
7. Check the Anthropic plugin directory submission: it was filed
   under the old repository name; redirects should carry it, but if
   the listing publishes stale, resubmit at
   platform.claude.com/plugins/submit with the current URL.

## GitHub settings (owner applies)

About description:

    AI-native pipeline planning for startup CEOs and boards: explainable engine choices, budget allocation, sales capacity, and weekly execution. By Andrew Wesbecher.

Topics:

    ai-native, ai-startups, b2b-sales, board-planning, claude-code, gtm, pipeline-generation, revenue-operations, sales-capacity

Also: disable the empty Wiki and Projects surfaces; re-upload
assets/social-card.png as the social preview (a committed PNG does
not set it); inspect LinkedIn and X card crops on mobile before any
announcement.

## Release commands (run after merge approval)

    git tag -a v0.3.0 -m "0.3.0: release hardening. Inputs fail closed, fixtures pinned and named, claims narrowed to what the code does, board memo generator, sourced evidence registry, safe plugin paths."
    git push origin v0.3.0
    gh release create v0.3.0 --title "0.3.0" --notes-file CHANGELOG.md

## Node support

Documented and CI-tested on Node 18, 20, 22. No runtime dependencies.

## Open items that need Andrew

- Confirm andrew@wesbecher.llc is live before it ships in manifests
  and PRIVACY.md (currently assumed; swap back to Gmail if not).
- Decide the design-partner list for the private alpha.
- Approve the Codex support claim once the Codex CLI validates the
  manifests, or keep the clone-only wording.
