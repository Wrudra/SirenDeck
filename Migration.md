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

### Phase 2 — Data schema on Blocks ✅ (model + User access; row RLS gap)

1. ~~Author schemas~~ **done** (`Category`, `Item`, `Reminder`, `Attachment`).
2. Ownership: User-level schema access **done**; CreatedBy row policies **pending**.
3. ~~Reload / list~~ **done** (`totalCount: 4`).
4. Type mapping chosen (see §10); attachment binaries still later.
5. ~~`blocks init`~~ **done**.

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
| 2026-10-06 | Phase 2: schemas Category/Item/Reminder/Attachment live; User-level security; Next OIDC callback wired. |
| 2026-10-06 | Invited rudra483haque@gmail.com (`7196bfb4-…`) clouduser, PendingVerification. |
| 2026-10-06 | CreatedBy ownership policies on all 4 schemas (READ/EDIT/DELETE Custom; WRITE User). |
| _(open)_ | User must activate via email, then smoke-test Blocks login. |
| _(open)_ | Local HTTPS for Next on project domain (cookie-capable). |

---

## 8. Immediate next actions (suggested)

1. ~~Phase 1 OIDC~~ **DONE** (§9).
2. ~~Phase 2 schemas + auth wiring~~ **DONE** (§10).
3. ~~First user invite + CreatedBy ownership~~ **DONE** (§11) — activation pending.
4. **Activate** invite for rudra483haque@gmail.com; smoke-test login on platform HTTPS domain.
5. **Phase 3:** flip Money Map to Blocks data helpers; seed categories; validations.
6. Confirm Release repo linkage: `blocks release repos list --json`.

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

---

## 10. Phase 2 status — schemas + Next auth wiring (2026-10-06)

**Status: DONE (platform schemas + incremental auth wiring).** Real end-user login still needs a first IAM user + HTTPS cookie path.

### Decisions (locked)

1. Greenfield data — no Supabase migrate yet.
2. Email+password only (hosted Blocks login) — no social IdP.
3. Wire existing Next.js app — do not scaffold a separate starter.

### Data Gateway

**Data source:** Blocks-managed storage (`blocks data config get` → `dbConnectionString: default`).

**Init:** `blocks init` created `blocks.json`, `blocks/data/rules.json` (`.env.example` already existed).

**Schemas pushed** (order Category → Item → Reminder → Attachment) via:

```bash
blocks data validate --json
blocks data sync --dry-run --json
blocks data sync --yes --json
```

First push failed without `collectionName` (`Collection_Name_Is_Required`). Added names matching project pattern `blx_{SchemaName}s`, then sync succeeded.

| Schema | Collection | Schema id | App fields (excl. platform) |
|---|---|---|---|
| Category | `blx_Categorys` | `aceebc8f-a71d-4946-b725-49cb88ca38b4` | name, color, icon |
| Item | `blx_Items` | `a1b87a6c-7349-4e48-93d1-24d29854feaa` | categoryId, title, notes, dueDate, status, recurrence, autoRenews, amount, currency, snoozedUntil, completedAt |
| Reminder | `blx_Reminders` | `ec581973-f247-445d-b0cc-32533141b108` | itemId, daysBefore, sentAt |
| Attachment | `blx_Attachments` | `d27a6302-5463-48b8-94b0-1695687d7121` | itemId, storagePath, filename, mimeType, sizeBytes |

Platform system fields (do **not** define in schema JSON): `ItemId`, `CreatedDate`, `CreatedBy`, `LastUpdatedDate`, `LastUpdatedBy`, `Language`, `OrganizationId`, `Tags`.

#### Field mapping (Supabase → Blocks)

| Supabase | Blocks |
|---|---|
| `id` uuid PK | `ItemId` (platform) |
| `user_id` / RLS `auth.uid()` | `CreatedBy` (platform) + access rules |
| `created_at` / `updated_at` | `CreatedDate` / `LastUpdatedDate` |
| `categories.name/color/icon` | `Category.name/color/icon` (String) |
| `items.category_id` | `Item.categoryId` (String id ref) |
| `items.title/notes` | `Item.title/notes` (String) |
| `items.due_date` date | `Item.dueDate` (DateTime; date-only semantics in app) |
| `items.status/recurrence/currency` | String enums (same values; enforce via validation later) |
| `items.auto_renews` | `Item.autoRenews` (Boolean) |
| `items.amount` numeric | `Item.amount` (**String** decimal — avoid Float drift) |
| `items.snoozed_until` / `completed_at` | `Item.snoozedUntil` / `completedAt` (DateTime) |
| `reminders.item_id/days_before/sent_at` | `Reminder.itemId` / `daysBefore` (Int) / `sentAt` |
| `attachments.*` | `Attachment.*` metadata; binaries → Blocks storage later |

