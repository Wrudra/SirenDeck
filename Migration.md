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

### Phase 1 — Auth / identity on Blocks ✅ (platform config)

1. ~~Enable OIDC~~ **done** (`isOidcEnabled: true`).
2. ~~Register public OIDC client~~ **done** (`e6307866-…`) with platform +
   `localhost:3000` `/login/callback`. Local **HTTPS** origin still a gap.
3. Create first end user (`blocks-bootstrap` / `blocks-iam-users` first-user flow) — **pending**.
4. Identity model: **email+password only** (locked); no social IdP.
5. Data migration / user-id mapping: **deferred** (greenfield first).
6. App wiring (`@seliseblocks/client`, callback route): **pending** (implementation skill).

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
| 2026-10-06 | **Data:** greenfield on Blocks; Supabase migrate later. **Auth:** email+password only (no social). **App:** wire existing Next.js (no new scaffold). |
| 2026-10-06 | Phase 1: OIDC enabled; public PKCE client `e6307866-2c00-42c3-b94d-d63c6581c9ed`; IdP `b11b7826-3596-4480-9358-5d9cb74f30c9` with non-null authorize URL. |
| 2026-10-06 | Redirect URIs: platform domain + `http://localhost:3000` `/login/callback`. Cookie caveat documented. |
| _(open)_ | When to rewrite AGENTS.md "Stack (fixed)" — proposed Phase 5. |
| _(done-deferred)_ | Data migration strategy — deferred; greenfield first. |
| _(open)_ | Whether GitHub SirenDeck is linked in Blocks Release. |
| _(open)_ | Cutover date / DNS / whether to keep a read-only Supabase archive. |
| _(open)_ | First Blocks end-user + real login smoke test. |
| _(open)_ | Local HTTPS for Next on project domain (cookie-capable). |

---

## 8. Immediate next actions (suggested)

1. ~~Phase 1: enable OIDC + register public client~~ **DONE** (see §9).
2. **Phase 2:** `blocks init` (if needed) + draft Data Gateway schemas for
   `categories`, `items`, `reminders`, `attachments` (greenfield; ownership rules
   replacing RLS). Skill: `blocks-data-gateway-configuration`.
3. Parallel/soon: create first end user; wire Next.js auth via
   `blocks-iam-sso-oidc-implementation` + bootstrap `existing-app` flow
   (`@seliseblocks/client`, `/login/callback`, env from `.env.example`).
4. Confirm Release repo linkage: `blocks release repos list --json`.
5. Plan local HTTPS on `dblcyi-eocee.slsblx.com` for cookie-capable login tests
   (Next adaptation of `blocks-frontend-local-https`).

---


---

## 9. Phase 1 status — OIDC enable + public client (2026-10-06)

**Status: DONE** on project `D158bd535e4d44ea58e5c53146704e2ab`.

### Decisions locked this turn (user: “do what you think best”)

1. **Data:** greenfield empty on Blocks; Supabase data migrate later (or never until proven).
2. **Auth:** email+password only via Blocks hosted login — **no social IdP**.
3. **App:** wire this existing Next.js repo (do **not** scaffold a separate Blocks starter).

### Commands run (skill path: `blocks-iam-sso-oidc-configuration` + bootstrap `flows/oidc-client.md`)

Dry-run then `--yes` (user approved Phase 1):

```bash
blocks use D158bd535e4d44ea58e5c53146704e2ab

blocks auth oidc-clients save \
  --client-display-name "SirenDeck" \
  --client-type public \
  --redirect-uris "https://dblcyi-eocee.slsblx.com/login/callback,http://localhost:3000/login/callback" \
  --scope "openid profile" \
  --require-pkce --active --auto-redirect \
  --register-as-identity-provider \
  --yes --json

blocks auth config save \
  --oidc-enabled \
  --account-action-base-url "https://dblcyi-eocee.slsblx.com" \
  --yes --json
```

### Outcomes

| Check | Result |
|---|---|
| `isOidcEnabled` | **true** |
| Public OIDC client | **yes** — `clientId` / `itemId` = `e6307866-2c00-42c3-b94d-d63c6581c9ed` |
| `clientType` | `public` |
| `tokenEndpointAuthMethod` | `none` (correct for PKCE browser client) |
| `requirePkce` | `true` |
| `isAutoRedirect` | `true` |
| Redirect URIs | `https://dblcyi-eocee.slsblx.com/login/callback`, `http://localhost:3000/login/callback` |
| Linked IdP | `itemId` `b11b7826-3596-4480-9358-5d9cb74f30c9`, provider `sirendeck` / `blocks-oidc`, **active** |
| IdP `authorizationUrl` | **non-null** — `https://iam.seliseblocks.com/api/oidc/authorize?tenant_id=D158…` |
| Discovery / issuer | `https://iam.seliseblocks.com/D158bd535e4d44ea58e5c53146704e2ab` (HTTP 200 on `.well-known/openid-configuration`) |
| Social IdP | **not** configured (by design) |

`accountActionBaseUrl` after save reads as `https://iam.seliseblocks.com` (activation path `oidc/activate/`). Dry-run request carried the app domain we passed; post-save get shows the IAM host — treat IAM host as the live value for activation links unless login/activation proves otherwise.

Backend also expanded scope to `openid profile offline_access` on the stored client/IdP.

### Env template

`.env.example` now documents public Blocks vars for the Next.js app (no secrets):

- `NEXT_PUBLIC_BLOCKS_KEY`
- `NEXT_PUBLIC_BLOCKS_API_URL=https://blocksapi.slsblx.com` (same registrable domain as `*.slsblx.com` — required for session cookies)
- `NEXT_PUBLIC_BLOCKS_OIDC_URL` (issuer)
- `NEXT_PUBLIC_BLOCKS_OIDC_CLIENT_ID` (public client id above)
- `NEXT_PUBLIC_BLOCKS_OIDC_SCOPE`

Supabase vars remain for dual-run on `main` / until cutover.

### Remaining gaps (not Phase 1 blockers)

1. **App wiring** — install `@seliseblocks/client`, add `/login/callback`, AuthProvider, replace Supabase auth gradually (`blocks-iam-sso-oidc-implementation` + `existing-app` flow). Not done this turn.
2. **Local login cookies** — `http://localhost:3000` is registered for authorize redirects, but Secure session cookies will **not** stick on plain HTTP localhost. Real local login needs HTTPS on the project domain (adapt `blocks-frontend-local-https` ideas to Next, or test on `https://dblcyi-eocee.slsblx.com` once deployed).
3. **First end user** — create via `blocks-iam-users` / bootstrap first-user flow before a real login test.
4. **Phase 2** — model Data Gateway schemas for `categories` / `items` / `reminders` / `attachments` (greenfield).
5. **AGENTS.md stack conflict** — still unresolved until Phase 5 rewrite.


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
