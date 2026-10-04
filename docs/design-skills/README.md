# Design skills — the golden standard

The ONLY design-skills standard for this project. Two sources, both MIT:

| Source | License | Local copy |
|---|---|---|
| [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills) (© 2026 MC Dean) | MIT | `owl-listener/` — curated 16 of 111 skills |
| [elayadesign/ai-design-skills](https://github.com/elayadesign/ai-design-skills) (© 2026 Elaya) | MIT | `elayadesign/` — `landing-page-design` (full skill) |

Anything design-related not covered here is decided by reading the relevant
SKILL.md below — or fetching the sibling skill from the upstream repo — never
from other design guideline sources.

## owl-listener/ (curated for SirenDeck's Money Map work)

- **ui-design**: `data-visualization`, `color-system`, `typography-scale`, `spacing-system`, `visual-hierarchy`, `dark-mode-design`, `readable-measure`
- **interaction-design**: `form-design`, `loading-states`, `feedback-patterns`, `error-handling-ux`, `search-ux`, `micro-interaction-spec`
- **design-systems**: `motion-system`, `accessibility-audit`
- **visual-critique**: `critique-visual-hierarchy` (drives the per-phase audit)

## elayadesign/

- `landing-page-design` — login/landing surfaces and any marketing page.

## SirenDeck palette context

SirenDeck ships TWO palettes in [src/app/globals.css](/Users/rudratahsin/Developer/SirenDeck/src/app/globals.css). Each surface uses exactly one.

| Palette | Variables | Surface | Aesthetic |
|---|---|---|---|
| Warm paper | `--urgency-*` (5-step grayscale), `--ink-*`, `--paper-*` | Login, signup, top bar, ledger cards, dialogs, marketing chrome, all "Ink Ledger" surfaces | Premium heavy monochrome on warm paper |
| Heatmap | `--heat-bg`, `--heat-rule`, `--heat-ink`, `--heat-ink-muted`, `--heat-calm/soon/urgent/critical/overdue` | Money Map canvas, its loading skeleton, the marketing DepartureBoard demo, and the map tooltip | TradingView stock-heatmap style — dark surface, green→red gradient, white text, hairline dividers |

When designing or auditing either surface, apply the same per-phase
`critique-visual-hierarchy` + `accessibility-audit` audits — but read the
palette in the file, not assume the warm-paper defaults. Mixing palettes
on one surface is a bug.

The `--heat-*` palette is intentionally outside `ui-design/color-system`:
it is a single-surface accent borrowed from financial heatmap conventions,
not a general-purpose system.

## Updating

Re-copy the SKILL.md files from upstream when they change; keep the folder
list above in sync. Do not add skills from other collections.
