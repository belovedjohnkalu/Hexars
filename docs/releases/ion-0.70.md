# ION 0.70 — Organic navigation and daily puzzles

## Navigation, accounts and layouts

Toggle Tiled UI now belongs to existing Controls → Settings, preserving its
permanent identity. The account capability list is derived from this device’s
actual saved sign-ins. Old dev edits, parent overrides and deletion metadata
cannot hide a still-remembered account or import another device’s accounts.
Permitted presentation edits remain; Forget still removes the actual capability.

Move and Duplicate begin with the current branch, then nearby branches, while
retaining name/IL search and server permissions. Organic and tiled views share
all content, Controls, media, ILs and game state. Complete words wrap at eight per
line. Organic spacing is slightly wider; descendant-character scaling retains a
readable minimum. Both cloud packing and tiled mosaics target square collections
independent of phone aspect. Skies retain partition-count sizing. Desktop entry
stays at most 680px wide, with visible Back/Forward during typing; focused phone
entry retains the canonical keyboard-aware behavior.

Dark uses richer semantic colors with luminous type, glass-surface glow and
CSS-based entry, reflow, focus and hover transitions. Reduced motion remains
supported. Inter, the light default, complete media frames and flat blue boards
are preserved. No service worker or native build was introduced.

## Purchases

A confirmed purchase opens the chosen cloud immediately. The client projects
only server-confirmed ownership for that navigation, then refreshes Time;
every game/API action still checks authoritative entitlements. Safe internal
return destinations preserve the selected rules, puzzle or game context.
Time → Receipts stores this account’s outgoing purchase records, filtered on
the server. Transfer history, prices, wallet authority, existing receipts’ birth
ILs and the append-only ledger remain intact.

## Daily puzzles

Chess Learn → Puzzles has Gliński, McCooey, Shafran, Brusky, De Vasa and
Wellisch. Checkers Learn → Puzzles has HexDame and Kruzno. Each has 64 composed,
rule-validated positions and rotates daily in the account’s saved time zone,
including daylight-saving boundaries. Questions cycle after 64 days.

The first five chess variants use mate in one; Wellisch uses its actual
three-player king capture and army takeover; HexDame uses promotion in one;
Kruzno uses a win in one. The generator examines every legal alternative and
validates each accepted continuation using the authoritative C++ or checkers
rules. All 512 positions and 897 solutions have a reproducible fingerprint guard
and CI verification. See [generation and verification](../../tests/puzzles/README.md).

The UI reuses native board rendering, complete checkers capture paths and shared
cloud actions. Hint selects a starting piece; Again permits practice without
rewriting first-solve statistics. Account progress is private, persistent,
versioned and idempotent, with private realtime updates across devices. Guests
retain device-local progress. Answer banks remain server-only; opening a daily
question starts no new engine search. Paid variants keep their existing purchase
requirement. No monetary reward, public leaderboard or new priced product is added.

## Verification and delivery

Live at **https://ion.floot.app**, saved with migration 058 and sanitized
[verification evidence](../verification/ion-0.70.json). All 134 helper suites pass,
including explicit hook suites, and hosted TypeScript is clean. Published checks
passed: eight API, nine browser, six live/saved-layout, eight puzzle-board and
four final-build checks. These cover account switching/isolation, both layouts,
desktop focus, purchase handoff and private receipts, every puzzle variant,
multi-capture selection, reload/practice, concurrent retries, stale versions,
entitlements and account-private cross-device updates. Browser-delivered scripts
were inspected for accidental answer-bank inclusion. Physical iPhone keyboard
testing was not performed.

The configured static design audit retains the same 44 reviewed regex findings
as 0.69, with zero unresolved canonical owners and no new finding. It exits 1;
it is not claimed as a clean strict pass. No production load generator was run.
The earlier million-concurrent capacity limitations still apply.

Disposable accounts 168–170 are retired. Their two explicitly labelled synthetic
QA grants and two purchases were individually reversed through append-only
corrections. Both wallets are zero; passwords, device links and temporary dev
authority are removed, sessions expired, own private fixtures cleared, private
puzzle progress removed and test game memberships hidden. Permanent identifiers,
users and ledger history are retained. Five real accounts remain signed in.

The observed agent implementation interval closed once at
2026-10-27T14:18:20Z, after 4,275 seconds. This is elapsed agent work, not
independently verified human labour. Later release bookkeeping is excluded.
Shared Home version 387 and Chess version 95 refreshed through their ordinary
realtime channels; no administrative refresh remains queued.
