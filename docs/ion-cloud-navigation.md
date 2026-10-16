# ION cloud navigation

Live: https://hexars.floot.app. Floot is the active host; provider migration is paused.

The root begins with the Hexagonal Chess image. Open it for Engines, Rules and
Boards. Engines contains Tactical. Rules covers Gliński and McCooey. Boards opens
the last-used available variant in pass-and-play; its menu changes the variant
or opponent. Existing engine games and friendly games have separate saved slots.

Add one word, phrase or picture with the bottom bar. Each ordinary item opens a
new cloud that can contain its own droplets. All descendants contribute to an
item's size, compared only with siblings in the current space. Zero percent
remains readable; equally populated items have equal sizes. Pictures follow the
same proportional footprint rule. The canvas avoids overlap and grows vertically
when needed. Browser Back and parent links preserve the hierarchy.

Custom content is stored on Floot's server. A random browser capability protects
its workspace; only its SHA-256 hash is stored in the database. Uploaded pictures
go directly to private storage using presigned transfers. The browser holds the
workspace capability, so clearing its storage loses access. Account sync,
workspace sharing, deletion and reparenting are not included in this release.
Chess game links keep their existing sharing behavior.

Source: `cloud/floot` mirrors Floot's virtual items, which run with Floot's seeded
UI kit, router and server modules. The applied database migration is preserved
under `cloud/floot/migrations`. Design and behavior contracts are in
`cloud/floot/static/__dev`.

## Verification

- Floot TypeScript check: clean.
- Six Jasmine spec files pass, including hierarchy and sizing, layout at narrow
  widths, form behavior, IME handling, failed-save retries, stale background reads,
  theme and media-query behavior.
- Native API checks pass for both variants: initial board, two legal moves,
  illegal move rejection, stale-version rejection and undo.
- Workspace API checks pass for idempotency, nesting, stale writes, capability
  isolation, private image transfer/read and invalid image/parent rejection.
- `tests/e2e/cloud-navigation.live.cjs` exercises the actual published app with
  Playwright in an isolated browser workspace. It covers words, grandchildren,
  pictures, reload persistence, offline recovery, chess destinations, selection,
  a legal move, automatic flip, variant switching and reduced motion.
- Phone, tablet and desktop layout screenshots and actual check results are in
  `docs/screenshots/ion-*`. Final centered-layout checks cover 320–1280 px.
- DESIGN.md lint: zero errors and zero warnings. `git diff --check` passes.

The live browser test requires Playwright and Chromium. Set
`PLAYWRIGHT_CHROMIUM_EXECUTABLE` when using an installed browser, and optionally
`ION_TEST_ORIGIN` to test another Floot address. It writes only to a new isolated
anonymous workspace. Real iPhone keyboard behavior still benefits from testing
on hardware; the implementation follows VisualViewport and safe-area insets.
