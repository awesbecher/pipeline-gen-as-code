# Wiring the execution stack

The engines run on tools, and most of those tools now speak MCP, which
means the same Claude that wrote your plan can read your CRM, check your
campaigns, and build your lists. Connect only what your run_now engines
need; every connector is optional and every play works manually.

The plugin deliberately ships no `.mcp.json`, so installing it never
triggers surprise OAuth prompts or wires third-party servers into your
session. You choose what connects. Add servers with the commands below.

## Verified connections

Endpoints checked 8/2026. Official means the vendor hosts and maintains
the server; community means third-party code you should read before
trusting with an API key.

| Tool | Engines | Status | Connect (Claude Code) |
|------|---------|--------|------------------------|
| Clay | 01, 03, 04 | Official, OAuth | `claude mcp add --transport http clay https://api.clay.com/v3/mcp` |
| Apollo | 01 | Official, OAuth | `claude mcp add --transport http apollo https://mcp.apollo.io/mcp` |
| Attio | CRM for any | Official, OAuth | `claude mcp add --transport http attio https://mcp.attio.com/mcp` |
| HubSpot | CRM for any | Official, OAuth app | Create an MCP auth app at app.hubspot.com/l/mcp-auth-apps, then connect `https://mcp.hubspot.com` |
| Stripe | 02 | Official, OAuth | `claude mcp add --transport http stripe https://mcp.stripe.com/` |
| Instantly | 01, 09 | Community | Remote `https://mcp.instantly.ai/mcp` with your API key (Growth plan or above) |
| HeyReach | 01, 03 | Community | `claude mcp add heyreach -e HEYREACH_API_KEY -- npx heyreach-mcp-server@2.0.5 --api-key="$HEYREACH_API_KEY"` (pinned; key from env, not history) |

On claude.ai and Cowork, use Settings, then Connectors; Clay and Attio
are in the connector directory, and the rest add as custom connectors
with the same URLs. On Codex and other MCP clients, use the same
endpoints in that client's MCP config.

Clay also ships its own agent plugin (MCP server plus CLI) for Claude
Code, Codex, and Cursor; if you live in Clay, that is the deeper
integration. See Clay's docs for `clay login` and `clay mcp`.

## The rest of the stack

Segment, Amplitude, Nooks, Perplexity, Ocean.io, RB2B, Jungler, Ergo,
Luma, Circle, Chili Piper, AirOps, and Warmly appear in the engine
cards where they earn their keep. Check each vendor's docs for current
MCP support before assuming; the plays do not require MCP to run. The
leverage points are the CRM and the send tools, which is what the table
above covers.

## Two rules before you connect anything

A human approves every external send, in every engine, always. A
connector that can send email or LinkedIn messages (Instantly, HeyReach,
Apollo sequences) is for drafting, queueing, and reporting; the send
button stays human.

Use restricted or scoped API keys wherever the vendor offers them,
keep keys in environment variables rather than command history, pin
community packages to exact versions, and give community servers the
least access that still runs the play.
