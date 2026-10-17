---
version: alpha
name: ION
description: A quiet iPhone-inspired space where words and pictures open into clouds.
colors:
  background: "#000000"
  foreground: "#f5f5f7"
  surface: "#111111"
  primary: "#eeeeef"
  muted: "#a1a1a6"
  error: "#ff8176"
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
---
# ION Design System

## Overview
Product interface for people collecting words and pictures, and playing Hexagonal Chess on phones and desktops. English controls; names accept Unicode. The reference is iPhone's quiet glass controls floating over black space. The signature is entering a word by zooming into its cloud. Avoid dashboards, cards around every word, decorative charts, and excessive chessboard depth. The user's choice of Inter overrides generic display-font advice.

## Colors
Runtime source of truth is base.css (mapping model B). This document mirrors --background, --foreground, --surface, --primary, --muted-foreground and --error. Dark only. --glass-solid provides a legible frosted composer; --glass-border defines its rim. Neutral white indicates interaction, with textual error feedback. No per-word rainbow.

## Typography
Inter is self-hosted and preloaded by AppHead. --font-family-base and --font-family-display supply all UI. Use medium weights and restrained text. Word size is 17–30px on phones and 20–38px on desktops, relative to sibling descendant counts. Images scale by footprint. Long words wrap without changing the hierarchy.

## Layout
One cloud fills the screen. Header and composer are stable; SpatialViewport owns two-axis scrolling, drag panning and pinch / modified-wheel zoom. A spatial layout prevents overlap and grows vertically when needed. Respect safe areas and the virtual keyboard. No horizontal page overflow. Hierarchy is in the URL's cloud parameter, preserving browser Back. Fixed-height layout applies only to the cloud explorer, never globally to games or content pages.

## Elevation & Depth
Glass is reserved for the add bar and existing game sheets. Words float directly on the dark background. Chess cells stay flat.

## Shapes
Use existing radius tokens, circular utility buttons, and a long pill composer. Pictures retain their shape within a rounded image frame. Chess move indicators remain thick inset hexagons.

## Components
Canonical owners: Button, Input, Form, Dialog, RadioGroup, DropdownMenu and InstallControl. The title is a restrained disclosure for ancestry, Rename, Remove and Undo; keep these controls out of the canvas. CloudCanvas owns spatial navigation; CloudComposer owns creation and validation; useCloudSpace owns async state and retry. Loading uses the shared circular Spinner. Status announcements use a polite live region and failures remain visible above the composer. Main scrollbars inherit the global base.css baseline including forced-colors behavior.

Links have visible focus, hover and pressed states. Disabled submit controls retain their footprint. Upload accepts PNG/JPEG/WebP/GIF up to 3 MB, shows an attachment preview, preserves drafts on error, and transfers file bytes directly to private storage. Native file-picker geometry is intentionally OS-owned.

Motion: 190ms outgoing zoom and 460ms arrival, with eased placement changes. Reduced motion removes zoom and navigation delay. No ambient floating movement. Content uses familiar words: Add, Retry, Boards, Rules, Engines.

## Do's and Don'ts
- Do keep the void spacious and controls few.
- Do count all descendants, and compare only visible siblings.
- Do preserve working chess sessions and direct game links.
- Don't use font size zero for a zero-percent item.
- Don't imply unavailable engines or variants are playable.

## October 17 workflow
The void is a two-dimensional space with native scrollbars, drag-to-pan, pinch and Ctrl/Command-wheel zoom, plus visible zoom controls. The viewport remembers its camera per cloud. Compact 48px creation bar and parent Back share the bottom thumb zone. Black replaces the blue palette; colour is reserved for semantic chess indicators and errors. Runtime base.css remains the sole token owner.

Hold or right-click a word for Edit, Move, Copy, Delete. The title menu provides the same actions for keyboard users inside the cloud. Dialog and ContextMenu own overlays; root-to-descendant cycles are forbidden server-side. Reversible deletion includes the branch. No application word-count cap.

Boards is a void with two authoritative starting-board previews. Tactical chooses the implemented engine and returns to the incoming variant, or to Boards. Variant pages place the board among Variants, Rules, Engines, Board Reset, Undo. Swipe history never changes the game. A concise bold result sheet announces checkmate, stalemate and draws.

Sign-in uses the existing Floot auth primitives. Each account owns one private cloud workspace. Existing guest words can join it at sign-in. Private realtime grants contain only that account’s channel. Signing out clears browser identity and reloads the anonymous view.
