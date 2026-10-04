# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Fixed by AGENTS.md — Next.js (App Router) + TypeScript strict (pnpm), Tailwind CSS v4 + shadcn/ui primitives, Motion (`motion/react`) as the only animation library, `d3-hierarchy` for treemap math only, Supabase (Auth, Postgres + RLS, Edge Functions, pg_cron), Zod validation, deployed on Vercel. No AI/vector features in v1.

## Users

Early-career professionals (BD market, first-salary stage) juggling many small recurring obligations — subscriptions, insurance, domains, warranties, licenses, bills, passports/visas — across multiple apps and papers. Solo, personal use; one user = one board. Secondary: anyone with more renewals than memory.

## Product Purpose

SirenDeck tracks everything that expires, renews, or comes due. Success means one glance answers: *what renews soon, and what does it cost me?* The signature view is the **Money Map** — a treemap where each rectangle is a deadline, sized by yearly cost, shaded by urgency, backed by a ranked board list.

## Positioning

A departure board for money: deadlines ranked by days-left and priced by yearly cost in a single treemap/ledger mechanism. A neighboring subscription tracker cannot truthfully copy the glance — it ships category-and-card lists, not a cost-weighted urgency canvas.

## Operating Context

- Email + password auth (magic link / OAuth dropped for v1).
- Default currency BDT (৳) at the DB level; per-item override exists; a settings page is future work.
- Views: Money Map (treemap) and Board (ranked list); filters by category/urgency; item form dialog; unpriced shelf for items without cost.
- Reminders via Edge Function + pg_cron are planned, not shipped.
- Deploy target: Vercel; hosted Supabase project; migrations in `supabase/migrations/` are the source of truth.

## Capabilities and Constraints

- Items CRUD with server actions; Zod-validated input; RLS on every table (`user_id = auth.uid()`).
- Five urgency levels (calm → soon → urgent → critical → overdue) derived from days-until-due.
- Yearly cost normalization per item; per-currency summary figures.
- No testimonials, no customer logos, no commercial claims that can't be evidenced — the live mechanism itself is the proof.
- `prefers-reduced-motion` must collapse all motion to instant states.

## Brand Commitments

- Name: **SirenDeck**. Voice: instrument-precise, no fluff; money and dates always in tabular figures.
- Pinned by the owner (binding): **fully monochrome** — urgency encoded by lightness/texture only, no hue anywhere; **premium-heavy** finish; **modern 2026 type**; **smooth transitions and purposeful animation**.
- The five-step urgency ramp (as lightness steps), the one-lit-element-per-view rule, and the treemap mechanism are durable commitments that survive any visual-world change.

## Evidence on Hand

- A working app: landing with a live synthetic treemap demo (real layout math, labeled synthetic), auth flow, protected app shell, Money Map + Board views — verified at 1440px and 390px.
- Test account `test-086@dls.dev` with 8 seeded items spanning the full urgency ramp including one overdue item — useful for visual verification; throwaway, to be deleted later.
- No press, testimonials, or case studies exist. None may be invented.

## Product Principles

1. **The glance wins** — every screen must answer "what's leaving soon and what does it cost" before anything else.
2. **Weight is truth** — visual emphasis (size, lightness) always encodes real data: cost and urgency, never decoration.
3. **One lit element per view** — a single highest-emphasis action or anchor; everything else recedes into ink.
4. **Numbers wear mono** — every mutable figure is tabular and stable under change.
5. **Motion earns its place** — one authored signature moment; transitions smooth but never decorative noise.

## Accessibility & Inclusion

- WCAG 2.1 AA text contrast on every panel pairing (the monochrome ramp must hold ≥4.5:1 for body-size text; large text ≥3:1).
- Full keyboard operability; visible 2px porcelain focus treatment.
- `prefers-reduced-motion`: instant layout, no pulses, simple fades.
- Treemap mirrored by an sr-only list; urgency never conveyed by color/hue alone (position + label + lightness).
