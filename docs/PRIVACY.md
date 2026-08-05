# Privacy

Two different things run when you use this repository, and they have
different privacy properties. Read both.

## The calculators

`engine/` is dependency-free CommonJS Node. It makes no network calls,
collects no telemetry, and sends nothing anywhere. You can read all of
it in an afternoon and run it on a disconnected machine. Your
parameters file and generated plans stay on your disk.

`company/params.yaml`, `company/params.json`, and everything under
`plan/` are gitignored by default so a public fork cannot leak a real
company's numbers. Treat them as confidential business data. If you
want to version them, use a private repository or protected storage and
remove those ignore lines deliberately.

## The assistant and the connectors

The skills in this repository are written to be run by an AI assistant:
Claude Code, Cowork, Codex, or another agent. That assistant is not
covered by the paragraph above. Whatever you paste into it, and
whatever files it reads on your behalf, are processed by that provider
under its own policy, your account tier, and your retention and
training settings. Enterprise and team plans generally carry different
terms from consumer plans. Claude Code's own documentation is explicit
that prompts and model outputs travel over the network to the model:
https://code.claude.com/docs/en/data-usage

The optional MCP connectors in docs/CONNECTORS.md are a third category.
Each one is a separate vendor with its own data handling, and the
community servers are third-party code you should read before trusting
with an API key.

Before you type real ARR, payroll, hiring plans, customer names, or
pipeline data into any of this, confirm you are working in an AI
environment your company has approved for that class of data. If you
are not sure, run the calculators directly from the command line: they
are the part that stays local.

API keys belong in environment variables that the client expands at
launch, not in command history and not baked into a stored MCP config.
docs/CONNECTORS.md shows the exact form for each connector.

Contact: andrew@wesbecher.llc
