# SirenDeck → Blocks OS Migration Notebook

Living notes for migrating SirenDeck off Vercel + Supabase onto SELISE Blocks OS
via the Blocks CLI, while keeping `main` as the production Vercel/Supabase line.

**Last updated:** 2026-10-06 (Asia/Dhaka)

---

## 1. Goal

Migrate SirenDeck completely to Blocks OS:

| Concern | Today (`main`) | Target (`dev` → Blocks) |
|---|---|---|
| Hosting | Vercel | Blocks Release / platform subdomain |
| Auth | Supabase Auth (email+password) | Blocks IAM + hosted SSO/OIDC |
| Database | Supabase Postgres + RLS | Blocks Data Gateway schemas + rules |
| Storage | Supabase Storage | Blocks storage config + data-storage |
| Edge / cron | Edge Function `send-reminders` + pg_cron | Blocks Workflow (schedule/webhook) and/or Notifier/Mail |
| Secrets | Vercel env + Supabase Vault | Blocks Secrets |
| i18n | (none / hard-coded) | Blocks Localization (en-US, bn-BD useful) |

**Hard constraint:** `main` stays the live Vercel/Supabase production line.
All migration work happens on branch `dev` only. Push only `origin/dev`.
Never checkout/commit/push `main` for this work. No PR to `main` unless asked.

---

## 2. Working model

```
main  ── production (Vercel + Supabase) — DO NOT TOUCH for migration
  │
  └── dev ── Blocks OS migration line — push origin/dev only
```

- Branch: `dev`, tracking `origin/dev`
- Commits: owner-authored only — **no** `Co-authored-by`, no AI attribution
- Agents for this install: cursor, codex, gemini, copilot
- Skill fronts: empty (all four read `.agents/skills/` natively)
- Instruction pointer: `GEMINI.md` only
- Reporting: `opt-out` (`.agents/skills/.blocks-reporting`)
- Portal (account/env extras only): https://os.seliseblocks.com
- Project key (dev env): `D158bd535e4d44ea58e5c53146704e2ab`

---

## 3. Bootstrap status (Steps 0–8 done 2026-10-06)

### Installed

- **22 skills** vendored under `.agents/skills/` from
  `https://github.com/SELISEdigitalplatforms/blocks-cli.git` @ `main`
  (`skills_commit=e2f3919ca12184766a30b05a242b4116551faef6`)
- Rules from
  `https://github.com/SELISEdigitalplatforms/blocks-skills.git` @ `main`
  (`rules_commit=3e36ede8aac902b875512e5ae14e04df1b5410bb`)
- Stamp: `.agents/skills/.blocks-skills-source`
- Reporting: `reporting=opt-out`
- Step 7 verify: **clean** (markers 1/1 on AGENTS.md + GEMINI.md; no
  `distributable` leak; skill count matches manifest; no front mismatches)
- Mismatches: none named-without-dir; none dir-unrouted

### Skill list

`blocks-bootstrap`, `blocks-captcha`, `blocks-data-gateway-configuration`,
`blocks-data-gateway-crud`, `blocks-data-storage`, `blocks-frontend-local-https`,
`blocks-iam-access-control`, `blocks-iam-account`, `blocks-iam-mfa`,
`blocks-iam-organizations`, `blocks-iam-sso-oidc-configuration`,
`blocks-iam-sso-oidc-implementation`, `blocks-iam-users`,
`blocks-localization-configuration`, `blocks-localization-implementation`,
`blocks-mail`, `blocks-notification`, `blocks-notifier`,
`blocks-release-deployment`, `blocks-secrets`, `blocks-storage-configuration`,
`blocks-workflow`

### Agents / fronts

| Agent | What it got |
|---|---|
| cursor | `.agents/skills/` + `AGENTS.md` Blocks block (native) |
| codex | same |
| gemini | same + `GEMINI.md` pointer |
| copilot | same |

Skill-front stubs: none (skill-fronts empty by design).

