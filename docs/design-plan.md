# SirenDeck Design Plan

## Aesthetic direction (frontend-design distilled)
Dark-first control panel for money — think flight-deck instruments, not banking dashboard.
Near-black canvas, one signal palette doing one job (urgency), generous negative space,
characterful sans for identity, tabular mono for every number. Restraint is the polish:
no gradients-for-design's-sake, no glassmorphism, no card grids that all look alike.

## Color — urgency is the only signal
Dark theme (default). All colors as CSS vars in `:root`, consumed via Tailwind theme tokens.

| Level | Meaning | Tile fill | Text on fill |
|---|---|---|---|
| calm | >90 days | teal, deep & muted | near-white |
| soon | 30–90 d | green→amber mix | near-black |
| urgent | 7–30 d | amber | near-black |
| critical | 0–7 d | orange-red | near-black |
| overdue | <0 d | red | near-white |

Surface scale (dark): `--bg: #0a0e14` (near-black), `--surface: #11161f`, `--surface-2: #171d28`,
`--border: #232b3a`, `--text: #e8ecf4`, `--text-muted: #8b94a7`.
Accent (interactive, non-urgent chrome): a desaturated cyan `#4cc2ff` used sparingly for focus/links/CTAs.
Light theme: same semantic tokens, light values (`--bg: #f7f8fa`, surfaces white, text `#171b26`;
urgency fills shift to deeper hues for contrast against light bg; text flips per fill row above).

Accessibility: every (text, fill) pair ≥ 4.5:1 (AA). Urgency never relies on color alone —
tiles always show days-left text; colorblind users still get hierarchy via size + labels.

## Typography
- **UI/display**: [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk) — characterful, geometric, techy without being Inter-generic.
- **Money/dates/mono**: [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) — tabular figures, crisp `৳`/`$`/`€` glyphs.
- Type scale (fluid where possible): display 28/34, h1 24/30, h2 20/26, body 14/21, small 13/19, tiny 12/16, mono-money 15/20.
- Numbers in tables/totals always `font-variant-numeric: tabular-nums`.

## Spacing & radii
- Scale: 4, 8, 12, 16, 24, 32, 48, 64. Base unit 4.
- Radii: tiles 10px, dialogs 16px, inputs/buttons 10px, chips 999px (pill).
- Borders: 1px `--border`; hairline dividers at 10% opacity of `--text`.

## Elevation & depth
Flat, instrument-like. Shadows only for true overlays (dialog, popover, toast):
`0 8px 24px rgb(0 0 0 / 0.35), 0 2px 8px rgb(0 0 0 / 0.25)`.
Tiles use border emphasis + lift scale on hover, not shadows.

## Motion tokens (Motion, `motion/react`)
| Token | Spring | Use |
|---|---|---|
| `snappy` | stiffness 500, damping 35, mass 1 | hover lift, chip taps, toggles |
| `smooth` | stiffness 260, damping 30, mass 1 | tile reflow, shared-element expand |
| `gentle` | stiffness 120, damping 24, mass 1 | page/dialog enter, count-ups |
| duration 150ms | — | hover/focus color/opacity transitions |

- Initial tile entrance: staggered `smooth` spring, scale+opacity from each tile's own center, largest-first, 30ms stagger cap.
- Tile reflow on filter change: Motion `layout` + `layoutId` shared elements — sizes/positions spring, never width/height tweens.
- Removed tiles: fade+scale-out 150ms; new tiles scale-in.
- Urgency pulses: soon = faint glow (opacity 0.15↔0.3, 2.4s); urgent = slow pulse (scale 1↔1.01, 1.8s);
  critical = faster pulse (1.2s); overdue = red edge shimmer (border-color oscillation, 1s).
  ALL pulse animation disabled under `prefers-reduced-motion` — instant states, simple fades only.
- Count-up numbers on the summary strip: `gentle` spring, format with tabular nums.

## The Money Map — visual rules
- Treemap via `d3-hierarchy` squarified, rendered as absolutely-positioned React elements driven by Motion layout.
- Tile anatomy: category icon (16px, 60% opacity) · title (small, truncate 2 lines) · money in mono · days-left pill.
- Labels hidden below ~90×48px; tooltip + focus reveal full info. Screen-reader mirror list under the map.
- Unpriced shelf: fixed-size chips (urgency-colored border-left, dark surface) under the map, "Add cost" quick action.
- Summary strip: total yearly cost / next-30-days cost / overdue cost / item count, count-up on change.
- Long tail: cap 40 tiles; remainder merges into "Other (N)" tile, expands on click.
- Grouping toggle (Flat / By category): nested treemap, category headers with totals in mono.

## Components inventory (shadcn primitives only)
`Dialog` (item detail/add-edit), `Input`, `DropdownMenu` (filters, snooze presets), `Toast`.
Everything else hand-built on Tailwind + Motion: tile, shelf, summary strip, filter bar.

## Anti-generic checklist (taste-skill distilled)
- No default Inter; no purple gradients; no uniform 3-col card grid; no giant hero.
- The treemap IS the hero. Chrome (top bar, filters) recedes: small, muted, quiet.
- Every element earns its place — if it doesn't answer "what renews soon and what does it cost", it's decoration. Cut it.
