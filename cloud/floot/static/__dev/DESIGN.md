---
version: alpha
name: ION
description: A quiet iPhone-inspired space where words and pictures open into clouds.
colors:
  background: "#fafaf9"
  foreground: "#17191d"
  surface: "#f0f0ee"
  primary: "#22252a"
  muted: "#60656d"
  error: "#b64236"
  wordBlue: "#285989"
  wordCyan: "#17646c"
  wordMint: "#346442"
  wordAmber: "#815c16"
  wordCoral: "#925036"
  wordRose: "#974b74"
  wordLavender: "#694591"
typography:
  sans:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
  mono:
    fontFamily: "ui-monospace, SF Mono, Consolas, monospace"
rounded:
  DEFAULT: "14px"
  sm: "8px"
  md: "24px"
  lg: "32px"
  full: "999px"
spacing:
  base: "1rem"
  small: "0.5rem"
  section: "2rem"
components:
  cloud:
    size: "17px"
    textColor: "{colors.foreground}"
  composer:
    height: "48px"
    textColor: "{colors.muted}"
  cloudBlue:
    size: "17px"
    textColor: "{colors.wordBlue}"
  cloudCyan:
    size: "17px"
    textColor: "{colors.wordCyan}"
  cloudMint:
    size: "17px"
    textColor: "{colors.wordMint}"
  cloudAmber:
    size: "17px"
    textColor: "{colors.wordAmber}"
  cloudCoral:
    size: "17px"
    textColor: "{colors.wordCoral}"
  cloudRose:
    size: "17px"
    textColor: "{colors.wordRose}"
  cloudLavender:
    size: "17px"
    textColor: "{colors.wordLavender}"
---
# ION Design System

## 0.75 — icon-led Home and in-place controls

The Home tiles favor transparent, brushed-silver and blue companion artwork,
with modest labels beneath. Console uses a rounded system face while the rest
of the product keeps Inter. Hub, Console, Reserve and Settings share the same
family of icons; old dark rectangular backplates are removed. A small tiled
Controls dialog opens in place when a cloud is held. Its actions use existing
permissions and editing flows, and the color wheel sits above the composer.

## 0.74 — Tiles only and direct IL navigation

Tiles and their joined rhombus surfaces are the sole presentation on every
device. An old saved Organic preference is ignored and cleared. Controls keeps
its editable Settings cloud, but the obsolete layout toggle is hidden and
cannot switch the app back. Existing tile names, partitions, saved camera
positions, cloud identities and content remain. Default vocabulary is Tiles
and Partitions throughout the live interface.

An IL keeps its birth label when a cloud moves. A database reverse index
tracks its current workspace, so opening an IL loads only that authorized
scope instead of searching every cloud scope. Personal location rows are
matched to the server session, and the ordinary cloud response remains the
final authority for hidden, removed and purchased content.

## 0.73 — desktop Bubbles and distinct quick-entry paint

On desktop, Right opens a Bubble directly beside the focused screen and Left
closes the focused extra Bubble. The same close guard protects unsaved media;
Alt+Left and Alt+Right retain page history. Text entry and interactive controls
keep their arrow keys. A new cloud's first droplet receives random paint when
the saved random-color setting is on. Recent automatic colors are separated
around the existing readable spectrum, including rapid successive sends;
manual paint choices and failed drafts remain stable.

## 0.72 — light canvas and hexagonal clouds

This section supersedes the earlier square-packing and dark-theme directions.
Light is the sole appearance: the pre-paint bootstrap clears saved dark choices,
sets light browser chrome, and never changes user content or stored colors.
The retired dark-theme cloud keeps its permanent identity but is omitted from
the rendered service. The default ION favicon is the original mark inverted to
dark lines on white. Only the original dark-backed Home illustrations receive a
light presentation; uploaded or dev-replaced pictures keep their colors.

Organic words and pictures grow in compact six-sided axial rings, retaining a
readable descendant-based size floor, complete words, collision-safe hitboxes,
pan/zoom and stable positions during additions. Tiles use the same hexagonal
target for their adjoining whole rhombi, with no decorative fill or border for
devs or other accounts. Eight-word lines apply to both modes. Tiled controls use
straight edges; organic partitions are called Bubbles and have soft light rims.
The focused Bubble alone closes on the desktop down arrow, subject to the
existing unsaved-media guard. Existing IDs, histories and edit authority remain.

The horizontal paint palette sits beneath the input while typing or editing.
Colors use the contrast-checked light spectrum, with a different default color
for each new word; the existing random-color setting and manual override remain.
Inter remains the common sans-serif face. Keep keyboard focus, touch capture,
media previews, reduced motion and small-viewport editing intact.

## 0.69 — Chess as a quiet, social hub

The existing Chess cloud keeps its identity and dev-defined placement. Play, Learn, Community and Library are the core journeys; Continue appears only for the current account's unfinished game. Organic packing, descendant-character sizing, the visible minimum, light default, saved dark first paint and opt-in Tiled UI remain canonical. No marketing dashboard, extra global account button or new brand is introduced. Learn adds an editable first-game guide and a daily link to an existing Gliński lesson. Its day boundary follows the device's local calendar without a server poll; custom dev redirects and names win.

Community uses CloudCanvas for bounded topic/reply previews and PagedText for complete reading. A preview can be brief; the complete post always remains available. Native kit Dialog, Button, Input, Textarea, Switch and PageControls own forms, actions, reading, settings and moderation. Posting preserves an account-scoped draft on failure and never claims success before the server commits. The discussion composer warns that posts are public. Author names never expose a legacy email-shaped display name. New labels, category clouds and guides are editable through existing registered-dev Controls; Manage adds posting pace, pause, capacity limits, reporting and measured return usage.

Motion is brief opacity/position feedback, disabled for reduced motion. Mobile content stays within the visual viewport; regular content has no document scroll. Discussion forms own their text-entry overflow. Boards remain flat and use the existing native cell targets and move indicators. Live connections are shared by mounted features within each document, separately for each signed-in identity. Layout and theme choices do not restart a match or mutate its position.

Community opens as a compact two-dimensional cloud, with the same descendant-only visible sizing floor. Long discussion headings use the existing paged reader; small landscape screens open replies separately. Shared read-model caching, account-scoped drafts/resume, topic-only live updates and sharded room totals keep product motion separate from background accounting. Light remains the default, with the explicit saved dark preference honored from first paint.

## 0.68 — organic by default, optional Tiled UI and Skies

Organic upright words and pictures are the default again. Accounts contains the functional cloud “Toggle Tiled UI,” using the same persistent per-device preference pattern as appearance. Its pressed state and existing on/off colors communicate the choice. The opt-in tiled mode preserves the complete adjoining rhombus composition, contained affine printing, dev-only planes, descendant-based scale and visible minimum. Both modes retain Inter, actual light/dark tokens, media colors, native board geometry and the pre-paint theme bootstrap.