### AGENTS.md — APPEND + SURFACE conflict

Existing unmarked `AGENTS.md` is SirenDeck project rules (Supabase/Vercel stack).
Step 3 **appended** the Blocks marker block at the end; did **not** overwrite.

**SURFACE conflict (do not resolve silently):**

- Top of `AGENTS.md` says: **Stack (fixed — do not substitute)** including
  Supabase Auth/Postgres/RLS/Storage/Edge/pg_cron and **Deploy: Vercel**.
- Appended Blocks section routes work to Blocks IAM / Data Gateway / Release /
  Storage / Workflow skills — which **contradict** the fixed-stack rule.

Until the stack section is rewritten as part of a deliberate cutover, agents
must treat:

1. **`main` / current app code** → follow the original Supabase+Vercel rules.
2. **Blocks migration work on `dev`** → follow the SELISE Blocks section and
   vendored skills; do not invent parallel stacks.

Unresolved: when to rewrite the top-of-file "Stack (fixed)" section (likely
near cutover, not day one).

Unrelated and left alone: `.github/skills/impeccable`, `.kilo/`.

---

## 4. Current stack inventory vs Blocks target

### SirenDeck today (repo on `dev`, still Supabase-shaped)

- **App:** Next.js **16.3.8** App Router, React 19.2.8, TypeScript, pnpm 12.8.1
- **UI:** Tailwind 4, shadcn/ui primitives, Motion, d3-hierarchy (treemap math)
- **Auth:** Supabase email+password via `@supabase/ssr` + `@supabase/supabase-js`
  (`src/lib/supabase/{client,server,middleware,env,require-user}.ts`)
- **DB:** Postgres migrations in `supabase/migrations/`
  - `categories`, `items`, `reminders`, `attachments` — all RLS `*_own` on `user_id`
  - money as `numeric`, due dates as `date`, default currency BDT
- **Reminders:** Edge Function `send-reminders` + `pg_cron` hourly + Vault secrets
- **Env:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Deploy:** Vercel (`.vercel/` present)
- **Product:** personal life-admin / Money Map treemap of renewals & costs

### Blocks project brief (Step 9 — key `D158…`)

| Field | Value |
|---|---|
| Name | **SirenDeck** |
| Tenant / key | `D158bd535e4d44ea58e5c53146704e2ab` |
| Environment | `dev` |
| App domain | `https://dblcyi-eocee.slsblx.com` (PlatformSubdomain, verified) |
| Cookie domain | `slsblx.com` |
| Created | 2026-10-05 ~09:26 UTC |
| Other reachable projects | Many (Demo UILM, Ripple OS, Sunrise Spiral Prize Race, PathaoPoth, Blocks Mono Monet, SELISE_HRM shared, Geo Assessment OS shared, Sun is rising, …) — do not touch |
| OIDC clients | **none** (`oIDCClientCredentials: []`) |
| `isOidcEnabled` | **false** — app hosted login will not work until enabled + client registered |
| Data schemas | **empty** (`totalCount: 0`) — greenfield modelling |
| Languages | `en-US` (default), `de-DE`, `bn-BD` |

CLI session: project mode refreshed OK; `blocks use D158…` succeeded. No device-code login needed this run (project RT was recoverable).

### Mapping (high level)

| Supabase piece | Blocks skill / surface |
|---|---|
| Auth email/password + session cookies | `blocks-iam-sso-oidc-*`, `blocks-iam-users`, `blocks-iam-account`; need `isOidcEnabled=true` + public OIDC client; local HTTPS via `blocks-frontend-local-https` |
| Postgres tables + RLS | `blocks-data-gateway-configuration` (schemas/rules) + `blocks-data-gateway-crud` (SDK) — **RLS ≠ Blocks rules; rewrite policies** |
| Storage attachments | `blocks-storage-configuration` + `blocks-data-storage` |
| Edge Function + pg_cron reminders | `blocks-workflow` (schedule) and/or `blocks-mail` / `blocks-notifier` / `blocks-notification` |
| Vercel env secrets | `blocks-secrets` |
| Vercel deploy | `blocks-release-deployment` |
| (future) BN/EN copy | `blocks-localization-*` (bn-BD already on project) |

