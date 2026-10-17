---
name: SirenDeck
description: The Ink Ledger — a premium monochrome ledger for every renewal, sized by how soon it is due, shaded by the same ramp.
colors:
  paper: "#f7f5f0"
  surface: "#fffdf9"
  surface-2: "#efece4"
  rule: "#dcd7cb"
  rule-strong: "#b8b2a3"
  rule-input: "#8a867b"
  ink: "#141311"
  ink-muted: "#676357"
  urgency-calm: "#e4e0d5"
  urgency-soon: "#c9c3b4"
  urgency-urgent: "#a29b89"
  urgency-critical: "#4a463e"
  urgency-overdue: "#141311"
  urgency-calm-text: "#6e6a5f"
  urgency-soon-text: "#5d594e"
  urgency-urgent-text: "#45413a"
  urgency-critical-text: "#2e2b26"
  urgency-overdue-text: "#141311"
typography:
  display:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "clamp(2.6rem, 5.4vw, 4.2rem)"
    fontWeight: 600
    lineHeight: 1.02
    letterSpacing: "-0.015em"
  headline:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.1
  title:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.3
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
  ledger-cap:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 560
    lineHeight: 1.2
    letterSpacing: "0.14em"
    textTransform: "uppercase"
  mono-figure:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    lineHeight: 1.4
rounded:
  tile: "2px"
  control: "3px"
  dialog: "6px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "10px 20px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    borderColor: "{colors.rule-strong}"
    rounded: "{rounded.control}"
    padding: "8px 16px"
  tile-calm:
    backgroundColor: "{colors.urgency-calm}"
    textColor: "{colors.ink}"
    rounded: "{rounded.tile}"
  tile-soon:
    backgroundColor: "{colors.urgency-soon}"
    textColor: "{colors.ink}"
    rounded: "{rounded.tile}"
  tile-urgent:
    backgroundColor: "{colors.urgency-urgent}"
    textColor: "{colors.ink}"
    rounded: "{rounded.tile}"
  tile-critical:
    backgroundColor: "{colors.urgency-critical}"
    textColor: "{colors.paper}"
    rounded: "{rounded.tile}"
  tile-overdue:
    backgroundColor: "{colors.urgency-overdue}"
    textColor: "{colors.paper}"
    rounded: "{rounded.tile}"
---

# Design System: SirenDeck

## Overview

**Creative North Star: "The Ink Ledger"**