#### Ownership / RLS replacement

- Create path auto-granted **Public** access (`makeSchemaPublic`); we immediately deployed **User** (authenticated) schema access for READ/WRITE/EDIT/DELETE on all four schemas via `blocks/data/rules.json` → `security[]` → `blocks data rules deploy`.
- **Row-level “own rows only” (`CreatedBy == current user`)** Custom policies were **not** invented: `ruleGroup` JSON shape is not documented in installed skills/CLI. **Gap:** until Custom `CreatedBy` policies are verified (portal Data access UI or a pulled example policy), any authenticated user who can hit the gateway can read/write all rows. Treat as **Phase 2.1 security hardening** before production data.
- App-layer filters on `CreatedBy` are a temporary defense, not a substitute.

Local files: `blocks/data/schemas/*.json`, `blocks/data/rules.json`, `blocks.json`.

### Next.js auth wiring (incremental)

Installed `@seliseblocks/client@0.2.0`.

| File | Role |
|---|---|
| `src/lib/blocks/config.ts` | Reads `NEXT_PUBLIC_BLOCKS_*`; `isBlocksLoginConfigured()`; `NEXT_PUBLIC_AUTH_PROVIDER` |
| `src/lib/blocks/client.ts` | Single `createBlocksClient` singleton |
| `src/lib/blocks/auth.ts` | `startLogin` / `completeLogin` / `fetchSessionClaims` / `logout` |
| `src/lib/blocks/auth-token.ts` | Optional bearer cache (cookie flow is primary) |
| `src/lib/blocks/jwt.ts` | Minimal JWT helpers |
| `src/components/blocks-auth-provider.tsx` | Client session status/claims |
| `src/components/blocks-login-button.tsx` | “Continue with Blocks” → `redirectToProvider` |
| `src/app/login/callback/page.tsx` | OIDC callback (`/login/callback`) |
| `src/app/layout.tsx` | Wraps tree in `BlocksAuthProvider` |
| `src/app/login/page.tsx` | Blocks button when configured; Supabase form when preferred/fallback |

`.env.example` documents Blocks public vars + `NEXT_PUBLIC_AUTH_PROVIDER=blocks`.

Supabase clients/routes remain for dual-run; Money Map data still Supabase/empty — not switched to Data Gateway CRUD yet.

### First end user

- `blocks iam users list` → **0 users**.
- Mail **is** configured (Default SMTP) → prefer invite-without-password path.
- **Not created this turn** — need the user’s chosen email + role confirmation.

```bash
blocks mail config list --json                    # already OK
blocks iam roles list --json
blocks iam roles assignable --json
blocks iam email available "<email>" --json
blocks iam users create --email "<email>" --roles "<role>" --dry-run --json
# then --yes after approval
```

Portal alternative: https://os.seliseblocks.com (Users) then verify with `blocks iam users list`.

### Remaining gaps

1. First IAM user + real login smoke test on `https://dblcyi-eocee.slsblx.com` (or local HTTPS).
2. Local cookie caveat: `http://localhost:3000` callback is registered but Secure cookies will not stick.
3. Custom `CreatedBy` row policies (portal / verified ruleGroup).
4. Field validations (title length, status enum, amount regex, sizeBytes max).
5. Wire Money Map CRUD to `blocksClient.data.collection("Item"|…)` (Phase 3).
6. Default category seed (was Supabase trigger on signup) → app or workflow after first login.
7. Attachments binary storage config.
8. AGENTS.md stack conflict still open.

---

## 11. Phase 2.1 — first user + CreatedBy ownership (2026-10-06)

### First end user