---

## 5. Proposed migration phases

Mark **UNKNOWN** where we still need user decisions or deeper skill study.

### Phase 0 — Bootstrap + notebook (this commit) ✅

Skills installed, `Migration.md` started, project selected, brief captured.

### Phase 1 — Auth / identity on Blocks

1. Enable OIDC on the SirenDeck project (`isOidcEnabled` currently false) —
   via `blocks-iam-sso-oidc-configuration`.
2. Register a **public** OIDC client with redirect
   `https://dblcyi-eocee.slsblx.com/login/callback` **and** the local HTTPS
   origin once certs exist (`blocks-frontend-local-https`).
3. Create first end user (`blocks-bootstrap` / `blocks-iam-users` first-user flow).
4. Decide identity model: keep email+password via Blocks hosted login vs add
   social IdP later (v1 on Supabase dropped Google — likely stay simple).
5. **UNKNOWN:** How Blocks user ids map from Supabase `auth.users` uuids for
   data migration; whether password hashes can transfer (almost certainly
   **not** — expect re-invite / reset).

### Phase 2 — Data schema on Blocks

1. Author schemas for `categories`, `items`, `reminders`, `attachments` under
   `blocks/data/schemas/` via `blocks-data-gateway-configuration`.
2. Express ownership rules as Blocks data rules (replacement for RLS
   `user_id = auth.uid()`).
3. Reload schema; verify with `blocks data schema list`.
4. **UNKNOWN:** type mapping (`numeric`, `date`, CHECKs, partial indexes);
   attachment binary strategy (object storage path prefix `{user_id}/`).
5. **UNKNOWN:** whether to run `blocks init` first to scaffold folders.

### Phase 3 — App wiring (dual-client period on `dev`)

1. Add Blocks client SDK / env beside existing Supabase clients (feature flag
   or route-level switch) — **do not remove Supabase yet**.
2. Wire login callback pages to Blocks OIDC (`blocks-iam-sso-oidc-implementation`).
3. Port Money Map reads/writes to Data Gateway CRUD.
4. Port attachments to Blocks storage.
5. Keep UI (Motion/treemap) intact — UI is stack-agnostic.

### Phase 4 — Reminders / background work

1. Replace Edge Function + pg_cron with Blocks Workflow schedule calling Mail
   or Notifier.
2. **UNKNOWN:** exact event model; email provider already on Blocks vs need Mail
   config; REMINDER_MODE log-vs-send parity.

### Phase 5 — Remove Supabase clients (on `dev` only)

1. Delete `@supabase/*` deps, `src/lib/supabase/*`, middleware session refresh
   for Supabase.
2. Stop reading `NEXT_PUBLIC_SUPABASE_*`.
3. Leave `supabase/` migrations in git history as reference until cutover;
   optionally archive under `docs/legacy-supabase/`.
4. Rewrite AGENTS.md top "Stack (fixed)" section to Blocks — resolves SURFACE
   conflict.

### Phase 6 — Deploy on Blocks + cutover

1. `blocks release` setup/deploy for the SirenDeck repo/branch `dev` (or a
   release branch) — **UNKNOWN:** whether GitHub repo is already linked in
   Blocks Release portal.
2. Confirm OIDC redirect URIs include production domain.
3. Dual-run: Vercel `main` stays live; Blocks `dev` domain used for soak.
4. Cutover decision (DNS / users / data) — **user call**, not agent default.
5. Only then consider PR `dev` → `main` (explicit ask required).

---

## 6. Risks