SirenDeck is a premium monochrome ledger for everything that expires, renews, or comes due. The visual world is warm paper and near-black ink: a light editorial ground (#f7f5f0), surfaces one step whiter, hairline rules like ledger ruling, and a single grayscale five-step urgency ramp where **lightness is urgency** — calm entries sit pale, past-due entries go solid ink. Typography pairs an editorial serif display (Fraunces, optical-size axis) with a quiet grotesque (Inter) and JetBrains Mono tabular figures for every number that can change.

The Money Map is the signature view: a treemap sized by how soon each deadline is and shaded by ink depth, so the closest deadline is the largest tile and darkness says the same thing. Yearly cost stays on the tile. The soonest due entry carries an ink ring anchor. There are no pulses — in a print world, ink itself is the alarm. The one authored motion moment is rerank-in-place: entries reflow with a soft spring when dates or costs change.

**Key Characteristics:**
- Warm paper ground, near-black ink text, hairline rules — premium by restraint, never floating cards or shadows on panels
- A grayscale urgency ramp used strictly as data: calm #e4e0d5 → soon #c9c3b4 → urgent #a29b89 → critical #4a463e → overdue #141311 (solid ink)
- Fraunces serif display for headlines and figures of emphasis; Inter for body; `.ledger-cap` (tracked uppercase) for every ruling, tab, and totals label
- JetBrains Mono tabular figures for all costs, dates, counts, ranks
- One ink plate CTA per view (solid #141311, paper text, one offset emboss shadow)
- Rerank-in-place springs as the signature motion; everything collapses to instant under `prefers-reduced-motion`

## Colors

The palette is paper and ink with one grayscale urgency ramp; shade is urgency data, never decoration.

### Primary
- **Ink** (#141311): text, the plate CTA fill, the overdue terminus, and the brand mark square. The heaviest thing on any page.
- **Paper** (#f7f5f0): the ground. Every page starts here.

### Secondary
- **The urgency ramp** — used exclusively as tile fills and row swatches, always in order:
  - **Calm** (#e4e0d5): over 90 days out. Ink text.
  - **Soon** (#c9c3b4): inside 90. Ink text.
  - **Urgent** (#a29b89): inside 30. Ink text.
  - **Critical** (#4a463e): inside 7. Paper text.
  - **Past due** (#141311): departed. Paper text. Solid ink — the alarm.
- **Text twins** (#6e6a5f → #141311): the same ramp retuned for small chips on paper (all ≥4.5:1).

### Neutral
- **Surface** (#fffdf9): first raised layer — bars, rows, cards.
- **Surface-2** (#efece4): second layer — chips, active fills, skeletons.
- **Rule** (#dcd7cb): hairline ruling between panels and rows.
- **Rule-strong** (#b8b2a3): hover rules, ghost-button borders.
- **Rule-input** (#8a867b): interactive field edges (≥3:1 non-text contrast).
- **Ink-muted** (#676357): secondary text (≥4.5:1 on all grounds).

### Named Rules
**The Shade Is Data Rule.** The five urgency grays appear only where urgency is the information. Never as brand accent, decoration, or illustration.

**The One Plate Rule.** One ink plate CTA per view. Secondary actions are rule-bordered ghosts or underlined text links.

**The Ink Is the Alarm Rule.** No pulses, no glows. Emphasis is printed: darker ink, heavier rules, the ring anchor.

## Typography

**Display Font:** Fraunces (Georgia fallback), optical-size axis loaded
**Body Font:** Inter (system-ui fallback)
**Figure Font:** JetBrains Mono (ui-monospace fallback)

**Character:** An editorial serif for statements, a quiet grotesque for reading, mono for numbers — a financial broadsheet brought to screen.

### Hierarchy
- **Display** (600, clamp(2.6rem–4.2rem), 1.02, −0.015em): landing hero and final CTA only.
- **Headline** (600, 1.5–2rem, 1.1): section and page titles, serif.
- **Title** (500, 1rem, 1.3): row titles, tile labels, form labels.
- **Body** (400, 0.875rem, 1.6): reading copy, max ~65ch, pretty wrapping.
- **Ledger Cap** (560, 0.6875rem, 0.14em tracking, uppercase): every ruling, column head, tab, totals label, chip prefix.
- **Mono Figure** (400–600, 0.75rem+, tabular): costs, dates, counts, ranks — always tabular.

### Named Rules
**The Caps Ceiling Rule.** Ledger caps are for labels, never sentences.

## Layout

Full-height application frame (100dvh): top bar (56px, ruled) → filter rail (40px) → view row (editorial underline tabs) → the ledger surface → summary strip. Marketing uses a 6xl centered column with ruled sections; the five-shades ramp section is a full-bleed beat bounded by a 2px ink rule.

Responsive: under 768px the default view is the ledger list; costs and days always visible, stacked right-aligned. Explicit `?view=map` overrides.

Spacing rhythm: 4px base; rows 12px; panel padding 16px; section padding 96px.

## Elevation & Depth

Flat paper layers tonal-stepped (paper → surface → surface-2) and separated by rules. Two shadow moments only: the ink plate CTA (one offset emboss) and the map tooltip/dialog over the canvas.

### Shadow Vocabulary
- **Plate** (`inset 0 1px 0 rgb(255 255 255/0.08), 0 1px 0 #000, 0 10px 24px -14px rgb(20 19 17/0.55)`): ink CTAs only.
- **Overlay** (`0 8px 24px rgb(20 19 17/0.16), 0 2px 8px rgb(20 19 17/0.10)`): tooltip/dialog over the map.

### Named Rules
**The Rules-Not-Shadows Rule.** If a surface needs separation, it gets a rule. Shadows are reserved for the plate and true overlays.

## Shapes

Square and print-like. Tiles 2px radius (ink blocks), controls 3px, dialogs 6px. No pills anywhere; chips and swatches are square with thin ink borders. The brand mark is a square.

## Components

### Buttons
- **Primary (ink plate):** solid ink, paper text, offset emboss; transform-only press (scale 1.02/0.98, 200ms expo-out, suppressed under reduced motion)
- **Focus:** 2px ink outline with offset everywhere
- **Secondary (ghost):** transparent, rule-strong border; border darkens on hover
- **Icon-sm:** ghost, 28px, for row actions — always visible on coarse pointers

### Money Map (signature)
Squarified treemap: tiles sized by deadline closeness, shaded by the ink ramp, 2px gaps, hairline ink/20 borders for step separation. Cost is a label, not the area. In-tile: title (500), mono cost, days badge (family-tinted chip, ink 10–14% over light fills / paper 20–24% over dark). Soonest due entry = ink ring anchor (ring-2 + offset). Entrance stagger largest-first (30ms steps); rerank spring (stiffness 260 / damping 30). Tooltips flip at canvas edges; sr-only ranked list mirrors the map.

### Ledger rows
Rank in serif (01, 02…), square shade swatch (ink-bordered; full ink border when overdue), title + category, mono due date, right-stacked mono cost over days chip. Overdue rows carry a 2px ink left rule — ink weight bleeds into the row. Chip color ramps only inside the 14-day action horizon; beyond it, quiet ink-muted.

### Summary strip
Per-currency blocks: currency chip + Yearly (serif) / Next 30d / Overdue figures with 600ms count-up in mono tabular; item count right-aligned.

### Inputs
Surface fill, rule-input border (≥3:1), ink border + ink/50 ring on focus. Errors: ink border, ink text, describedby wiring.

### Departure Board (marketing demo)
Live synthetic ledger: real treemap math, full-ramp shades, rows reranking by due date, one day per 2.6s. Labeled "Synthetic"; aria-hidden; still under reduced motion.

## Do's and Don'ts

### Do:
- **Do** use ledger caps for every label voice; serif for statements; mono tabular for every mutable number.
- **Do** join panels with hairline rules; let the paper/surface steps carry depth.
- **Do** keep exactly one ink plate CTA per view.
- **Do** anchor the soonest due entry with the ink ring; let overdue read as solid ink everywhere it appears (fills, swatches, row rules, chips).
- **Do** keep field edges at ≥3:1 (rule-input), focus rings ink/50+.
- **Do** default to the ledger list under 768px with costs always visible.
- **Do** collapse all motion to instant states under `prefers-reduced-motion`.

### Don't:
- **Don't** introduce color anywhere in the UI chrome — the world is monochrome; urgency is lightness.
- **Don't** add drop shadows to panels, pills, glows, gradients, or gradient text.
- **Don't** use rounded-full buttons or chips; the vocabulary is square print.
- **Don't** pulse anything — ink is the alarm, stillness is the premium.
- **Don't** use serif for body copy or caps for sentences.
