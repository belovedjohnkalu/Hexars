# HEXARS hosting migration

Target: GitHub stores the source, Cloudflare Pages serves `web/dist`, and Supabase
provides Postgres and Auth. The C++ engine runs in the `api/Dockerfile` Linux image.
`cloud/engine-worker` can host that image with Cloudflare Containers. Containers
require a Workers Paid plan; preparing these files does not purchase a plan or
deploy a container. The image can also run on another Linux container host.

The existing Floot release remains the live application until the new stack is
verified. `cloud/floot` is preserved for rollback and data migration.

## Provider connections

- Cloudflare CLI OAuth is confirmed. Its login is separate from Codex MCP OAuth.
- GitHub and Supabase account connections are confirmed. ION is the selected
  Supabase organization (Free plan); it has no projects yet. The connector’s
  required cost-check tool is unavailable, blocking its project-creation flow.
  Never request or paste secrets in chat.
- Store code in a private `hexars` repository unless an existing repository is
  selected. Publish only after the checks in `.github/workflows/ci.yml` pass.

GitHub CLI access is verified as `belovedjohnkalu`, but creating
`belovedjohnkalu/hexars` was rejected with `Resource not accessible by integration`.
No repository was created and no source was pushed. Create an empty private
`hexars` repository in the GitHub dashboard and make it available to the connected
app. No additional approval for uploading the prepared source is needed.

Supabase successfully lists ION, but `get_cost` returned `UNAVAILABLE` because
the provider did not expose that tool. Its required cost-confirmation step for
creating projects cannot be completed with the current integration. Create the
HEXARS project in ION through the Supabase dashboard, keeping the current Free
organization plan, then continue the prepared migration against that project.

## Supabase

Apply `supabase/migrations/20261014000000_games.sql` to the selected project.
Enable anonymous Auth so playing does not require a sign-in form. Guest creation
happens when opening a game, not on the homepage. Configure anonymous sign-in
rate limits and the provider's abuse protections for public traffic.

Use the project's public URL and publishable key for
`VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in the Pages build.
Use the URL and a secret/service-role key as `SUPABASE_URL` and
`SUPABASE_SECRET_KEY` on the API only. Keep the secret out of Vite and Git.

The API verifies bearer tokens using Supabase `auth.getUser`. Games belong to
the creating user, and RLS permits owners to read their rows. Browser roles have
no mutation grants or policies. A saved-game link deliberately grants access to
that game to another signed-in guest; only a SHA-256 hash of that capability is
stored. C++ validates every human move and engine reply. Atomic version checks
prevent concurrent requests from overwriting each other.

Initial authentication is guest-only. Saved links remain the way to resume on
another device. Permanent account sign-in and an account game list are not yet
part of this migration.

## Engine API

Build from the repository root:

```sh
docker build -f api/Dockerfile -t hexars-api .
```

The image includes Node and a static C++ executable and runs as a non-root user.
Set `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, and a randomly generated
`HEXARS_GATEWAY_SECRET` of at least 32 characters through the hosting secret
store. Do not put their values in source or command-line arguments.

For Cloudflare Containers, use `cf` in `cloud/engine-worker`. The typed
`cloudflare.config.ts` defines the container, Durable Object and secret bindings.
It limits the deployment to one container, which sleeps after two minutes of
inactivity. `cf deploy --dry-run` previews deployment; deploying requires working
provider secrets and a compatible account plan.

## Cloudflare Pages

Build from the repository root with `npm run build:web`; output is `web/dist`.
`web/public/_worker.js` proxies only `/api/game` and `/api/variants` to the fixed
HTTPS `HEXARS_API_ORIGIN`. Set `HEXARS_API_ORIGIN` and the same
`HEXARS_GATEWAY_SECRET` in Pages Functions settings. Static pages/assets bypass
Functions via `_routes.json`. The browser never receives the gateway or Supabase
secret key. Configure Node 24 for the build.

Connect the GitHub repository to Pages and use `main` for production. Confirm
the actual Pages subdomain returned by Cloudflare; never assume a requested
name is available. Test the complete preview before switching the public URL.

The web manifest uses local HEXARS icons and Inter. A network-only service worker
enables installation where the browser offers it. It does not cache game data,
credentials, or promise offline play.

## Local development

```sh
npm ci
npm run build:engine
```

Copy `api/.env.example` to `api/.env` and `web/.env.example` to `web/.env`,
then supply provider values in those local ignored files. Both files use the
same gateway secret. In separate terminals, run `npm run api` and `npm run dev`.
The development proxy supplies the gateway header. The bundled API loads its
own `.env` when started from the API workspace.

## Existing games and cutover

Do not discard Floot rows or change the live site during preparation. Export
`hexchessGames` privately and map fields to the Supabase table without changing
IDs, token hashes, C++ positions, rights, versions, moves or undo timelines.
Legacy rows may have a null owner. Validate each exported native state before
importing it. Freeze writes for the final export, import transactionally, compare
counts and round-trip position hashes, then enable the new origin. Browser
storage is origin-specific: saved game links need their host changed to the
verified new site. Keep the old origin available for rollback.

No export, import, new cloud deployment or public URL change has been performed
by preparing this migration.
