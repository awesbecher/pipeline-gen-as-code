# Privacy

This tool runs entirely on your machine. The engines in this
repository make no network calls, collect no telemetry, and send
nothing anywhere. Your parameters file and generated plans live where
you put them and are gitignored by default so a public fork cannot
leak them.

Treat company/params.yaml and plan/ as confidential business data.
Keep them in a private repository or protected storage if you version
them; do not commit them to a public fork. If you connect optional
MCP tools (docs/CONNECTORS.md), their data handling is governed by
each vendor's own policy, and API keys belong in environment
variables, not command history.

Contact: andrew@wesbecher.llc