CloudCanvas owns the mode switch through the existing cloudLayout owner. Organic mode uses its non-overlapping spiral composition and common descendant-character print ratios with the protected readable minimum; own names reserve geometry only. The whole-word wrapping, picture frames, focus/hold behavior and no document scrolling remain. Mode-specific camera keys retain separate views without rewriting visit history or remounting live games. Layout changes synchronize through the same-origin device preference; blocked storage retains the choice in memory for that document.

The overview is Skies in organic mode and Tiles in tiled mode. An unnamed view is Sky N or Tile N; a custom name stays the same. Skies size their labels by the number of screens they hold, with an accessible screen count. The tiled presentation calls these partitions. Tiled views retain their authorized content-based weights. One existing view tree, screen identities, drafts, game sessions and Back/Forward histories serve both presentations. Creating, holding, renaming, selecting, closing and moving views retain their existing authorities and unsaved-media guards. Mode vocabulary reaches headings, title menus, rename sheets and frame labels; permanent cloud ILs and dev-edited labels are preserved.

Live and saved variant pages follow the same preference. Organic actions are upright words around the flat board; Tiled UI fits complete labels and ILs through the same measured whole-cell layout as other clouds, retaining exact adjoining faces around the board. Online chats use the selected presentation, with no added droplets or new online actions. A layout switch preserves the board position, selected game, side, review state and native legal move authority.

## 0.67 — a visible minimum

The latest visibility requirement qualifies 0.66's exact scale at the small end. Clamp the shared printed scale to one half of the largest sibling: the 68px type base has a 34px world minimum, and the 144px picture base has a 72px world minimum. Relative descendant-character proportions remain exact above that floor, including fractional multipliers; tiny positive totals and empty leaves remain discoverable. Names still reserve geometry without determining their own font size. Pictures, captions, ILs and occupied faces retain the same shared print transform and adjoining composition.

CloudCanvas and Tiles choose their initial camera from both content bounds and a 14px minimum for the smallest printed type. When all content cannot fit at that readable size, preserve pan/zoom rather than shrinking every label away. Deliberate zooming out remains possible. A changed readability threshold can refit an untouched camera; user-adjusted cameras and visit histories remain owned by the existing viewport. Version the camera namespace so a previously microscopic view is not restored into this new layout. Dark first paint, fonts, colors, authorization, boards and stored content are unchanged.

## 0.66 — exact text and picture proportions, dark first paint

Preserve the adjoining, independently fitted composition of 0.65. Positive descendant-character totals now determine exact relative printed scale: twice the characters gives twice the font size and twice the picture width/height; fractional ratios remain fractional. Normalize all visible siblings by their common largest weight. The shared 68px type and 144px picture bases are transformed together with captions, ILs, gaps and status, with no individual min/max interpolation, integer rounding, name-based sizing or per-ID picture jitter. Own names reserve geometry only; all authorized descendant depths contribute. Empty clouds use the smallest positive sibling's scale, or equal scale when all are empty, so they remain present without defining a ratio to zero. Whole-cell footprints retain their separate integer topology and exact shared edges; geometric fitting never rounds the printed ratio.

CloudCanvas and PageTiles use the same proportional layout owner. Camera zoom expands to match the smallest relative scale; keyboard focus can zoom a small printed group to readable type while retaining all relative ratios. Other viewers keep their existing zoom limits. Avoid forcing a pre-rasterized world layer: deep zoom must repaint tiny printed groups instead of reusing a blank low-resolution layer. Existing pane histories, permissions, stored names, fonts, colors, no-scroll navigation and board rendering remain.

Restore the explicit saved theme in the published document head before app scripts and styles. The trusted appearance bootstrap paints the root background and color-scheme and updates browser chrome synchronously; it uses the same preference key and palette as AppearanceSync. React hydration retains that choice, and later theme changes update the inline root paint too. Light remains the default when no preference exists or storage is unavailable. This does not enable SSR, add a service worker, request a theme from the network or invert media.

## 0.65 — adjoining content, single-tap refresh

The current density requirement supersedes the common pixel size for every logical tile in 0.64. Fit each cloud's visible words, multimedia, IL and status independently, then pack those occupied groups edge to edge. Long sentences begin as wide rows of complete rhombi; pictures can use portrait groups. Descendant characters still determine type size and the logical whole-cell weight. Physical whole cells also reserve the measured text/media footprint; an existing logical cell is never split. Cell scale adapts to the occupied content, so neither a long neighbor nor a huge descendant count creates an empty square around every other cloud. Eight-word rows (sixteen across two logical cells) and unchanged stored text remain. Padding is a small measured inset, not a decorative margin. Small collections open with the complete occupied tile assembly inside the viewport; long labels and the final tile corners do not begin cropped at the screen edges. The same composition serves ordinary cloud pages and the open Tiles overview. The palette, Inter, flat playable boards and dev-only outlines are unchanged.

A single activation of the page title refreshes that page through the existing view-refresh and unsaved-media guards. Pointer, touch and keyboard share the same action. Holds retain screen options and View cloud; swipes and cancelled gestures cannot trigger refresh. The tile name above the page title keeps its separate overview, rename and hold behavior.

## 0.64 — whole tiles and independent journeys

This section supersedes the 0.63 subdivisions and invisible whole-face hit targets. A cloud starts with one complete 60°/120° rhombus. Descendant-character weight, divided by the smallest positive sibling weight and rounded down, determines its integer cell count. Twice the weight joins two full cells; three times joins three, never four. Growth retains every earlier cell and never splits one. Empty decorative faces are absent. A named cloud with no droplets remains one cell; a genuinely blank placeholder is omitted. Labels and multimedia occupy a safe rectangle near the joined edge so large groups do not scatter their captions across an empty world.

Type size still depends only on descendant characters. Own label length reserves space without changing its relative type size or cell count. Each unit of usable row width permits eight words before the next line: two cells across permit sixteen. Names are stored unchanged. Initial camera fitting measures printed content, with a readable minimum scale on small collections; the spatial world can extend beyond the viewport and remains pannable. Font readiness, keyboard placement and reduced-motion behavior retain their canonical owners.

Ordinary accounts see only printed words and multimedia. Faces have no fill, border, selected outline or invisible blank click surface. Keyboard focus underlines the printed label, with a visible photo focus ring. Registered dev accounts see the geometric planes and outlines. CloudPresentationSync sets this presentation only after authoritative authentication and a matching server identity; it never grants editing permission. Backdrop gestures remain available between words.

Each tile and each split screen has its own persisted visit list, Back/Forward cursor and camera namespace. Switching tiles restores that tile's page and history before navigation; duplication copies the current journey once, then the screens diverge. Native browser entries carry pane stamps so Back cannot wander into another tile's journey. Contextual Controls remains excluded from Back/Forward. Account changes clear view metadata and pending close checks. A tile's relative size reflects all already-received authorized page content across its screens, never its tile name. No other account or unvisited page is fetched to estimate size. Default tile numbers increase independently of split screen IDs. Double-tapping the tile name or pressing F2 opens the canonical Rename Tile sheet directly; a single tap opens Tiles and a hold selects it for Rename/Delete. Closing views retains content and existing unsaved-media guards.

