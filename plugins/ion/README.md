# ION

Your account-private journal and purchased Schedule in ChatGPT.

Install using the guide at **https://ion.floot.app/chatgpt**. MCP URL: **https://ion-chatgpt.9khv8m59km.workers.dev/mcp**, authentication **OAuth**. Sign in on ION's consent page, never in chat. The server registers the OAuth client automatically; there is no secret to paste.

Try “Show my ION journal.” To save, choose an existing word and ask ION to keep the exact text. Journal word allowances still double with each layer. Schedule retains its Time purchase gate. This plugin can read/add words only; it cannot delete entries, spend Time or access other accounts.

Package: Agent Plugins 1.0.0 `plugin.json`, `mcp.json`, and `skills/ion/SKILL.md`. OAuth is discovered via the HTTPS server's standard metadata and challenges. No credentials are included. Detailed deployment and installation notes are in `docs/integrations/chatgpt.md` in the source repository.
