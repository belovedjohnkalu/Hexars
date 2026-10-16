# ION on Vercel Services

Vercel Services is in beta. The application and intended Vercel project are
named ION (`ion` in Vercel). Source is kept in the existing GitHub repository.
The user has approved proceeding with this service layout. Existing `HEXARS_`
environment names and saved-game identifiers are retained for compatibility.
Publishing requires access to the ION Vercel team and the application secrets.

## Services and routes

| Service | Root | Runtime | Public access |
| --- | --- | --- | --- |
| `web` | `web` | Vite static frontend | `/`, game pages and assets |
| `gateway` | `gateway` | Node 24 HTTP proxy | `/api/game`, `/api/variants`; other `/api/*` requests return 404 |
| `api` | `.` | Container built with `Dockerfile.vercel`, Node 24 and the C++ engine | Internal only |

The API build root and Dockerfile are at the repository root because the image copies
`shared`, `engines/engine-1`, and the workspace lockfile. It is intentionally
different from the inferred `api` root. The container listens on port 80 by
default; local standalone Node development continues to use 8080. The existing
Cloudflare container configuration explicitly overrides `PORT` to 8080.

Public `/api/*` traffic enters `gateway`, not the private `api` service. Only
`/api/game` (POST) and `/api/variants` (GET) are forwarded. Unknown API paths
do not fall through to the SPA. The browser uses the same relative URLs on
production, previews, and local development. The API receives the original
`/api/game` and `/api/variants` paths; no prefix stripping is needed.
The web service rewrites only the three game-page paths to `index.html`, so
fonts, icons, scripts, the manifest, and service worker retain their asset routes.

The calling `gateway` service declares one binding to `api`. Vercel injects
`HEXARS_API_URL` into the gateway function at runtime. Do not set this variable
yourself, add it to a `.env` file, use it in Vite configuration, or expose it as
a `VITE_` variable. Static browser code never reads it. The private API still
requires the gateway credential and verifies Supabase JWTs for games; a service
binding supplies reachability, not application authorization.

## Existing Supabase and secrets

Configure these values in the Vercel project's environments before deployment:

| Variable | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` | Public Supabase URL used by the browser at build time |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public publishable key used by the browser |
| `SUPABASE_URL` | Supabase URL used by the private API |
| `SUPABASE_SECRET_KEY` | Secret/service-role key; server only |
| `HEXARS_GATEWAY_SECRET` | Random secret of at least 32 characters shared by the gateway and API |

Use Node 24 for Vercel builds. Run from the repository root, not `web` or `api`.
Keep Vercel's project Root Directory at the repository root. Service-specific
build settings are already in `vercel.json`. No Cloudflare credentials or
`HEXARS_API_ORIGIN` are needed for this target.

The existing Supabase migrations must be applied and anonymous sign-ins enabled
for guest play. Opening the homepage only fetches board previews. Existing Floot
saved games have not been imported; changing hosts does not transfer browser
storage. See [cloud migration](cloud-migration.md) for the data migration plan.

## Verify locally

Install workspace dependencies with `npm ci`. With Docker running, use
`vercel dev` from the repository root so Vercel starts all three services and injects
the binding. `vercel dev -L` selects local-only mode without a cloud project.
Supply the listed application environment variables using your local, ignored
environment file or the linked project's development environment. Do not supply
`HEXARS_API_URL`; Vercel generates it.

Check `/`, direct links `/glinski`, `/mccooey`, `/shafran`, `/api/variants`, and a
new game, legal move, engine reply, undo, and reload. Requests to `/api/health`
must fail and game requests without a valid Supabase session must return 401.
The container's `/health` route is for internal readiness only.

Verified in this workspace with Node 24 and Vercel CLI 64.3.1: frontend/API builds,
gateway and optional Cloudflare host type checks, the native container build,
19 API/proxy tests, six frontend tests, and 15 HTTP checks through `vercel dev -L`.
The HTTP checks include real native board previews, game-page links, fonts,
icons, manifest, service worker, and 401/404/405 handling. Automated game-flow
tests use an in-memory store and the real C++ engine. Live Supabase guest sign-in
and database persistence still require the configured provider credentials.

The approved service layout is public `web`, public `gateway` at `/api/*`, and
private `api`, with the runtime `gateway` → `api` binding.