Desktop variant pages put navigation clouds to the left of the native board and play controls to the right; phone placement stays above and below. Online Forfeit/Draw remain available with their distinct online identities. The two retired offline HexDame concession ILs remain reserved and are filtered from all presentations, including old overrides. Games (IL0A3) has matching blue chess-and-checkers artwork without changing its identity or owner customization. Publishing feedback uses a CloudUpload or CircleAlert icon with a stable footprint, accessible status and reduced-motion support.

## Overview
Product interface for people collecting words and pictures, and playing Hexagonal Chess on phones and desktops. English controls; names accept Unicode. The reference is iPhone's quiet glass controls floating over black space. The signature is entering a word by zooming into its cloud. Avoid dashboards, cards around every word, decorative charts, and excessive chessboard depth. The user's choice of Inter overrides generic display-font advice.

## Colors
Runtime source of truth is base.css (mapping model B). This document mirrors --background, --foreground, --surface, --primary, --muted-foreground and --error. Light by default; explicit dark mode uses the same semantic tokens and is retained per device. --glass-solid provides a legible frosted composer; --glass-border defines its rim. Neutral white indicates interaction, with textual error feedback. The eight shared --word-* tokens retain default and legacy cloud colors. The compact Public/Private and dev-only Chess picker uses a continuous pastel spectrum through the maintained Slider; safe RGB values persist with each word. Color remains optional and every word retains its readable label.

## Typography
Inter is self-hosted and preloaded by AppHead. --font-family-base and --font-family-display supply all UI. Use medium weights and restrained text. Word size is 17–30px on phones and 20–38px on desktops, relative to sibling descendant counts. Images scale by footprint. Long words wrap without changing the hierarchy.

## Layout
One cloud fills the screen. Header and composer are stable; SpatialViewport owns a transform camera for drag panning, pinch and modified-wheel zoom. Native app scrolling is disabled. A spatial layout prevents overlap. Rules use a square world wider than a phone, opening at readable scale so panning reveals the remaining words; other clouds initially fit their content. Once opened, content changes never refit the camera. Retained words keep their centers where their measured bounds allow; only new or enlarged colliding words are placed again. Board previews fit completely inside their reserved image frame, including Shafran’s tall shape. Home uses fixed anchors independent of counts and font loading. Respect safe areas and the virtual keyboard. No horizontal page overflow. Hierarchy is in the URL's cloud parameter, preserving browser Back. Fixed-height layout applies only to the cloud explorer, never globally to games or content pages.

## Elevation & Depth
Glass is reserved for the add bar and existing game sheets. Words float directly on the dark background. Chess cells stay flat.

## Shapes
Use existing radius tokens, circular utility buttons, and a long pill composer. Pictures retain their shape within a rounded image frame. Chess move indicators remain thick inset hexagons.

## Components
Canonical owners: Button, Input, Form, Dialog, RadioGroup, DropdownMenu and InstallControl. The title is plain text. Holding a word for 300 ms opens the Controls cloud; deletion Undo remains a quiet footer action. CloudCanvas owns spatial navigation; CloudComposer owns creation and validation; useCloudSpace owns async state and retry. Loading uses the shared circular Spinner. Status announcements use a polite live region and failures remain visible above the composer. PageControls and PagedText make long content reachable without scrolling; global scrollbar tokens remain only as a platform fallback, not an app interaction.

Links have visible focus, hover and pressed states. Disabled submit controls retain their footprint. Upload accepts PNG/JPEG/WebP/GIF up to 20 MB, shows an attachment preview, preserves drafts on error, and transfers file bytes directly to private storage. Native file-picker geometry is intentionally OS-owned.

Motion: 190ms outgoing zoom and 460ms arrival, with eased placement changes. Reduced motion removes zoom and navigation delay. No ambient floating movement. Content uses familiar words: Add, Retry, Boards, Rules, Engines.

## Do's and Don'ts
- Do keep the void spacious and controls few.
- Do count all descendants, and compare only visible siblings.
- Do preserve working chess sessions and direct game links.
- Don't use font size zero for a zero-percent item.
- Don't imply unavailable engines or variants are playable.

## October 17 workflow
The void is a two-dimensional transform canvas with drag-to-pan, pinch, keyboard and Ctrl/Command-wheel zoom, without scrolling or visible zoom controls. The viewport remembers its camera per cloud. Compact 48px creation bar and parent Back share the bottom thumb zone. The application is black; flat blue chess cells and the blue chess home image retain the chess identity; pastel word colors distinguish destinations. Runtime base.css remains the sole token owner.

Hold or right-click a word to enter Controls. Keyboard users use Shift-F10 on the focused word. Controls owns action droplets; shared Dialog owns editing/confirmation overlays; root-to-descendant cycles are forbidden server-side. Reversible deletion includes the branch. A hidden server limit permits exactly 1,024 immediate droplets per cloud; nesting and total workspace size remain independent.

Boards is a void with five authoritative starting-board previews: Gliński, McCooey, Shafran, Brusky and De Vasa. Tactical opens a six-level ladder, then returns to the incoming variant or Boards. Variant pages place the board among Variants, Rules, Engines, Board Reset, Undo and Pass and Play. Swipe history never changes the game. A concise bold result sheet announces checkmate, stalemate and draws.

Sign-in uses the existing Floot auth primitives. Home starts with Chess, Public, Private, Controls and Accounts; only dev accounts may insert more. Public is globally shared; only dev accounts edit Chess. Each account owns one private cloud workspace. Existing guest words can join it at sign-in. Private realtime grants contain only that account’s channel. Signing out clears browser identity. Remembered accounts use a trusted HttpOnly device cookie with server session associations, never saved passwords. Rules paragraphs each have a colored word cloud; blue diagrams appear only after opening a paragraph. Long text uses fitted pages. Confirmation sheets follow the selected light or dark palette. The compact composer follows visualViewport height and scroll offset above the keyboard.

## October 17 refinement
Public and Private creation use CloudColorWheel, a continuous horizontal Slider spectrum with touch and keyboard access; it changes selection without creating a scroller. Initial data, font and viewport readiness prevent startup movement. The borderless ION icon is black edge to edge. Undo expires ten seconds from deletion, including after reload. Password recovery uses compact email/code/password steps so every action fits above the keyboard.

## Shafran and long names
The shared board renderer fits native coordinates around their geometric center, including Shafran’s between-cell center. Rotation, piece transitions, blue cell tokens and inset outlines keep their existing owners. Shafran adds no extra game controls. Private names have no 80-character restriction: compact word-cloud previews preserve the full accessible name; entering a long label opens fitted reading pages above its droplets. Full text is stored unchanged. No new color or motion tokens.

