---
version: alpha
name: ION
description: A quiet iPhone-inspired space where words and pictures open into clouds.
colors:
  background: "#050810"
  foreground: "#f4f7ff"
  surface: "#0b1323"
  primary: "#74b9ff"
  muted: "#98aac5"
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
    size: "25px"
    textColor: "{colors.foreground}"
  composer:
    height: "66px"
    textColor: "{colors.muted}"
---
# ION Design System

## Overview
Product interface for people collecting words and pictures, and playing Hexagonal Chess on phones and desktops. English controls; names accept Unicode. The reference is iPhone's quiet glass controls floating over black space. The signature is entering a word by zooming into its cloud. Avoid dashboards, cards around every word, decorative charts, and excessive chessboard depth. The user's choice of Inter overrides generic display-font advice.

## Colors
Runtime source of truth is base.css (mapping model B). This document mirrors --background, --foreground, --surface, --primary, --muted-foreground and --error. Dark only. --glass-solid provides a legible frosted composer; --glass-border defines its rim. Blue indicates interaction, with textual error feedback. No per-word rainbow.

## Typography
Inter is self-hosted and preloaded by AppHead. --font-family-base and --font-family-display supply all UI. Use medium weights and large text. Word size is 25–50px on phones and 30–72px on desktops, relative to sibling descendant counts. Images scale by footprint. Long words wrap without changing the hierarchy.

## Layout
One cloud fills the screen. Header and composer are stable; the central canvas owns scrolling. A spatial layout prevents overlap and grows vertically when needed. Respect safe areas and the virtual keyboard. No horizontal page overflow. Hierarchy is in the URL's cloud parameter, preserving browser Back. Fixed-height layout applies only to the cloud explorer, never globally to games or content pages.

## Elevation & Depth
Glass is reserved for the add bar and existing game sheets. Words float directly on the dark background. Chess cells stay flat.

## Shapes
Use existing radius tokens, circular utility buttons, and a long pill composer. Pictures retain their shape within a rounded image frame. Chess move indicators remain thick inset hexagons.

## Components
Canonical owners: Button, Input, Form, Dialog, RadioGroup, DropdownMenu and InstallControl. The title is a restrained disclosure for ancestry, Rename, Remove and Undo; keep these controls out of the canvas. CloudCanvas owns spatial navigation; CloudComposer owns creation and validation; useCloudSpace owns async state and retry. Loading uses HexLoading. Status announcements use a polite live region and failures remain visible above the composer. Main scrollbars inherit the global base.css baseline including forced-colors behavior.

Links have visible focus, hover and pressed states. Disabled submit controls retain their footprint. Upload accepts PNG/JPEG/WebP/GIF up to 3 MB, shows an attachment preview, preserves drafts on error, and transfers file bytes directly to private storage. Native file-picker geometry is intentionally OS-owned.

Motion: 190ms outgoing zoom and 460ms arrival, with eased placement changes. Reduced motion removes zoom and navigation delay. No ambient floating movement. Content uses familiar words: Add, Retry, Boards, Rules, Engines.

## Do's and Don'ts
- Do keep the void spacious and controls few.
- Do count all descendants, and compare only visible siblings.
- Do preserve working chess sessions and direct game links.
- Don't use font size zero for a zero-percent item.
- Don't imply unavailable engines or variants are playable.