```bash
blocks iam email available "rudra483haque@gmail.com" --json   # isAvailable: true
blocks iam roles list / assignable --json                     # only clouduser
blocks iam users create --email "rudra483haque@gmail.com" \
  --roles "clouduser" --dry-run --json
blocks iam users create --email "rudra483haque@gmail.com" \
  --roles "clouduser" --yes --json
```

| Field | Value |
|---|---|
| User id | `7196bfb4-3a49-41e8-8626-2c124735d243` |
| Email | `rudra483haque@gmail.com` |
| Role | `clouduser` (only assignable / least privilege available) |
| Password | **not** set by CLI — invite-without-password |
| State | `PendingVerification` (`active: false`, `isVerified: false`) |

**Email behavior:** project mail config **Default** is present (SMTP). Invitation/activation mail should be delivered with a one-time code. User completes setup via hosted activation (`POST /iam/v4/auth/activate` with code + password + name) — typically by opening the link in the email, which lands on `accountActionBaseUrl` / `oidc/activate/`. Then sign in via app “Continue with Blocks”.

Until activation completes, OIDC login will not succeed for this account.

### CreatedBy ownership (CLI — no portal required)

Discovered `ruleGroup` shape via API validation errors (skills did not document it):

```json
{
  "combinator": "and",
  "rules": [{
    "leftSource": 1,
    "leftOperand": "UserID",
    "operator": 0,
    "rightSource": 2,
    "rightOperand": "CreatedBy"
  }]
}
```

Enums (discovered): `ConditionSource` Auth=1 SchemaField=2; `PolicyOperator` equal=0.
Pulled policies normalize `combinator` → `logicalOperator: 0`.

**Applied to Category, Item, Reminder, Attachment:**

| Operation | Access level | Policy |
|---|---|---|
| WRITE (create) | User / all logged-in (`1`) | none — platform stamps `CreatedBy` |
| READ / EDIT / DELETE | Custom (`3`) | `*_own_createdby` allow when Auth.UserID == Schema.CreatedBy |

Verified with `blocks data rules policy get <Schema>` — 3 policies each.
`blocks data schema aggregation` shows R/E/D=3, W=1.

Local: `blocks/data/rules.json` holds 12 policies + 16 security rows.

**Portal alternative** (if CLI ever unavailable): Data Gateway → schema → Schema Access → set View/Edit/Delete to **Custom** → Add rule: Auth **UserID** **equal** Schema Field **CreatedBy** → Publish. Create stays **All Logged In**. Docs: https://docs.seliseblocks.com/os/data-gateway

### Money Map wiring (started, not flipped)

- Added `src/lib/blocks/data.ts` — `listCategories` / `listItems` / `createCategory` / `createItem` via `blocksClient.data.collection`, mappers to existing `CategoryRow`/`ItemRow`.
- `NEXT_PUBLIC_DATA_PROVIDER=supabase` (default) — app page + server actions still Supabase.
- Flip to `blocks` only after activation + HTTPS cookie login smoke test.

### Remaining (superseded by §12)

User activated; Money Map dual-path + seed shipped in §12. Still open: full Item form CRUD (not just sample create), field validations, attachments, reminders.

---

## 12. Phase 2.2 — activation, Blocks app path, Money Map flip (2026-10-06)

### User state (CLI)

```bash
blocks iam users list --email "rudra483haque@gmail.com" --json
```

| Field | Value |
|---|---|
| User id | `7196bfb4-3a49-41e8-8626-2c124735d243` |
| `active` | `true` |
| `isVerified` | `true` |
| `accountState` | `Active` |
| Password | **never** stored in repo / Migration / env files — agent uses `SIREN_EMAIL` / `SIREN_PASS` env vars only for smoke tests |

### App dual-path (this commit)

| Path | Behavior |
|---|---|
| `NEXT_PUBLIC_AUTH_PROVIDER=blocks` | `(app)/layout` → `BlocksAppShell` (client session gate); no Supabase `requireUser` |
| `NEXT_PUBLIC_DATA_PROVIDER=blocks` | `/app` → client Money Map; `getOrSeedCategories` + `listItems` via Data Gateway |
| Supabase modes | unchanged server layout + page |

Also: `src/proxy.ts` skips Supabase cookie refresh when auth provider is `blocks` (Blocks-only deploys omit Supabase env). Home page soft-guards missing Supabase.

### Seed