Public, Private and dev-only Chess creation and permitted edits use a continuous gradient with a 44px gesture target. The shared Slider owns keyboard and pointer interaction. New selections skip exact sibling RGB duplicates; the server repeats allocation against the versioned workspace. Existing colors, name-only edits and branch copies retain their colors. This guarantees exact color uniqueness for new selections, not perceptual distinction between nearby shades. At a space root the Home control opens ION; from a deeper droplet it first opens that space root. Human piece previews animate immediately from native move deltas while saving; failed writes restore the authoritative board. Piece movement is 220ms and rotation is 320ms, respecting reduced motion.

Back navigation uses a 32px arrow in a 56×56px tap target on cloud and game pages, anchored in the existing bottom-left thumb zone. Header account/Home controls retain their own sizing.

## Focused entry and owner identifiers
The gradient appears as an overlay immediately above the composer only while its entry form has focus. Moving into the slider keeps it available; leaving the form dismisses it without changing a draft or canvas geometry.

Only the configured owner sees permanent IL labels adjacent to words and picture captions. The quiet 10px system-monospace annotation is metadata, not another control. The shared layout reserves its measured footprint; long paths wrap without obscuring the cloud name. Account changes remove these annotations. Existing word sizing, color and camera behavior are preserved. Five native board shapes share the blue palette, inset outlines and animation owner; pointy boards rotate around their measured center.

## Controls and photos — 0.17
CloudControls is the canonical action-navigation owner. No context popup or native black selection flash. Round trips preserve account-scoped camera and retained word centers. Home follows the shared organic layout with reserved picture footprints for Controls and Accounts. Accounts functions use the same word-cloud canvas. Only explicit dev membership permits system edits; ordinary accounts see read-only commands. Multiple photos form a reserved square collage through CloudPhoto. CloudPhotoViewer uses the canonical Dialog fullScreen variant with SpatialViewport and shared Button navigation. The composer’s color/photo tray overlays above the compact bar; it never resizes the canvas or moves beyond the visual keyboard edge. No new visual tokens or app scroll containers.

## Whole cloud labels
CloudCanvas and cloudLayout reserve the full measured label on one line, including email addresses, sentences, picture captions and adjacent dev ILs. Labels are neither shortened nor split into letters. Photo dimensions remain independent of caption width. The spatial world expands for long labels, with a readable initial camera scale and existing pan/zoom access; document scrolling stays disabled.

## Wellisch
All six variants use the shared flat blue board, word-cloud navigation and existing result/promotion sheets. Wellisch adds a third army in the existing word-amber color, with a dark outline matching White's outline; Black retains a light outline. No new visual tokens. Three-player turns rotate by 120 degrees after the movement completes, keeping pieces upright. A small high-contrast pawn direction mark and accessible original-army label remain meaningful after army takeover. Rules retain separate paragraph clouds and opened diagrams. The shared spatial viewport never paints a full-screen focus rectangle; individual actionable controls retain focus feedback.

## Board gestures and Boards
Boards (IL01) places its six native position pictures and whole captions in the shared organic spatial layout. Its initial camera fits the collection; pan and zoom remain available. Vertical board swipes change perspective or saved engine-side assignment; horizontal swipes retain history. The existing board/piece rotation timing, blue palette, black surfaces, focus feedback and reduced-motion behavior remain the owners. No new visible buttons, scroll containers or visual tokens.

## Balanced journeys — 0.19
Use cloudLayout's collision-free organic packing for every collection. Never align a collection into rigid columns. ION follows the same centered organic packing. Keep complete labels, descendant-based font sizes, independent photo footprints and pan/zoom for large worlds. Small collections fit on first entry rather than clipping the outer columns. Title pulls use the shared refresh hook. Last moves use existing word-lavender with a dashed inset hexagon, contrasting with blue legal destinations. Online waiting and join screens reuse Input, Button, Spinner and black surfaces. The generated silver king with a luminous blue hexagon matches Controls/Accounts material photography; Random uses a matching question photo. No new font, app scroll container or theme token.

## Organic Library and links — 0.20
CloudCanvas owns organic packing, measured complete labels and retained centers. Descendant percentages use a dramatic 15–59px phone / 17–74px desktop range; pictures retain independent footprints. Close spacing never permits hitbox overlap. New organic-v5 camera keys discard obsolete grid cameras; ION is organically packed and centered after initial data and font readiness.

IL04 is Library: History and Shared Games, then Received and Shared. History pictures use the actual latest saved position. SavedGame is read-only, with Notations and Opponent (Opponents for Wellisch), preserving the origin cloud for Back. Move notation can be copied by every viewer. Dev history identifiers use the permanent allocator with account-scoped node IDs. Own deletion hides one membership; sender share deletion revokes that share; recipient deletion hides one receipt. Undo lasts ten seconds from the original deletion. Games have no scheduled expiry.

Controls owns Link: whole label or selected word indexes, cloud destinations or http/https URLs. Shared CloudLinkEditor owns black paged selection sheets. Inline linked words are underlined and keyboard accessible. External links open a separate tab. All writes use existing workspace permissions and versions.

AppMark is the canonical traced geometric white-on-black app identity. Spinner and LoadingScreen reuse its three SVG paths, drawing in sequence during waits. Reduced motion shows a static mark. The icon endpoint, app metadata, install icon and manifest share that identity. No new font or theme tokens.

## Floating navigation and account clarity — 0.21
FloatingBack is the shared navigation owner across clouds, live/saved chess and account forms: a 54px glass circle at left 28px, bottom 94px plus safe area, with a white-to-muted outline gradient. The compact composer keeps its full available footer width and remains above the keyboard. Tokens flow from the existing CSS glass/foreground/radius/ease variables through this shared component; no new palette or font. Top-right account shortcuts are removed.

ION uses the same organic packing and descendant sizing as every void. Occupied bounds are centered, not the spiral origin. Collections with only two size levels use a gentler 30–70 visual weighting range while retaining true descendant percentages. Deletion discards retained footprints and repacks/recenters the surviving collection; normal back/Controls round trips retain the camera. Title holds use the same 300ms threshold and open Controls for the displayed cloud; vertical pulls still refresh. Words and titles disable native text selection/callouts without hiding keyboard focus.

Private shows one stable Sign in prompt while signed out, without unauthorized load loops. Registration offers an optional public nickname, with a neutral generated Player name if omitted. Email is never the generated public name. Remember disappears when the current account is already remembered on the device. Duplicate copies a cloud branch; Copy writes only its label text to the clipboard, with the shared black selectable fallback.

## Visited-page Back and account identifiers — 0.22
FloatingBack retains its existing glass treatment and now traverses same-app visited history; a directly opened URL uses its existing safe fallback. Public nickname sharing uses the shared saved-game Controls, Dialog and Input. A Share to nickname cloud is available alongside saved-board actions. Nicknames are unique after trimming and ignoring case, enforced by the database, with a clear conflict error that preserves form values.

Dev namespaces are assigned once on the server. Namespace 0 belongs to the first dev. ION is IL0; its existing roots are IL01 Chess, IL02 Public, IL03 Private, IL04 Controls, IL05 Accounts. Descendant suffixes and immutable birth paths are preserved (old IL201 becomes IL0301). Raw historical paths remain in the registry, with a separate permanent dev_number; public-facing ILs combine the namespace and one-based root. Dev membership alone never permits another dev to edit the first dev's shared Home/Chess workspace. Existing public-author permissions remain.

