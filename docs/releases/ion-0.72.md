# ION 0.72 — Frontend

## Light appearance and color

Light is the sole app appearance. The pre-paint bootstrap clears the previous
device dark preference and sets the light canvas and browser chrome before React
loads. The retired Dark Theme cloud is omitted from the app while its stored
record and permanent IL remain intact. Existing user colors and media are not
rewritten.

The ION browser favicon uses the same geometric mark with dark lines on white.
Known original dark-backed Home illustrations receive a light presentation with
their blue accents retained; uploaded and dev-replaced artwork is untouched.
The loading mark and other semantic surfaces use colors legible on the light
canvas. The installed-web-app icon retains its existing PNG.

The horizontal color wheel is below the input during typing or editing. Its
continuous paint palette is contrast-adjusted for light; new words get a varied
default color unless the saved random-color preference is off. A manual color
choice still takes precedence for the current word. Touch color selection keeps
the input focused, and the slider retains keyboard and hold-to-white behavior.
Inter remains the common sans-serif face.

## Hexagonal clouds and Bubbles

Organic clouds grow in compact six-sided axial rings. The first six neighbors
fit around the center's actual footprint, so a large picture does not force
every smaller word into a large empty slot. Collision checks preserve complete
words, pictures, identifiers and hit targets; descendant-based sizing and its
readable minimum remain. Retained items keep their positions during additions;
deletions repack without moving the user's camera. Pan and zoom remain available.

The opt-in tiled layout targets a hexagonal outline while retaining adjoining,
non-overlapping whole rhombi. Decorative tile faces and borders are hidden for
both devs and other accounts; keyboard focus and drop-target cues remain.
Tiled controls use straight corners. Organic and tiled text both wrap after eight
complete words. Board-page action groups also spread across two dimensions
around the board instead of forming a desktop column.

Organic screen partitions are called Bubbles and use soft light rims. On desktop,
Down closes the selected Bubble, including an embedded one, while retaining the
existing media-draft guard. Inactive or stale embedded pages cannot reclaim focus
after another Bubble is selected. Tile/Bubble content, per-pane history, dev
authority and game positions remain separate from presentation.

## Verification and delivery

Live at **https://ion.floot.app**. All 138 hosted helper suites passed and hosted
TypeScript is clean. Nine final-build browser checks covered phone, landscape and
desktop hexagonal packing; light migration; palette placement and touch focus;
eight-word text; personal-media colors; dev tile presentation; both main and
embedded Bubble closing; and the favicon. A final guest check inspected the
light Home artwork. Six live/saved game-layout checks passed on an earlier 0.72
build, before the final cloud-packing and focus refinements. The native puzzle
guard passed for 512 positions and 897 accepted continuations.

The preview's schema-inspection warning was resolved by deferring the existing
redirect schema until validation; valid and invalid redirect requests retain
their respective authorization and validation responses. DESIGN.md lint passed
with zero errors/warnings. The strict design audit retains 44 previously reviewed
regex findings, with zero unresolved canonical owners and no new finding; it
exits 1 and is not claimed as a clean strict pass. Phone checks used browser
emulation rather than a physical iPhone keyboard.

After publication and live checks, the unchanged Frontend folder moved from
To do → Prompts to Completed. Its 29 original nodes were compared under a
workspace row lock; only the folder parent changed, and all 29 IL records were
verified unchanged. Unrelated Home edits and other pending prompts remained.
Home and Chess refresh queues drained normally.

Disposable accounts 174–175 are retired: sessions and credentials expired,
passwords, device links and the temporary dev grant were removed, private test
clouds cleared, test game memberships hidden and the one private test image
deleted. No QA wallet or Time transaction was created; user identities, ILs and
the append-only ledger remain. The observed agent implementation interval was
2026-10-27T22:47:08Z–23:22:29Z (2,121 seconds); it is elapsed agent work, not
independently verified human labour. Subsequent release bookkeeping is excluded.
