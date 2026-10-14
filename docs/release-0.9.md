# HEXARS 0.9.0 — prepared, not yet published

The current public release is 0.8.1 at https://hexars.floot.app. Floot rejected further project writes on 2026-10-14 at 04:21 UTC because the account had used its daily 100 build actions. Its stated reset is 2026-10-14 at 05:00 UTC. Only the new `game_POST.schema.ts` reached the editable draft; no partial release was published.

## Implemented

- Selecting the same piece a second time clears its selection and legal destinations; mouse, touch and keyboard use the same action.
- Piece translation uses a 480ms glide. Pass-and-play rotation begins after that translation and takes 560ms; input waits until orientation settles. Reduced motion skips animation and delay. Starting a new game remounts piece identity, so a new position is not animated as a move from the previous game.
- The homepage places the existing HEXARS logo beside its wordmark and shows three native-authoritative starting boards, with aligned titles.
- Shafran has its native 70-cell board, 36-piece setup, oblique notation, move legality, checks, pins, first advances of up to three cells, both crossed en-passant cells, short/long castling on each flank, promotion, results and Tactical search. The same minimal game page and menu apply. No extra suggested features have been added.

## Validation

Four CMake/CTest targets passed. Native checks include 2,479 random Shafran plies over eight completed games and two completed engine games, every castle, en-passant expiry, pins, malformed rights, mate and stalemate. Twenty-two protocol/manager tests and six frontend tests passed. TypeScript and the Vite production build passed.

Local browser checks: 31 focused variant/motion/branding checks plus 44 regression checks passed, through an ephemeral API adapter that uses the real native C++ process. They cover intermediate piece positions, move-before-flip timing, tap-again deselection across variants, actual Shafran castling and en passant from the starting position, undo of both castled pieces, both human sides against Tactical, reduced motion, saved links, install-offer retention, historical Gliński checkmate, McCooey pawn restrictions and 320/390/768px layouts. No runtime errors or failed requests were seen. This is local verification, not a cloud-release claim.

Four snapshots from the previous production 0.6 executable (initial and moved positions for Gliński and McCooey) round-tripped through 0.7 without changing their state IDs or history.

The static Linux x64 Tactical 0.7 executable was uploaded successfully before the limit refusal:

- Path: `/_cdn/static/38e1b6ba-5580-44df-a511-13ecea7e79fe-tactical-0.7-linux-x64.bin`
- Size: 2,156,216 bytes
- SHA256: `dca41e6c28a444256116a8945867c1c5fb01a214bc2334e484aadda635813010`

## Resume publication

After the reset, upload the pending project files from `cloud/floot/` using Floot's tools. Re-read project versions first; `expected_version` is project-wide and changes after each write. The helper, endpoint, component and page changes form one release; typecheck and create one checkpoint after all writes succeed. The native asset already exists, so it need not be re-uploaded.

Pending files:

1. `helpers/useBoardFacing.tsx`
2. `helpers/runNativeEngine.tsx`
3. `endpoints/variants_GET.ts`
4. `components/CloudBoard.module.css`
5. `components/CloudBoard.tsx`
6. `components/Play.module.css`
7. `components/Play.tsx`
8. `pages/_index.module.css`
9. `pages/_index.tsx`
10. `pages/shafran.tsx`
11. `pages/shafran.pageLayout.tsx`

Verify the sandbox endpoint returns three previews with 91,91,70 cells, test new/loaded/moved Shafran games, and check old saved positions. Publish to the existing `hexars` subdomain with `mobile:false`. Run production browser checks and update `cloud/hosting.json`, README and this release note to report the resulting live version. The user has already authorized these changes and publication.
