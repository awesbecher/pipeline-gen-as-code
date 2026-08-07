# Security policy

## Reporting a vulnerability

Report privately to **andrew@wesbecher.llc**. Do not open a public
issue, a public pull request, or a public discussion for a security
problem.

Include what you have:

- What the issue is and where it lives (file and line if you have them).
- How to reproduce it. A params file with the confidential numbers
  replaced by realistic dummy values is ideal.
- What an attacker gets: read access, write access, code execution, a
  leaked secret, corrupted output that a reader would trust.
- Your Node version, operating system, and install mode (clone, Claude
  plugin, Codex plugin, portable skill).

Do not include real ARR, payroll, customer names, or pipeline data in a
report. Redact it first.

## Acknowledgment target

The goal is to acknowledge a report within 5 business days. That is a
goal, not a guarantee. This is a single-maintainer project with no
on-call rotation and no security team, and the maintainer travels. If
you have not heard back after 5 business days, send a follow-up to the
same address.

There is no bug bounty and no paid disclosure program. Credit in the
CHANGELOG is offered for any valid report unless you prefer not to be
named.

## In scope

- **The calculators.** `engine/engine.cjs`, `engine/mix.cjs`,
  `engine/run.cjs`, and the fixture generator. This includes anything
  that lets crafted input execute code, read files outside the project,
  write outside the intended paths, or produce output that silently
  misstates a number a reader would act on.
- **The parameter parser.** `engine/params.cjs` and the strict YAML
  subset it accepts. Parser issues that fail open instead of failing
  closed are in scope, and so is any input that bypasses validation and
  reaches a calculator.
- **The command line entry points.** `bin/nine-engines` and its root
  resolution, including path handling and any way an installed plugin
  reads or writes the wrong project's files.
- **Connector setup documentation.** `docs/CONNECTORS.md`. A documented
  command that writes an API key into shell history, into a stored MCP
  config, or into process arguments is a real finding, and one such
  defect has already been fixed this way.
- **Anything touching secrets or company data handling.** The gitignore
  rules that keep parameters and plans out of git, the Markdown escaping
  of identity fields in generated output, the privacy guidance in
  `docs/PRIVACY.md`, and the plugin and skill packaging that decides
  which files an installed agent can reach.
- **The CI workflow and the plugin manifests**, where a supply-chain or
  permission problem would live.

## Out of scope

- **The AI assistants.** Claude Code, Cowork, Codex, ChatGPT desktop, or
  any other agent that runs these skills. They have their own security
  programs and their own reporting channels. Report to the provider.
- **Third-party MCP connectors.** Clay, Apollo, Attio, HubSpot, Stripe,
  and the community servers for Instantly and HeyReach are separate
  vendors with separate code and separate disclosure programs. A
  vulnerability in one of those servers goes to that vendor. A
  vulnerability in how this repository tells you to configure one comes
  here.
- **Model quality disagreements.** A constant you think is wrong, a
  threshold you would set differently, or a verdict you disagree with is
  not a security issue. Open a model change issue.
- **Vulnerabilities in Node itself**, or in an operating system, editor,
  or terminal.
- **Findings from automated scanners with no demonstrated impact on this
  code.** The calculators have zero runtime dependencies, so dependency
  advisories rarely apply here.

## A reminder about your own data

`company/params.yaml`, `company/params.yml`, `company/params.json`,
`company/*.local.yaml`, `company/*.local.json`, and everything under
`plan/` hold confidential business data: ARR, payroll, hiring plans,
customer and pipeline detail. All of them are gitignored by default so a
public fork cannot leak a real company's numbers.

If you deliberately remove those ignore lines, move the repository to a
private one first, or use protected storage. Check `git status` before
your first commit on a fork, and check any file you attach to an issue
or a pull request. Redact before you share.

The calculators run locally and send nothing anywhere. The assistant you
run them through does not. Read [docs/PRIVACY.md](docs/PRIVACY.md)
before you enter real numbers.
