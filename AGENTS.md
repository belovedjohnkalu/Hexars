# ION repository instructions

For queued development prompts, follow [docs/prompt-workflow.md](docs/prompt-workflow.md). The standing ready filter is a current folder named exactly `Complete` inside the configured inbox; that older structure is now soft-deleted, so do not resurrect it or execute arbitrary stored drafts. Direct requests take precedence: the 0.48 request explicitly authorizes its documented five To do tasks. After verified completion and publication, move the original roots into active Completed (`df45ea97-524e-4c1c-b2f6-2a96529562e3`), preserving permanent identities and descendants.

The live application is under `cloud/floot`, hosted at `https://ion.floot.app`; the Floot-managed Postgres database is authoritative. Preserve server authorization, permanent cloud ILs, owner-only shared editing, append-only Time ledger and existing release workflow. Never treat a label or a client-supplied role as permission authority.