## Explicit navigation — 0.23
Every cloud remains a visible choice, including an only child. Opening a page never triggers another navigation by itself. Visited-page Back and the existing pan/zoom layout remain unchanged.

## Independent engines — 0.24
Engines contains Tactical, Positional and Defensive, each with the existing six-level ladder before variant selection. Positional 1.0.0 uses structure/coordination evaluation and full-width MaxN with a history-aware transposition cache. Defensive 1.0.0 uses king-danger/exposed-material evaluation and paranoid alpha-beta, treating Wellisch opponents as a coalition. Each has its own executable and search source; all legal moves and results remain authoritative C++. The engine ID is saved and resumed with the game, including Opponent(s), result sheets and return links. Resume slots are separate per variant, engine and level. Existing cloud IDs and arrival order remain unchanged; Defensive appends after Positional. Public metadata belongs to chessEngines, executable hashes to server-only nativeEngineAssets. The established black/Inter/organic-cloud design, explicit navigation and visited Back are preserved.

## Five independent engines — 0.25
Materialist and Unconventional append after Defensive in the existing Engines cloud. Each uses the same six-level journey and the central chessEngines allowlist; existing IDs, ILs, names, owner overrides and saved games remain intact. Amber and coral come from the existing word palette. No new routes, controls, fonts or motion tokens are added. Materialist owns its MTD(f) material/exchange search; Unconventional owns its PUCT tree and sampled rollout strategy. Both support all six authoritative variants and the existing cancellation, state validation, save/resume and result/Opponent(s) contracts. Universal remains unavailable.

## Text-sensitive spaces and Universal — 0.26
The current request supersedes the earlier one-line label rule: long labels break after every eight whole words. Words, email addresses and Unicode characters are never split, clipped or abbreviated in the spatial canvas. cloudText owns line formation; cloudLayout measures those exact lines and reserves their full height alongside pictures and dev identifiers. Both ordinary labels and linked words follow the same lines.

Sizing compares visible siblings using the total Unicode character count of each branch, including its own label, rule text and all descendant labels/text. Descendant counts remain separate for deletion confirmation. A small continuous magnitude contribution also makes an added character matter when the branch stays the largest or smallest. The established softened two-level contrast remains. Existing colors, Inter, transitions and no-scroll behavior remain unchanged.

A first visit frames occupied bounds with a 10px inset instead of fitting the empty world. Existing panned cameras remain stable through content refresh; a viewport resize refits. SavedBoardPreview reuses BoardPreview's fitted frame so tall boards cannot extend below the image. Universal appends in cyan, using the same six-level journey; all six engines are now available.

## Time — 0.27
Time appends in the existing amber palette. Its banking words reuse organic spatial packing, explicit navigation and visited Back. TimeSpace is the canonical financial view; shared Input, Button, Dialog and PagedText own forms, confirmations and long explanations. No new font, palette, native scroller or motion language. Amounts are prominent, exact and use the existing Inter type. Private records have a stable sign-in state. Confirmation retains recipient/amount and server errors; retry cannot silently change a transfer. The keyboard-aware visual viewport keeps compact forms and sheets reachable. Dev-only cost publication and treasury payout have explicit black review dialogs. Financial truth stays server-side.

## Live Activity and keyboard entry — 0.28
Activity uses three organic words: mint Added, coral Spent and amber Balance. Their running clocks use Inter tabular digits and measured fixed digit widths, preserving placement and camera scale between ticks. The existing muted footer explains posting cadence. Functional ILs use the existing small muted treatment and permanent server allocation; the numeric value never becomes an identifier. Variant Online and Library use established mint/lavender words, with compact dev labels inside the existing action footprint. No new colors, fonts or elevation. Ready desktop composers take typing focus without scrolling; touch entry remains deliberate.

## Online match words — 0.29
Online game actions reduce to coral Forfeit and cyan Draw; offline/engine boards retain their established words. Inert chat words reuse the organic packing, Inter whole-word wrapping and seat-associated cyan/lavender/amber palette, below the board. Sender names remain part of the text. They cannot open another space or expose controls. The compact black/glass composer uses the visual viewport and existing full-width footer footprint. The shared black Dialog owns forfeit confirmation and result announcements. No new tokens, fonts, native scrolling or elevation style.

## Estimate revisions — 0.30
Published estimates reuse TimeSpace's existing compact amount fields and black publication Dialog. The estimate and revision form remain in one stable surface; long basis text moves into the review sheet to preserve the no-scroll mobile canvas. Save revision and the total-time explanation distinguish a correction from adding a delta. Existing tokens and typography are unchanged.

## Other Accounts — 0.31
Other Accounts uses the existing lavender organic cloud, explicit navigation and permanent dev identifier allocation. The current account stays mint at the root. No new style, routes, typography or interaction pattern.

## Affordable gates and simpler spaces — 0.32
Unaffordable paid entries are absent. Affordable unpurchased names use a 2px line-through in their existing word color and open the Time trade view. They remain focusable links with a purchase-required accessible description. Time hub reuses the ordinary organic home canvas and owner composer; its redundant Balance entry is removed. Redirect uses the existing Controls/editor presentation. Public/Private composers show the depth-specific word allowance as a short input hint. No new visual tokens, routes, fonts or animation system.

Saved cloud mutations synchronize mounted views immediately for the same account/scope; other accounts continue to receive server-authorized realtime snapshots.

## Word equivalents and page views — 0.33
The compact composer keeps a quiet tabular word count inside its existing 48px bar. Picture selection appears only when its 1,000-word contribution fits the Public/Private allowance; existing attachments remain removable. A picture's branch weight equals 1,000 words, propagated through ancestors. Existing character sensitivity remains a small size refinement. No palette or font change.

PageWorkspace owns optional desktop page divisions. The signature is an inset 3.5px foreground separator with rounded ends and a restrained white glow, over the existing black surface. Two views stack; three use a golden-width left view with two stacked right views; further additions divide the largest area. The original page stays mounted and every view can navigate independently. The page frames use the same Inter, black, glass footer, organic layout and responsive sizing. No panel titles, tabs, borders around every page or new routes are added. Motion uses the existing ease token at 380ms and disappears for reduced motion. Below the minimum readable area no further division occurs. Touch layouts retain the established single-page keyboard-aware geometry.

## Direct Time and descendant characters — 0.35
Latest user policy supersedes word/picture font weights: only characters in descendants' labels/text determine a cloud's font, excluding its own label and note. Leaves tie even when their words or pictures differ. Picture entry allowance still counts 1,000 words; it has no synthetic font weight. Existing Inter, colors, organic packing, character-refinement curve and no-scroll camera remain the owners.

