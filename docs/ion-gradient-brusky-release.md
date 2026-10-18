# ION: gradient colors and Brusky foundation

Published on 2026-10-18 at https://ion.floot.app. Web/PWA only; no native app build
was requested or used. The Tactical 0.7.1 cloud asset and all saved game hashes
are unchanged.

## Changes

The eight preset swatches have become a continuous pastel gradient, retaining
the compact horizontal 44px control. The maintained Radix Slider owns pointer,
keyboard, disabled and accessibility behavior. The selected color appears on
the thumb and composer text; no extra on-screen labels, zoom controls or native
scroll containers were introduced.

Public, Private and the configured owner's Hexagonal Chess composer and edit
sheet accept persistent RGB colors. Existing owner/author permissions remain
server enforced. This uses the exact configured Chess owner, not an arbitrary
admin role.

New selections avoid **exact RGB duplicates among visible siblings**. The server
repeats allocation against the versioned workspace, including seed nodes; stale
concurrent additions retry safely. A nearby unused shade is selected when the
requested shade is occupied. Tests allocate 1,024 unique shades from the same
preferred color. Nearby shades can look similar. Existing saved colors,
name-only edits, copied branches and transfers are preserved; different parent
clouds may reuse colors. No existing production words were recolored.

Brusky has an experimental native module containing its 84-cell shape,
conventional a–l/1–8 notation, 38-piece setup, two pawn-forward axes,
starting/promotion cells and both players' castling destinations. It is
intentionally absent from `createGame`, Tactical capabilities and the live
chooser. Pawn movement, castling legality, protocol and frontend gameplay still
need implementation. See [reference notes and next gate](variants/brusky.md).

## Verification

- Floot full typecheck clean; all 15 default Jasmine spec files pass, plus
  explicit cloud/game hook specs. New specs cover safe color values, old names,
  contrast, continuous shades, 1,024 allocations, keyboard/disabled control,
  failed drafts, owner policy, and seed-aware Chess edits.
- `npm run test:native`: all existing geometry/rules/search suites pass,
  including complete random and Tactical games in Gliński, McCooey and Shafran.
  New Brusky foundation: 556 assertions pass, including independent rank/file
  lengths, each side's explicit setup, notation bounds, rotation and refusal
  to expose unfinished gameplay.
- `npm run test:manager`: 23 native protocol/manager tests pass.
- CMake target `brusky-foundation-tests` builds and CTest passes. CMake was
  supplied through `uvx --from cmake`; it was not installed system-wide.
- Published Playwright checks: keyboard gradient selection, 44px control,
  Private color persistence on another login/device, concurrent same-color
  allocation with stale-write retry, Public color edits in real time, actual
  non-owner Chess denial, and responsive 320px/desktop layouts without native
  page scrolling. Owner composer/edit UI used mocked response fixtures rather
  than accessing the real owner's session. No real Chess content was modified.
- Temporary QA user, private workspace and exact Public test node removed.
  Screenshot and check records are in `docs/screenshots/ion-gradient-*`.
- DESIGN.md lint: zero errors/warnings. Premium strict static audit still
  reports the same 20 JSX false positives documented in the Shafran release:
  shared `<Button asChild>` links and `<Form>` providers are case-folded into
  literal HTML tags. Actual `<form>` elements have `noValidate`; navigation
  uses Link destinations. The raw report is retained; no strict pass is claimed.
- Older browser scripts were updated for the slider contract and syntax-checked;
  their historical screenshot/result files are not claimed as fresh runs.