`src/lib/blocks/data.ts` → `getOrSeedCategories()` inserts the same six defaults as Supabase `categories.ts` when the user’s Category collection is empty.

### Item CRUD (minimal)

Client “Add sample item” calls `createItem` against Blocks. Full `ItemFormDialog` / server actions still Supabase-only — enough for empty/seeded map load.

### Release / domain

Linked repo `Wrudra/SirenDeck` @ `dev` → `https://dblcyi-eocee.slsblx.com`. First deploy uses `blocks release setup` (not `deploy`) with Azure West Europe `1 GiB` machine config id `68613e09565ac4e84078386e`, public NEXT_PUBLIC_* secrets sync (no passwords), `--register-callback`.

### Smoke test (env-only credentials)

Playwright/browser against `https://dblcyi-eocee.slsblx.com/login` with `SIREN_EMAIL` / `SIREN_PASS` in the shell environment only. Never write those values to disk, git, Migration, or memory.

### What’s live where

| Concern | Blocks domain (`dev`) | Still Supabase (`main` / dual-run) |
|---|---|---|
| Hosting | Blocks Release subdomain (after setup) | Vercel |
| Auth | Blocks OIDC (when secrets + deploy succeed) | Supabase Auth |
| Categories / Items | Data Gateway when `DATA_PROVIDER=blocks` | Postgres + RLS |
| Full item form / reminders / attachments | not yet | yes on `main` |

### Release note (build #1 failed)

First `blocks release setup` build `d1965cc6-67b4-4a44-b7f2-b61c2c072c12` **Failed**:
kaniko `error resolving dockerfile path` — repo had no `Dockerfile`.
Fix: add multi-stage Next.js `Dockerfile` (`output: "standalone"`) + `.dockerignore`, then `release deploy`.

### Release note (deploy succeeded, domain 502)

Build `ecdd6cb1-2b49-44cc-8cef-29b93e31d74b` **Succeeded** (commit `cdb2503`); Deploy reported successful.
`https://dblcyi-eocee.slsblx.com` still returned nginx **502** after rollout — likely container listen port mismatch (app was on 3000). Follow-up: Dockerfile `PORT=8080` + bake public `NEXT_PUBLIC_*` defaults for Next build inlining.

### Release note (OIDC client env wipe)

Login page hydrated to “Blocks login is not configured” because empty
`--build-arg NEXT_PUBLIC_*` from the pipeline overrode Dockerfile ARG defaults,
so the client JS bundle had blank OIDC values (SSR still saw runtime secrets → React #418).
Fix: bake public `NEXT_PUBLIC_*` as plain `ENV` (no ARG) and assert client id appears in `.next/static` during image build.

### Release note (client config fallbacks)

Even with Dockerfile ENV bake, hydrated login still showed “not configured”
(SSR had runtime secrets → React #418). Added public non-secret fallbacks in
`src/lib/blocks/config.ts` so OIDC client id / API URL / key resolve in the
browser without relying on Next inlining.


### Release note (live: OIDC login works; Data Gateway unwrap fix)

Build `89e3108a-a6de-406f-a521-db8e95c67d80` (commit `e490a29`) deployed to
`https://dblcyi-eocee.slsblx.com`. Hosted OIDC smoke test (HTTPS domain, env-only
credentials) succeeded: `/login` → Continue with Blocks → IAM → `/login/callback` → `/app`
with the signed-in user's email in the header.

Found on `/app`: the SDK's `collection().list()/create()` return the **raw GraphQL body**
(`{ data: { getCategorys: { items } } }`), but `data.ts` read `page.items` / `res.itemId`.
Result: the category list always looked empty, so `getOrSeedCategories()` re-inserted the six
defaults on every load (duplicates in `Category`). Fix: `gqlPayload`/`pageItems`/`mutationItemId`
helpers unwrap `data.<field>`, surface GraphQL `errors`, and `listCategories()` dedupes by name.
Existing duplicate Category rows are left in place (hidden by the dedupe); clean them up
manually if wanted.

Rules: added field-level (`policyType: 1`) read security at `User` level for custom fields of all
four schemas in `blocks/data/rules.json`. Row-level `CreatedBy` read/edit/delete policies are
unchanged, so rows stay owner-only. (Row-level policies reject `fieldNames`.)