Time exposes Added/Spent/Balance directly with stable ILs and tabular clock widths. Prices is a complete signed-in catalog; a regular price page consists of its amount and an affordable Purchase word, over black. Dev financial review retains its existing details. Earn has one explanation with paragraph clouds. Receive uses the same receipt canvas and “Nothing here yet” when no incoming transfers exist. Controls custom content is visible in ordinary navigation; hold contexts contain only actions and omit the composer. No new palette, font, button or route.

## Dev counts and prompt privacy — 0.36
Accounts reuses the existing organic canvas for a dev-only Signed in word with the live unique-account count. Its label is editable; the number is a transient server projection and never saved into shared text. Tabular numbers preserve visual stability. No additional navigation, font or surface. The To do prompt branch is visible to devs only, with the existing Complete/Completed word vocabulary.

## Remember button — 0.37
The existing shared Button owns Remember on both authentication forms. A quiet outlined glass pill makes the unselected state visibly actionable; the blue border/tint and check show selection. It retains the dark Inter theme, keyboard focus, reduced-motion handling and 44px touch target. Successful authentication lands on ION.

## Visitor reliability and touch accuracy — 0.38
Coarse-pointer word canvases reserve 56px boxes and begin at a minimum 0.8 fit scale, producing at least 44.8px opening targets. Relative font sizes, colors and pictures remain unchanged. Packing still prevents overlaps; large pages use panning. Desktop fitting, explicit zoom, saved camera positions and manual overview zoom stay unchanged. Offline chess puts its Back bubble in the reserved footer so it cannot cover Board Reset; online retains clearance above chat. No extra navigation or decorative elements are added.

## Prompt refinements — 0.39
Preserve the black, Inter, organic-canvas visual system. CloudActions owns deletion choices using its existing black dialog and pressed-state buttons: Everything inside / Keep children, then explicit Delete; Cancel remains Keep. No new route or menu. Empty word canvases invite “Add a word or picture”; financial Receive retains its truthful empty receipt state. Organic type sizes interpolate linearly between the readable minimum and a viewport-derived maximum. Exact character percentages retain sixteen decimal places as data; rendered geometry remains subject to browser pixel precision. Background typing restoration is opt-in through an already-focused composer and never opens a new visitor’s keyboard or takes focus through a dialog.


## Comfortable opening frame — 0.40
Keep Inter, black surfaces, blue chess pictures and the organic canvas. Sparse word pages no longer enlarge up to 3×: the shared word canvas caps default fit at natural scale and reserves 28px breathing room. Coarse-pointer pages use a gentler 0.65 opening floor with 72px target boxes (46.8px minimum at that floor); explicit/manual camera views remain intact. Typeface range is bounded by the actual viewport, rather than the virtual world's width, and the organic placement uses a tighter horizontal spread. Pictures accept up to 20 MiB apiece. Word labels and picture names have no 80-character cap in any scope; depth-based word budgets and the general request guard remain.

## Descendant-only typography and uninterrupted color — 0.41
The word's own label must never affect its font size or sibling fonts. Compute the viewport-based type scale before measuring names; long names reserve more spatial room and wrap at the established eight-word boundaries. Picture captions follow descendant statistics, not their own labels. Keep the black Inter canvas and existing zoom/pan policy. Touch color gestures beside an active text field preserve that field's focus and selection; the slider remains keyboard-focusable when intentionally reached by keyboard.

## Continuous sending and white hold — 0.42
Sending should keep the keyboard session alive. Add does not take pointer focus from the active composer; the field stays enabled as a text input during pending requests and the mobile action key is Send. Draft edits and duplicate submissions remain guarded while saving. A stationary 300ms hold on the color spectrum selects white; moving more than 8px beforehand remains ordinary color adjustment. W is the equivalent when the slider is intentionally keyboard-focused. No extra button, route or overlay.