| Risk | Why it matters | Mitigation ideas |
|---|---|---|
| **Data migration** | Existing Supabase rows must land in Blocks schemas with new user ids | Export scripts; map old `user_id` → new Blocks user; dry-run on empty project first |
| **RLS vs Blocks policies** | Semantics differ; a naive port can leak or lock out | Rewrite rules from product intent, not SQL 1:1; test isolation early |
| **Password / session transfer** | Users likely cannot keep Supabase passwords | Re-invite / forced reset; communicate before cutover |
| **OIDC not enabled** | `isOidcEnabled=false` + zero clients → login scaffolding would be dead | Phase 1 first, before UI work |
| **Env / secrets** | Service role, Vault, Vercel envs must not leak into git | Use `blocks-secrets`; never commit values; rotate after dual-run |
| **Dual-running main vs dev** | Two backends, two truths, accidental writes to prod | Strict branch rules; no shared write keys on `dev` pointing at prod Supabase if possible |
| **Reminders gap** | Missing cron during cutover = missed renewal emails | Keep Supabase cron until Blocks workflow proven; log-mode first |
| **AGENTS.md conflict** | Agents may follow wrong stack | This notebook + explicit phase gates; rewrite stack section at Phase 5 |
| **Release repo link** | Deploy may fail if GitHub not connected in portal | Check `blocks release repos list` before promising deploy dates |
| **Scope creep from other tenants** | Account can see many projects | Always `blocks use D158…`; never mutate other tenants |

---

## 7. Decision log

| When (Asia/Dhaka) | Decision |
|---|---|
| 2026-10-06 | Agents: cursor, codex, gemini, copilot. Skill-fronts empty. Instruction-front: GEMINI.md only. Reporting: opt-out. |
| 2026-10-06 | First Blocks skills install (no prior stamp). Append Blocks block to existing AGENTS.md; surface stack conflict. |
| 2026-10-06 | Branch strategy: all migration on `dev` / `origin/dev`; `main` untouched as Vercel/Supabase prod. |
| 2026-10-06 | Project selected: SirenDeck `D158bd535e4d44ea58e5c53146704e2ab` (dev). Domain `https://dblcyi-eocee.slsblx.com`. |
| 2026-10-06 | Auth probe: project RT recoverable → `blocks auth refresh --project`; no interactive login needed. |
| 2026-10-06 | Brief: no OIDC clients; `isOidcEnabled=false`; zero data schemas; languages en-US / de-DE / bn-BD. |
| _(open)_ | When to rewrite AGENTS.md "Stack (fixed)" — proposed Phase 5. |
| _(open)_ | Data migration strategy for existing Supabase users/rows. |
| _(open)_ | Whether GitHub SirenDeck is linked in Blocks Release. |
| _(open)_ | Cutover date / DNS / whether to keep a read-only Supabase archive. |

---

## 8. Immediate next actions (suggested)

1. Phase 1: enable OIDC + register public client for `dblcyi-eocee.slsblx.com`
   (and later local HTTPS origin).
2. `blocks init` (if needed) + draft Data Gateway schemas from the four tables.
3. Confirm Release repo linkage: `blocks release repos list --json`.
4. User questions (need answers before deep app wiring):
   - Migrate existing Supabase data, or greenfield empty on Blocks?
   - Keep email+password only, or add social IdP?
   - Preferred first deploy path: scaffold new Blocks web app vs wire this
     Next.js repo as "existing app"?

---

## Appendix — bootstrap provenance (stamp excerpt)

```
rules_repo=https://github.com/SELISEdigitalplatforms/blocks-skills.git
rules_ref=main
rules_commit=3e36ede8aac902b875512e5ae14e04df1b5410bb
skills_repo=https://github.com/SELISEdigitalplatforms/blocks-cli.git
skills_ref=main
skills_commit=e2f3919ca12184766a30b05a242b4116551faef6
agents=cursor codex gemini copilot
skill_fronts=
instruction_fronts=GEMINI.md
reporting=opt-out
```

CLI: `@seliseblocks/cli-os` **0.8.0** (latest).
