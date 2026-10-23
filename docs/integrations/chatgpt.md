# ION ChatGPT plugin

ION has a hosted, OAuth-protected Streamable HTTP MCP server. It can read words in the connected account's Journal and purchased Schedule, and save the words the user asks it to keep. Existing account privacy, word budgets, capacity, version checks, permanent dev identifiers and realtime updates apply. It does not purchase features, spend Time, delete words, read another account or expose dev prompts.

## Install in ChatGPT

Connection guide: https://ion.floot.app/chatgpt

1. Open https://chatgpt.com/plugins. Under the plus menu, choose **Add custom MCP server**.
2. Name: **ION**. Server URL: **https://ion-chatgpt.9khv8m59km.workers.dev/mcp**. Authentication: **OAuth**. The server supports Dynamic Client Registration; there is no client secret to paste or share.
3. Choose **Create as a plugin**, install your personal plugin, and connect the intended ION account on ION's consent page.
4. In ChatGPT Work, select **@ION**. Try “Show the words in my ION journal.” To save, select a destination and ask it to keep the exact words.

Custom plugin availability depends on the ChatGPT account/workspace. Creating an MCP server does not install it into someone else's account or approve it for the public plugin directory. A public directory submission/review is a separate step. No such approval is claimed.

The consent page signs in through the existing ION password endpoint. Normal ION sign-in still opens Home; no global login redirect behavior changed. Connecting grants read and add permissions for this account only. Reading in a chat sends that requested content to ChatGPT. Disconnect at https://ion.floot.app/chatgpt; this revokes all plugin tokens for that ION account, leaving its data intact.

## Portable package

`plugins/ion/` contains schema-validated Agent Plugins 1.0.0 manifests and an ION skill. `.agents/plugins/marketplace.json` indexes it for Codex. From the repository, add the local marketplace with `codex plugin marketplace add ./`, then select ION in the ChatGPT desktop app’s Plugins Directory. OAuth discovery is authoritative. The published 1.0.0 MCP schema does not allow per-server `extensions`, although the OpenAI guide documents that newer extension shape, so the portable file contains only the schema-valid transport and URL. No credentials are packaged. A custom ChatGPT MCP connection uses the URL above directly.

## Hosting

- Website, authentication and authoritative Postgres: existing Floot project, https://ion.floot.app.
- Dedicated Cloudflare Worker `ion-chatgpt`, account `8abfbb2f5a99af2438b47d61d1750abd`. It serves RFC 8414/9728 discovery and forwards only four fixed POST routes to Floot. No database or secret bindings. Existing `hexars` Worker is untouched.
- Source: `cloud/chatgpt-gateway/worker.mjs`, deploy configuration next to it. Observability/persisted request logs are disabled. No cookies or arbitrary proxy destinations are forwarded. The gateway restores AWS’s remapped WWW-Authenticate header and handles redirects manually, rejecting them rather than following arbitrary destinations.
- Public discovery: `/.well-known/oauth-authorization-server`, `/.well-known/oauth-protected-resource` and `/.well-known/oauth-protected-resource/mcp`.
- Endpoints: `/authorize`, `/register`, `/token`, `/revoke`, `/mcp` on the Worker; ION consent/sign-in UI `/chatgpt-connect`.

## Protocol and authority

Official `@modelcontextprotocol/sdk` 1.32.1, per-request stateless transport, JSON responses, no long-lived SSE or process memory. OAuth is authorization code + mandatory S256 PKCE, exact registered redirects and resource audience, one-use five-minute codes, one-hour opaque access tokens and rotating 30-day refresh tokens. Only hashes of codes/tokens are persisted. No ION session cookies are reused as MCP bearer tokens. Consent requires JSON, an ION origin and the authenticated account session. Tool calls derive the account only from a valid unrevoked token, never an input account/workspace ID. Tool-specific read/write scopes are checked before executing.

`ion_list_words` returns one requested level, at most 50 words per page, current version and the existing word allowance. This is a response page size, not a stored-word cap. `ion_add_word` applies existing scope budgets (1 word at Journal root, doubling with depth), 1,024-child capacity, server authorship and optimistic concurrency. UUID save IDs make retries idempotent; changing an existing retry's content is rejected. Calendar scaffolding remains shared and individual Schedule entries private, even from other dev accounts. Schedule is enforced on the server as `feature:schedule`; devs retain free access. There are no financial tools.

## Verification and limits

Hosted Jasmine specs cover protocol initialize/discovery, account-selector forgery, scope enforcement, OAuth audience/redirect/PKCE, code and refresh replay, cross-origin consent denial, token revocation, account-private workspace selection, word budgets, conflicting saves and idempotency. Node tests cover discovery, fixed routes, method/body limits and stripped headers. Browser tests cover the consent UI, failed/valid auth states, exact consent decision payload, installation guide and Schedule visibility/access states using isolated fixtures. Live tests cover OAuth discovery, DCR, safe authorization redirects, invalid bearer challenge and anonymous Schedule denial.

ChatGPT's own account consent/install screen cannot be completed by repository code or this workspace; the final account installation must be performed in ChatGPT. No real customer journal or Schedule entry is read in verification. No account, Time credit, purchase or price estimate is fabricated.

Primary docs, checked 2026-10-23: https://developers.openai.com/plugins/quickstart, https://developers.openai.com/plugins/build/auth, https://developers.openai.com/plugins/build/mcp-server, https://developers.openai.com/plugins/build/plugins, https://developers.openai.com/plugins/deploy/connect-chatgpt.