## Schedule — 0.43
Schedule is the existing owner-created Home branch IL0A1. Preserve its organic word canvas and existing year/month/day IDs. All date nodes use semantic green (#82f398) for past, white for current and orange (#ffad5c) for future, at the node's year/month/day granularity in the viewer's account zone. Status is also available to assistive technology. No forms, date-picker UI, extra buttons or routes. The same green may appear on many dates; this computed semantic color intentionally overrides saved decorative shades and does not use the unique color wheel policy.

### 0.44 — Personal Schedule
Keep the existing organic calendar presentation and date colors. Schedule opens a personal authenticated space; use the standard stable sign-in gate for guests. Hide empty past periods without deleting their permanent identities. A saved note keeps its dated path visible. Dev accounts obey the same privacy boundary as everyone else; shared Home shows only the viewer's own Schedule weight. No new controls or visual chrome.

### 0.45 — Pictures and appearance
Pair Home destinations and Settings with companion brushed-silver/frosted-glass pictures, blue edge light on black, matching Controls. Preserve existing pictures and permanent IDs. My Space replaces Private in user-facing navigation; Safari replaces Public. Scope keys and access policy remain unchanged.
Color Inversion is an optional reversible device preference; default remains black. The rendered-surface filter covers boards, media, loading, split views and portal dialogs. Embedded page panes inherit the outer rendering effect and must not apply a second inversion. The toggle alone compensates its status color: --inversion-on #247638 (green against inverted white), --inversion-off #f38282 (red against default black). base.css owns these values; CloudCanvas references the tokens. Do not animate the whole-page color switch.

### 0.46 — Theme chrome and quieter loading
Schedule future years/months/days are orange #ffad5c; past green #82f398 and current white remain. My Space's journal picture replaces the vault, retaining its identity and shared silver/glass styling.
Inversion now gives html/body actual white backgrounds and a light color-scheme for browser chrome detection, while filtering each top-level rendered app/portal surface once. Embedded page panes keep their unfiltered base so the outer page supplies the only inversion. AppHead follows the appearance preference with theme-color and color-scheme metadata; installed-web-app status style is default rather than forced black. Default app appearance stays black. No extra controls or transition spectacle. Photo decoding is asynchronous, within existing reserved frames.


## ION plugin and journal — 0.47
Journal (IL03) and Hexagonal Chess (IL01) use the same brushed-silver, fine blue edge-light and black-background icon family as Safari and Schedule. Journal shows an open notebook and a pen; Chess shows a silver king inside a silver hexagon. These studio-style icons follow the user’s later request for matched styling, replacing the initially requested literal journal photograph. Journal’s already-renamed live label is also reflected in its private scope and navigation. Asset provenance lives in cloud/assets/ion-0.47-artwork.json.

The ChatGPT connection uses a focused black consent surface, Inter, the ION mark, readable text, shared Input/Button controls and reduced-motion support. It clearly identifies the signed-in account, requested read/save permissions, Cancel and Connect. Normal Home remains uncluttered; installation/disconnection lives at /chatgpt. Only an explicit successful account consent redirects back to the registered ChatGPT callback. Secrets are never requested in chat.

Schedule joins Time estimates and Prices as feature:schedule. Unpriced or unaffordable Schedule paths stay hidden for non-devs; affordable unpurchased paths have the canonical purchase line/gate. Purchase is enforced by backend context and plugin tools, with free dev access. Existing Schedule entries, scaffolding, timezones, calendar colors and immutable identifiers remain.

### 0.56 — One color wheel
A single 112px circular palette replaces the two hue/softness rails. Angle selects hue; distance from the center selects richness. The palette renders actual contrast-safe colors, with a small two-tone selection ring. It appears only during entry and preserves the keyboard. No extra labels, buttons or routes; keyboard instructions remain available to assistive technology.

### 0.57 — Horizontal color box
The user's updated direction replaces the circle with one wide, rounded 72px color field above entry. Hue progresses horizontally; a soft central band blends outward into richer shades. Preserve the small contrasting marker, keyboard access and existing glass input.

### 0.58 — Restore the original
Return to one slim horizontal pastel spectrum in the existing 44px touch area. Remove the circular/rectangular two-dimensional surfaces and extra softness dimension. Preserve the original marker, white hold and input focus behavior. This supersedes 0.55–0.57 picker styling.


## Checkers — 0.59
HexDame and Kruzno’s Checkers open from the existing Checkers branch (IL01A0). Each starting position is rendered with the same flat blue CloudBoard and simple contrasting disks; HexDame kings show a double disk and small crown. Kruzno’s restricted outer ring uses the existing darker board token. Capture paths use the existing bright inset hexagons one landing at a time. The moving piece follows each selected landing without committing a partial turn. Computer difficulty, Pass and Play, Rules, Online and Library retain the shared Play journey, dialogs, loading, motion, visited Back and Time gating. Chess’s six native engines remain separate; checkers uses a dedicated cloud computer. No new theme tokens, scrolling surfaces or alternate authentication system.


## IL navigation and one Computer — 0.60
Cloud and droplet are official terms. Keep Inter, black surfaces and existing blue boards. FloatingBack is a Safari-style glass navigation control: 54px circle expanding to a 108px Back/Forward pill only when a known forward visit exists, with reduced-motion support. Contextual Controls stays out of Back/Forward; holds open it after 180ms. Safari exposes a search magnifier at the left of entry, name/IL lookup and Copy IL for everyone. IL URLs and Redirect use the canonical authorized cloud snapshots; personal permissions, dev-only content and purchase gates remain enforced. Redirect stages whole/selected text, then Item/URL/IL, with paged choices fitting the visual viewport and no document scrolling. Move shows permanent ILs. Reading references are clickable across fitted pages.
All newly created computer games use the existing Universal backend and one six-level Computer; old engine executables and IDs exist for saved-game compatibility. Computer and HexDame are free and absent from the paid catalog/price denominator; append-only purchases remain historical. Kruzno keeps its unrotated Black-bottom-left reference view unless manually flipped; its offline Forfeit/Draw ILs are retired, online actions retain new distinct IDs. Descendant-only linear sizing stays intact; subpixel packing comparisons do not relocate unchanged droplets. User-created hierarchy and To do items stay unchanged.

## October 25 — Tiles and screens
The user's IL0A0093 drawing is the reference for a compact isometric mosaic of rhombus tiles. These are an overview of open pages, with width and length reflecting each page's screen stacks. Existing black surfaces, Inter, thin muted outlines and one softly glowing active outline remain the visual owners; no new palette or typeface is introduced. Labels remain upright and readable inside the shapes. SpatialViewport supplies pan/zoom; there is no document scrolling. Tiles uses the existing full-screen Dialog, with New tile/Done in the thumb zone.

Title swipes duplicate screens directionally; a held drag moves an existing screen to an edge preview. The same operations are available in the title menu. Long inset white separators grow and reposition with the split; only the focused screen's touching long outer edges glow. Layout changes use the existing eased 380 ms timing, disabled for reduced motion. Screens retain their route, draft and chess state when moved; photo drafts prevent unsafe closing. A single title tap opens the cloud's complete content without its droplets, double-tap refreshes, and holding offers screen and cloud actions. The first desktop keyboard division is left/right, superseding the older stacked layout.


## Other completion — 0.62

IL01 is Hexagons, with matching blue chess-and-checkers artwork and unchanged permanent identities. Picture captions reset their own letter spacing and wrap at complete words, using measured width as well as the eight-word maximum. Organic packing reserves whole text, media, IL and delivery footprints; own label length never sets font size.

Tiles are manual. The centered overview has New, a +, no visible description or Done, and a red Delete cloud after holding a tile. Deleting closes views without deleting their content; unsaved media blocks closing. An X beside each split title closes that screen. Each screen initially copies its source page and navigates independently thereafter.

Received cloud, Controls, Time and saved-game reads are cached in account-scoped IndexedDB for thirty days, reconciled online and removed on sign-out/switch. An unexpired, server-dated session may display cached private content during a network failure; 401/403 never fall back to it. No service worker is registered: cold offline app launch remains browser-controlled. Pictures cache after loading; complete recordings/videos cache after playback ends. Failed cache writes do not block reading or playback.

A durable cloud outbox accepts another entry while publishing, shows a sending symbol or a failed symbol, and supports Retry/Discard. It serializes versioned writes, reuses UUIDs on retry, orders pending parents before droplets, binds every request to its real account and uses Web Locks between screens. Authentication, ledger, purchases, permissions and legal moves remain server-authoritative. Financial mutations are never queued as offline actions.

Media uses the existing private direct-upload and scoped copy/move flow. Pictures allow20 MiB, video200 MiB and audio100 MiB. Server validation checks stored size and signatures. Pictures count1000 words, videos1000000 and audio500000 toward each depth-based allowance. Native inline playback lives inside the existing fullscreen viewer; no autoplay or new document scrolling.

The composer input remains mounted through cloud navigation, keeps touch keyboard focus when already typing, and retains new typing if an earlier enqueue completes. Expanded media/color controls reserve their height above the footer; feedback actions preserve input focus, and the back bubble rises clear of those controls. Cross-screen account changes refresh authentication.

Activity contains Added, Spent and Balance, using the existing live total authority and permanent ILs. Registered devs edit static Time presentation in shared Home; generated receipt/work presentation is validated against its actual record and stored in that dev's own Accounts workspace. Page headings have stable functional definitions. Presentation edits never rewrite ledger entries, balances, ownership or prices. Kruzno’s officially first-moving Black is the default human side; a downward pre-game swipe can give Computer the first turn. Opponent checkers turns show each capture landing at340ms intervals, with original HexDame capture-body rules, before the next turn becomes interactive.


## 0.63 — printed rhombus composition and light-first surfaces

The current user-approved direction supersedes earlier organic-word, fixed-anchor, inversion and dark-only entries. Every navigable cloud uses an adjoining triangular-lattice mosaic with exact 60°/120° rhombi in three planes. Large faces and subdivisions form a restrained isometric step/cube illusion, with no material shadows, bevels or hidden faces. Words, captions and multimedia are printed on each face through an affine plane; the face polygon is also its actual hit target. Content never overlaps adjacent faces. Text wraps at whole words, at most eight per line. Own label length reserves geometry but never increases its own type size: descendant characters alone determine the relative type scale. Pictures have varied deterministic sizes, complete contain-fit frames, and accessible fullscreen inspection.

Runtime source of truth remains base.css. The new light palette is --background #fafaf9 and --foreground #17191d; rhombus top/right/left are #f9f9f7/#e3e5e3/#ccd0ce. Explicit dark uses #08090b and #f5f5f7, with planes #22262b/#171b20/#101419. Custom saved colors are projected to contrasting light/dark display shades without mutating saved RGB. Blue boards, media, favicon and video retain their actual colors. No page/image inversion remains. IL04A10 retains its permanent ID and owner wording and toggles real dark mode, green while active and red while inactive. Browser theme-color/color-scheme and the status-bar hint follow it, including embedded screens.

RhombusSurface, rhombusMosaic and mosaicCloudLayout own all normal cloud pages and Tiles. Board action clouds and temporary chat words use the same plane primitive; live boards remain flat for precise play. Small mosaics initially fit their complete bounds; larger pages remain pannable/zoomable. Packing is deterministic and bounded-cache, with exact shared edges and no quadratic candidate search.

ComposerDock owns the raised footer: Safari-style visit Back/Forward sits beside the input while inactive; focused entry uses the full footer width and sits above the visual keyboard. Background tapping restores navigation. The canonical edit sheet has Name and Media only, no additional notes field, and an always-present color wheel in both tabs. Existing stored notes remain unchanged. Split close buttons stay 44px square and are excluded from full-height screen-child CSS.

Tiles are account-scoped view state. Left input swipe creates a new independent tile; right revisits, up opens Tiles. Holding a tile exposes Rename and Delete; tile names persist with that tile and appear above each current page header, shared by its split screens. The Tiles title represents the assembly cloud. New Tile, Rename and Delete are ordinary functional clouds with permanent server ILs and registered-dev presentation editing. Tile deletion closes only views and retains unsaved-media safeguards. Canonical Board Games root name edits atomically project across shared Home/Chess without changing parent, media, authors or permanent identifiers; public display-name projection excludes personal/custom/dev-only content and inaccessible feature names.


## 0.70 — organic parity, account capabilities, purchases and daily puzzles

This entry supersedes earlier focus-expansion and narrow-column guidance. Organic remains the default. CloudCanvas and cloudLayout own the same complete-word, descendant-character content in both layouts. At most eight words form a line; own label length reserves geometry but does not raise its font. Small labels retain a readable camera minimum. Organic target spacing is 12px for compact touch, 16px for desktop, with square anchors and collision-resolved hitboxes. Tiled mosaics use square packing independent of phone aspect. Skies remain sized by partition count; Tiles use descendant content. Deletion, retained cameras, media, ILs, Controls, page partitions, keyboard navigation and existing dev edits retain their canonical owners.

Toggle Tiled UI keeps its identity and now lives in existing Controls → Settings. Device-derived account capabilities own their parent, action and live visibility. Old shared dev presentation edits cannot hide a live remembered account or import an account from a different device. Labels and allowed artwork remain editable. Actual Forget still removes this device capability.

ComposerDock collapses navigation only on a focused coarse-pointer phone. Desktop stays at most 680px wide and retains visible Back/Forward while typing, including a disabled Forward when no future exists. The same visual viewport and safe-area owners position mobile entry. No new app scrolling or history model is introduced.

Dark retains its near-black base, flat blue boards and Inter, with richer semantic word colors, luminous text/heading feedback, glass-surface glow and shared entry/reflow transitions. Motion is CSS based and respects reduced motion. Hitboxes never expand on hover. Media colors and board pieces are not inverted.

A server-confirmed purchase projects ownership for navigation immediately, then refreshes authoritative Time. The selected cloud opens; purchase records live under Time → Receipts, filtered on the server to this account’s outgoing purchases. Ledger, transfer records and permanent birth ILs are not rewritten. Failed confirmation retains its quote and idempotent request identity.

Learn → Puzzles uses canonical native board rendering and shared CloudCanvas actions. Each variant receives a 64-position daily rotation, selected by account-local date with DST-aware midnight refresh. Chess uses mate-in-one, Wellisch its historical army takeover, HexDame promotion and Kruzno a win. All composed positions and accepted continuations are generated and verified against authoritative rules before shipment. Server-only banks prevent per-view native searches. Hint selects a starting piece; Again practices without rewriting first-solve statistics. Signed-in progress is private, versioned, idempotent and account-realtime; guest progress is device-local. No puzzle wallet reward or public completion fanout exists. Paid variants retain server entitlement checks. New functional clouds receive permanent server ILs and normal dev label editing.


## 0.71 — direct cloud manipulation and media editing

The canonical runtime remains base.css (Model B). Frontmatter now mirrors its accepted light-default tokens; earlier black-only descriptions are historical, superseded by the established light/dark switch. Inter and the no-document-scroll canvas remain. This resolves existing documentation drift rather than changing the default again. cloudColors owns one saturated continuous spectrum, projected to actual #fafaf9/#08090b background contrast; CloudColorWheel supplies that same spectrum to the shared Slider through --word-spectrum. Light and dark names, the thumb and the track therefore agree. Saved colors retain their underlying RGB values.

Board Games now uses a shared indigo/slate palette through --board-light/medium/dark. --board-legal/capture/check/selected/last are distinct semantic roles, consumed by the common chess/checkers board and rules diagrams. Complete-cell hitboxes and the flat board remain; previous moves retain a dashed inset outline. Media and pieces are not inverted.

Hold/Ctrl/Cmd-click keeps Controls. Editable words gain a deliberate double-tap and F2 shortcut to the canonical footer editor. Pictures keep double-tap fullscreen viewing. The footer edits words and media together, always shows the color wheel, contains retained/new media above the entry field and uses the existing Cancel/Save primitives. Retained media is paged without document scrolling. It preserves the original IL, original notes and failed drafts; Escape/Cancel can confirm discarding changed content. Portrait and landscape pictures reserve their real ratio within their descendant-scaled footprint; unlabeled picture-only clouds do not invent a filename caption.

Cloud dragging follows the pointer without re-rendering the full collection on each frame. A visible ring identifies a valid drop cloud. Drop commits the existing authorized, versioned Move operation; failure restores the starting placement. Descendants, locked destinations and read-only words are not valid moves. Move in Controls remains the non-drag alternative.

The visible navigation bubble now uses Up/Down: actual hierarchy ascent and the previously opened direct droplet, isolated per account, Sky and screen. Keyboard visited-page history remains separately owned by HistoryKeys/paneNavigation. Ctrl/Cmd Left or Right creates a fresh Sky, starting in Journal for a signed-in account and Safari for a guest; typing is immediately available where permitted. Skies prints + for the default New Sky action, with its accessible name and permanent functional identity retained. Ctrl/Cmd Enter publishes synchronously and enters only after server confirmation; ordinary Add retains its existing account-bound outbox behavior. Existing drafts, split views and dev-edited labels remain.
