# Migrating SirenDeck from Vercel + Supabase to Blocks OS

Engineering field notes: what we did on branch `dev`, what broke, and what is still unfinished.

SirenDeck is a personal life-admin app: a Money Map treemap of renewals, subscriptions, bills, and documents. Until this migration it ran as a Next.js App Router app on Vercel with Supabase Auth, Postgres + RLS, Storage, and an Edge Function + `pg_cron` reminder pipeline.

This is the migration notebook rewritten as a post. It covers skill bootstrap, OIDC, Data Gateway schemas, CreatedBy ownership policies, Next.js wiring, Blocks Release / kaniko, login smoke tests, and the GraphQL response-shape bug that re-seeded categories on every load. Unfinished work is listed in [Open issues](#13-open-issues).

**Branch rule:** `main` stays the live Vercel/Supabase production line. All migration work lives on `dev` and pushes only to `origin/dev`. No PR to `main` unless explicitly requested. Commits are owner-authored only, with no `Co-authored-by` trailers.

**Last updated:** 2026-10-06 (Asia/Dhaka)

---

## Table of contents

- [How to read this repo after the migration](#how-to-read-this-repo-after-the-migration)
1. [Why leave Vercel + Supabase for Blocks OS](#1-why-leave-vercel--supabase-for-blocks-os)
2. [Branch model](#2-branch-model)
3. [Bootstrap of blocks-skills](#3-bootstrap-of-blocks-skills)
4. [Project, domain, and CLI workflow](#4-project-domain-and-cli-workflow)
5. [Phase 1 — OIDC](#5-phase-1--oidc)
6. [Phase 2 — schemas, access levels, field read rules](#6-phase-2--schemas-access-levels-field-read-rules)
7. [CreatedBy ownership policy shape](#7-createdby-ownership-policy-shape)
8. [Next.js wiring](#8-nextjs-wiring)
9. [Blocks Release (kaniko, Dockerfile, pnpm)](#9-blocks-release-kaniko-dockerfile-pnpm)
10. [Login smoke test narrative](#10-login-smoke-test-narrative)
11. [GraphQL response-shape bug, re-seed, and dedupe](#11-graphql-response-shape-bug-re-seed-and-dedupe)
12. [What is still on Supabase vs Blocks](#12-what-is-still-on-supabase-vs-blocks)
13. [Open issues](#13-open-issues)
14. [Decision log](#14-decision-log)
15. [Recommended next phases](#15-recommended-next-phases)
16. [Lessons learned](#16-lessons-learned)
17. [Appendix — bootstrap provenance](#17-appendix--bootstrap-provenance)

---

## How to read this repo after the migration

If you are opening SirenDeck cold on `dev`:

1. Read the Blocks section at the **bottom** of `AGENTS.md` and the skill under `.agents/skills/blocks-bootstrap/` before changing IAM or Data Gateway config.
2. Treat the top-of-file “Stack (fixed)” Supabase rules as describing **`main` / legacy paths**, not as a ban on Blocks work on `dev`.
3. Public Blocks config comes from `.env.example` (placeholders) + local `.env.local` + Blocks Release secrets as build-args. The Dockerfile sets `ARG`/`ENV` only from build-args and fails fast if a required `NEXT_PUBLIC_*` is blank. No project or client IDs are baked into the Dockerfile or `config.ts`.
4. Data ownership truth is `blocks/data/rules.json` + deployed gateway policies, not app-layer filters alone.
5. Do not commit `.sirendeck-check/`, `.playwright-mcp/`, or smoke-test passwords. `.gitignore` now blocks the common temp paths.

---

## 1. Why leave Vercel + Supabase for Blocks OS

SirenDeck on `main` runs this stack:

| Concern | Today on `main` |
|---|---|
| Hosting | Vercel |
| Auth | Supabase Auth (email + password) via `@supabase/ssr` |
| Database | Supabase Postgres + RLS (`*_own` policies on `user_id`) |
| Storage | Supabase Storage (attachments) |
| Background | Edge Function `send-reminders` + `pg_cron` hourly |
| Secrets | Vercel env + Supabase Vault |
| Product UI | Next.js 16 / React 19, Tailwind 4, Motion, d3-hierarchy treemap |

The stack works, and outages did not drive this move. The reasons are product and platform:

1. **Same OS as sibling SELISE products.** Blocks OS (portal `https://os.seliseblocks.com`, CLI `@seliseblocks/cli-os`) is the shared identity, data, release, mail, and workflow surface for other apps in the same account. Staying on a separate Vercel+Supabase stack means hand-rolling every new feature (orgs, MFA, localization, notifier) a second time.
2. **IAM that is already multi-tenant.** Project key, cookie domain, hosted OIDC, and user invite/activation are built in. Supabase email+password works, but the rest of the account ships with Blocks hosted login and PKCE public clients.
3. **Data Gateway as the schema/rules plane.** Schemas and access rules live as JSON that the CLI validates, syncs, and deploys, in place of SQL migrations + RLS policies. The semantics differ from RLS (see [section 7](#7-createdby-ownership-policy-shape)), so it is not a drop-in, but every Blocks app is expected to use it.
4. **Release on the platform subdomain.** Blocks Release deploys to `*.slsblx.com` with kaniko builds and runtime secrets sync. Vercel keeps serving `main`; Blocks Release deploys the Blocks version on `dev`.
5. **Future workflow / mail / localization.** Reminders today are an Edge Function + cron. Blocks Workflow + Mail/Notifier is the intended replacement. `bn-BD` is already on the project language list.

We are not claiming Blocks is faster to prototype for a single hobby app, or that Supabase RLS is obsolete. For SirenDeck, the goal is to run on the same OS as the rest of the workspace.

---

## 2. Branch model

```
main  ── production (Vercel + Supabase) — DO NOT TOUCH for migration
  │
  └── dev ── Blocks OS migration line — push origin/dev only
```

| Branch | Role |
|---|---|
| `main` | Live users, live Supabase project, Vercel deploy. Untouched by migration commits. |
| `dev` | Blocks project `<tenant-key>…`, Blocks Release domain, dual-provider flags, Docker/kaniko path. |

In practice:

- Agents and humans working the migration **never** checkout/commit/push `main` for this work.
- `NEXT_PUBLIC_AUTH_PROVIDER` / `NEXT_PUBLIC_DATA_PROVIDER` let `dev` run Blocks-primary while Supabase clients remain in the tree for dual-run and for `main` continuity.
- Cutover (DNS, user migration, PR `dev` → `main`) happens only when the user decides. Agents do not start it.
- Commit attribution: owner-authored only. No `Co-authored-by`.

The split also gives a rollback path. If Blocks Release breaks, `main` on Vercel still serves the product.

---

## 3. Bootstrap of blocks-skills

Blocks work in this repo runs through agent skills. The CLI vendored **22 skills** under `.agents/skills/` from `blocks-cli`, plus rules from `blocks-skills`, and stamped provenance so future installs can diff.

### What got installed

| Item | Detail |
|---|---|
| Skills repo | `https://github.com/SELISEdigitalplatforms/blocks-cli.git` @ `main` (`skills_commit=e2f3919…`) |
| Rules repo | `https://github.com/SELISEdigitalplatforms/blocks-skills.git` @ `main` (`rules_commit=3e36ede8…`) |
| Stamp | `.agents/skills/.blocks-skills-source` |
| Reporting | `reporting=opt-out` in `.agents/skills/.blocks-reporting` |
| Agents | cursor, codex, gemini, copilot |
| Skill fronts | empty (all four read `.agents/skills/` natively) |
| Instruction front | `GEMINI.md` only (thin pointer into `AGENTS.md`) |
| CLI | `@seliseblocks/cli-os` **0.8.0** |

Skill list:

`blocks-bootstrap`, `blocks-captcha`, `blocks-data-gateway-configuration`, `blocks-data-gateway-crud`, `blocks-data-storage`, `blocks-frontend-local-https`, `blocks-iam-access-control`, `blocks-iam-account`, `blocks-iam-mfa`, `blocks-iam-organizations`, `blocks-iam-sso-oidc-configuration`, `blocks-iam-sso-oidc-implementation`, `blocks-iam-users`, `blocks-localization-configuration`, `blocks-localization-implementation`, `blocks-mail`, `blocks-notification`, `blocks-notifier`, `blocks-release-deployment`, `blocks-secrets`, `blocks-storage-configuration`, `blocks-workflow`.

Step 7 verification passed: markers 1/1 on `AGENTS.md` + `GEMINI.md`, no `distributable` leak, skill count matched the manifest, no front mismatches.

### AGENTS.md — APPEND + SURFACE conflict

SirenDeck already had an unmarked `AGENTS.md` with project rules that declare a **fixed stack**: Supabase Auth/Postgres/RLS/Storage/Edge/pg_cron and **Deploy: Vercel**.

Bootstrap Step 3 **appended** the SELISE Blocks marker block at the end. It did not overwrite the file. That left a deliberate SURFACE conflict:

- Top of file: do not substitute the Supabase+Vercel stack.
- Bottom of file: route Blocks work to IAM / Data Gateway / Release / Storage / Workflow skills.

Until cutover rewrites the top “Stack (fixed)” section (planned for Phase 5), agents must treat:

1. **`main` / current production code** → original Supabase+Vercel rules.
2. **Blocks migration work on `dev`** → Blocks section + vendored skills.

The conflict stays unresolved on purpose. Rewriting “Stack (fixed)” now would misstate what `main` still runs. Bootstrap left unrelated trees alone: `.github/skills/impeccable` and local `.kilo/` worktrees.

---

## 4. Project, domain, and CLI workflow

### Project brief

| Field | Value |
|---|---|
| Name | SirenDeck |
| Tenant / key | `<tenant-key>` |
| Environment | `dev` |
| App domain | `https://dblcyi-eocee.slsblx.com` (PlatformSubdomain, verified) |
| Cookie domain | `slsblx.com` |
| Languages | `en-US` (default), `de-DE`, `bn-BD` |
| Portal | `https://os.seliseblocks.com` (account/env extras only) |

At first brief capture the project had no OIDC clients, `isOidcEnabled: false`, and zero data schemas. We modelled data from scratch on Blocks and deferred Supabase data migration.

The account can see many other projects (Demo UILM, Ripple OS, PathaoPoth, shared HRM tenants, …). Always run `blocks use <tenant-key>` before mutating anything, and never touch other tenants.

### CLI workflow that worked

```bash
blocks use <tenant-key>
blocks auth refresh --project          # project RT was recoverable; no device-code this run
blocks init                            # blocks.json + blocks/data/rules.json
blocks data validate --json
blocks data sync --dry-run --json
blocks data sync --yes --json
blocks data rules deploy --yes --json
blocks release setup|deploy ...
```

`blocks.json` pins tenant, API URL, app domain, and paths to schemas/rules. Local schema JSON lives under `blocks/data/schemas/`; access policies under `blocks/data/rules.json`.

### High-level mapping

| Supabase piece | Blocks surface |
|---|---|
| Auth email/password + cookies | IAM OIDC (public PKCE client) + `@seliseblocks/client` |
| Postgres tables + RLS | Data Gateway schemas + rules (semantics ≠ RLS) |
| Storage attachments | `blocks-storage-configuration` + `blocks-data-storage` (not done yet) |
| Edge Function + pg_cron | Workflow / Mail / Notifier (not done yet) |
| Vercel env | Blocks secrets + Release build env |
| Vercel deploy | Blocks Release (kaniko) |

---

## 5. Phase 1 — OIDC

**Goal:** hosted login that a browser app can complete with PKCE, without a client secret.

### Decisions locked

1. **Data:** greenfield on Blocks; Supabase migrate later.
2. **Auth:** email+password only via Blocks hosted login, with **no social IdP**.
3. **App:** wire the existing Next.js repo instead of scaffolding a separate Blocks starter.

### Commands (skill path: `blocks-iam-sso-oidc-configuration` + bootstrap `flows/oidc-client.md`)

Dry-run first, then `--yes` after approval:

```bash
blocks use <tenant-key>

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
| `isOidcEnabled` | `true` |
| Public client id | `<oidc-client-id>` |
| `clientType` | `public` |
| `tokenEndpointAuthMethod` | `none` (correct for browser PKCE) |
| `requirePkce` | `true` |
| `isAutoRedirect` | `true` |
| Redirect URIs | platform `/login/callback` + `http://localhost:3000/login/callback` |
| Linked IdP | `<idp-id>`, provider `sirendeck` / `blocks-oidc`, active |
| Authorize URL | non-null on IAM (`…/api/oidc/authorize?tenant_id=<tenant-key>…`) |
| Discovery | `https://iam.seliseblocks.com/<tenant-key>…` — `.well-known/openid-configuration` HTTP 200 |
| Social IdP | not configured (by design) |

Backend expanded stored scope to `openid profile offline_access`.

### Quirk: `accountActionBaseUrl`

We passed the app domain as `--account-action-base-url`. After save, reads often showed `https://iam.seliseblocks.com` (activation path under `oidc/activate/`). Treat the IAM host as the live value for activation links unless a login/activation failure proves otherwise. Invitation mail and password setup use this path. If it is wrong, invites look broken even when SMTP is fine.

### Cookie / localhost caveat

`http://localhost:3000` is a valid **authorize redirect** target, but Secure session cookies will not stick on plain HTTP localhost. Real browser login testing needs either:

- the platform HTTPS domain after Release, or
- local HTTPS on the project domain (adapt `blocks-frontend-local-https` ideas to Next).

We tested on the platform domain instead of blocking Phase 1 on local HTTPS.

### Env template (public only)

`.env.example` documents:

- `NEXT_PUBLIC_BLOCKS_KEY`
- `NEXT_PUBLIC_BLOCKS_API_URL=https://blocksapi.slsblx.com` (same registrable domain as `*.slsblx.com`, required for session cookies)
- `NEXT_PUBLIC_BLOCKS_OIDC_URL` (issuer)
- `NEXT_PUBLIC_BLOCKS_OIDC_CLIENT_ID`
- `NEXT_PUBLIC_BLOCKS_OIDC_SCOPE`
- `NEXT_PUBLIC_AUTH_PROVIDER` / `NEXT_PUBLIC_DATA_PROVIDER`

Supabase vars remain for dual-run / `main`. No client secrets belong in the browser bundle; the OIDC client is public + PKCE.

### Identity provider registration

`--register-as-identity-provider` created a Blocks IdP entry (`sirendeck` / `blocks-oidc`) tied to the public client. Without an IdP that exposes a non-null `authorizationUrl`, the app can “have OIDC enabled” and still have nowhere to send the browser. Always verify:

```bash
# conceptual checks after save
# - isOidcEnabled true
# - oidc client active, public, requirePkce true
# - IdP active with authorizationUrl set
# - GET $ISSUER/.well-known/openid-configuration → 200
```

### Scope string handling end-to-end

We asked for `openid profile`. The platform stored `openid profile offline_access`. Dockerfile `ENV` must quote the value. `.env.example` can stay unquoted as a single line assignment. The browser SDK receives whatever `NEXT_PUBLIC_BLOCKS_OIDC_SCOPE` (or the config fallback) provides. Keep it aligned with the registered client to avoid authorize-time scope errors.

### First user invite path

The only assignable role on this project was `clouduser`, which is least privilege and the right default for an end user. Create the user without a password and let Default SMTP deliver activation. CLI create returns `PendingVerification` until the user completes hosted activation. OIDC login before activation fails in ways that look like “client misconfigured” if you are not watching `accountState`.

---

## 6. Phase 2 — schemas, access levels, field read rules

### Data source and init

`blocks data config get` → Blocks-managed storage (`dbConnectionString: default`).  
`blocks init` created `blocks.json` and `blocks/data/rules.json` (`.env.example` already existed).

### Schemas

Pushed in order **Category → Item → Reminder → Attachment**. First sync failed without `collectionName` (`Collection_Name_Is_Required`). Added names matching the project pattern `blx_{SchemaName}s`, then sync succeeded.

| Schema | Collection | Notable app fields |
|---|---|---|
| Category | `blx_Categorys` | name, color, icon |
| Item | `blx_Items` | categoryId, title, notes, dueDate, status, recurrence, autoRenews, amount, currency, snoozedUntil, completedAt |
| Reminder | `blx_Reminders` | itemId, daysBefore, sentAt |
| Attachment | `blx_Attachments` | itemId, storagePath, filename, mimeType, sizeBytes |

Platform system fields (**do not** redefine in schema JSON): `ItemId`, `CreatedDate`, `CreatedBy`, `LastUpdatedDate`, `LastUpdatedBy`, `Language`, `OrganizationId`, `Tags`.

### Field mapping (Supabase → Blocks)

| Supabase | Blocks |
|---|---|
| `id` uuid PK | `ItemId` (platform) |
| `user_id` / RLS `auth.uid()` | `CreatedBy` + access rules |
| `created_at` / `updated_at` | `CreatedDate` / `LastUpdatedDate` |
| `items.due_date` date | `Item.dueDate` DateTime (date-only in app UI) |
| `items.amount` numeric | `Item.amount` **String** decimal (avoid Float drift) |
| attachments binaries | metadata now; binaries later via Blocks storage |

### Access levels (schema security)

The create path initially set Public access via `makeSchemaPublic`. We immediately deployed **User** (authenticated) schema access for READ/WRITE/EDIT/DELETE on all four schemas.

Schema access is not row ownership. Until the CreatedBy Custom policies landed (next section), any authenticated user who could reach the gateway could see everyone’s rows.

### Field-level read rules

After OIDC login worked but category fields came back blank in some reads, we added **field-level** (`policyType: 1`) read security at User level for custom fields of all four schemas in `blocks/data/rules.json`. Row-level CreatedBy read/edit/delete policies stayed in place. We hit one constraint while doing this: **row-level policies reject `fieldNames`**. Field rules are a separate policy type.

### Why amount is a String

Money Map displays and edits decimal amounts (often BDT). Mapping Supabase `numeric` to a GraphQL/JSON `Float` invites binary floating error on values users expect to be exact to cents/paisa. Storing `amount` as a **String** decimal in the Blocks schema keeps the app’s existing string-based validation and avoids “0.1 + 0.2” errors in the gateway. Enforce format with validation at write time (Phase 3), not with a float type.

### Collection naming

Sync requires `collectionName` (the first sync failed with `Collection_Name_Is_Required`). The working pattern on this tenant was `blx_{SchemaName}s`, so Category becomes `blx_Categorys`; the platform pluralizes literally. GraphQL field names follow that shape (`getCategorys`, `insertCategory`, …). The unwrap helpers must use the **actual** field names the gateway emits, not the TypeScript schema name alone.

### Dual-run data helpers

`mapCategory` / `mapItem` translate platform fields (`ItemId`, `CreatedBy`, `CreatedDate`, …) into the snake_case `CategoryRow` / `ItemRow` shapes the treemap already understands. `money-map.tsx` and related UI did not need changes while the backend switched. The cost is two naming vocabularies in one app until Phase 5 removes the dual meaning of the Supabase row types.

---

## 7. CreatedBy ownership policy shape

The skills did not document the `ruleGroup` JSON shape. We worked it out from API validation errors across repeated CLI deploys:

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

Discovered enums:

- `ConditionSource`: Auth = `1`, SchemaField = `2`
- `PolicyOperator`: equal = `0`

Pulled policies normalize `combinator` → `logicalOperator: 0`.

### Applied matrix (all four schemas)

| Operation | Access level | Policy |
|---|---|---|
| WRITE (create) | User / all logged-in (`1`) | none — platform stamps `CreatedBy` |
| READ / EDIT / DELETE | Custom (`3`) | allow when Auth.`UserID` == Schema.`CreatedBy` |

Verified with `blocks data rules policy get <Schema>` (three policies each) and schema aggregation (R/E/D = Custom, W = User). Local `blocks/data/rules.json` holds the twelve row policies plus security rows (including later field-level reads).

Portal equivalent if CLI is unavailable: Data Gateway → schema → Schema Access → set View/Edit/Delete to **Custom** → rule Auth UserID equal Schema Field CreatedBy → Publish; Create stays All Logged In.

Before these policies existed, app-layer filters on `CreatedBy` were a temporary stopgap. They do not replace gateway enforcement.

---

## 8. Next.js wiring

Installed `@seliseblocks/client@0.2.0` and built a thin adapter layer so Money Map UI could stay mostly unchanged.

### Library surface

| File | Role |
|---|---|
| `src/lib/blocks/config.ts` | Reads `NEXT_PUBLIC_BLOCKS_*`; public fallbacks; `isBlocksLoginConfigured()`; auth provider preference |
| `src/lib/blocks/client.ts` | Single `createBlocksClient` singleton |
| `src/lib/blocks/auth.ts` | `startLogin` / `completeLogin` / `fetchSessionClaims` / `logout` |
| `src/lib/blocks/auth-token.ts` | Optional bearer cache (cookie flow is primary) |
| `src/lib/blocks/jwt.ts` | Minimal JWT helpers |
| `src/lib/blocks/data.ts` | Category/Item list+create, GraphQL unwrap, seed, mappers to existing row types |

### UI / routes

| File | Role |
|---|---|
| `src/components/blocks-auth-provider.tsx` | Client session status/claims; unstick login CTA during session probe |
| `src/components/blocks-login-button.tsx` | “Continue with Blocks” → `redirectToProvider` |
| `src/app/login/callback/page.tsx` | OIDC callback |
| `src/app/login/page.tsx` | Blocks button when configured; Supabase form when preferred/fallback |
| `src/components/blocks-app-shell.tsx` | Client session gate for `(app)` when auth provider is Blocks |
| `src/components/money-map/blocks-money-map-page.tsx` | Client Money Map on Data Gateway |
| `src/components/shell/blocks-top-bar.tsx` | Signed-in email + logout |
| `src/proxy.ts` | Skips Supabase cookie refresh when auth provider is `blocks` |

### Provider flags

```
NEXT_PUBLIC_AUTH_PROVIDER=blocks|supabase
NEXT_PUBLIC_DATA_PROVIDER=blocks|supabase
```

On Blocks Release images both default to `blocks`. On local dual-run you can flip either independently. Home page soft-guards missing Supabase so a Blocks-only deploy does not crash the marketing route.

### Public config (env only)

`config.ts` reads `NEXT_PUBLIC_BLOCKS_*` from the environment only. Source has no hardcoded project key, client id, or tenant URLs. Local: copy `.env.example` → `.env.local` and fill values from the portal/CLI. Release: `blocks release secrets sync` injects the same names as build-args so Next can inline them into the client bundle.

If build-args are empty while runtime secrets are set, SSR and the client disagree (React #418 / “not configured”). Fix the Release secret set; do not re-bake IDs into the Dockerfile.

Never put a client secret in that file. There isn’t one for this public PKCE client.

---

## 9. Blocks Release (kaniko, Dockerfile, pnpm)

### Repo link and first setup

Linked `Wrudra/SirenDeck` @ branch `dev` to `https://dblcyi-eocee.slsblx.com`. First production-shaped deploy used `blocks release setup` (not only `deploy`) with Azure West Europe `1 GiB` machine config, public `NEXT_PUBLIC_*` secrets sync, and `--register-callback`. No passwords went into Release secrets. A later security pass removed the project key / OIDC client id / API URL bake-ins from the Dockerfile; Release secrets remain the injection path.

### Dockerfile evolution (failed builds → working image)

**Build #1 — failed.** Kaniko: `error resolving dockerfile path`. The repo had no `Dockerfile`.  
**Fix:** add a multi-stage Next.js Dockerfile with `output: "standalone"` plus `.dockerignore`.

Early Dockerfile attempts hit these issues:

| Issue | Lesson |
|---|---|
| npm vs pnpm | Repo lockfile is `pnpm-lock.yaml`. Use pnpm in the image (`corepack prepare pnpm@12.8.1`). |
| Native deps | `unrs-resolver` and `sharp` need `--allow-build=…` (and `.npmrc` `dangerouslyAllowAllBuilds=true` for CI). |
| Multi-stage complexity | Simplified to a single pnpm builder stage + slim runner. |
| Listen port | Deploy “succeeded” but domain returned nginx **502**. The container listened on 3000; the platform expected **8080**. Set `PORT=8080`, `HOSTNAME=0.0.0.0`, `EXPOSE 8080`. |
| Standalone layout | CMD probes `server.js` or `sirendeck/server.js` under `.next/standalone`. |
| Scope ENV quoting | `ENV … SCOPE="openid profile"`. An unquoted multi-word scope breaks the image env. |
| Empty pipeline `--build-arg` | Empty build-args **override** Dockerfile `ARG` defaults and wipe the client OIDC bundle. Do **not** bake project key / client id into the Dockerfile. Keep Release secrets non-empty and fail the builder if required `NEXT_PUBLIC_*` are blank. |
| Assert in build | Preflight `test -n` on required public env before `pnpm run build`; do not echo client ids into build logs. |

### Current shape (conceptual)

```dockerfile
FROM node:22-alpine AS builder
# corepack pnpm, frozen lockfile, allow-build for native modules
# Public NEXT_PUBLIC_* arrive as ARG/ENV from Blocks Release build-args
# (secrets sync). No project key / client id / URLs are committed here.
ARG NEXT_PUBLIC_BLOCKS_KEY=
# …other NEXT_PUBLIC_BLOCKS_* ARGs with empty defaults…
ENV NEXT_PUBLIC_BLOCKS_KEY=$NEXT_PUBLIC_BLOCKS_KEY \
    NEXT_PUBLIC_AUTH_PROVIDER=blocks \
    NEXT_PUBLIC_DATA_PROVIDER=blocks
RUN test -n "$NEXT_PUBLIC_BLOCKS_OIDC_CLIENT_ID" && pnpm run build

FROM node:22-alpine AS runner
ENV PORT=8080 HOSTNAME=0.0.0.0
# copy standalone + static; run as non-root nextjs user
```

`.dockerignore` excludes `node_modules`, `.next`, `.git`, `.agents`, `supabase`, markdown, and env files (keeps example). Skills stay in git for agents; they do not need to ship in the runtime image.

### Release timeline (compressed)

1. No Dockerfile → kaniko path error.
2. Dockerfile + pnpm → build green; domain 502 → port 8080.
3. Client “not configured” → Release secrets as build-args (non-empty) + fail-fast preflight; no Dockerfile literals.
4. Drop brittle client-id grep that broke otherwise-good builds; quote multi-word scope if set via ENV.
5. OIDC login smoke test green on the platform domain.

### Next.js public env under kaniko

Next.js inlines `NEXT_PUBLIC_*` at **build** time into the client JS. Blocks Release can inject the same names as build-args and as runtime secrets, and those happen at different times:

| Moment | What the browser sees |
|---|---|
| Build with empty `--build-arg NEXT_PUBLIC_BLOCKS_OIDC_CLIENT_ID=` | Client bundle gets `""`. Login CTA thinks Blocks is unconfigured. |
| Runtime secret present, build blank | SSR (Node) may see the secret; client still has `""` → hydration mismatch (React #418) and a confusing UI. |
| Build with Release secrets as non-empty build-args | Client bundle contains the public client id from env, not from committed Dockerfile literals. |

We also tried a strict `grep` of the client id inside `.next/static` as a build gate. It caught one real failure, then failed a good build when chunk layout changed. The checks we kept: (1) keep Release secrets non-empty (empty `--build-arg` blanks the bundle), (2) fail the Docker build if required `NEXT_PUBLIC_*` are blank, (3) smoke-test `/login` on the platform domain after each Release. Do not commit the project key or client id into the Dockerfile or `config.ts`.

### pnpm + Alpine specifics

- `corepack enable && corepack prepare pnpm@12.8.1 --activate` pins the same major the repo uses.
- `pnpm install --frozen-lockfile --allow-build=unrs-resolver --allow-build=sharp` is required on Alpine for optional native packages Next pulls in.
- `.npmrc` with `dangerouslyAllowAllBuilds=true` is a CI hammer; prefer explicit `--allow-build` when you know the package list, but Release images that install the full app tree needed the broader allow during the unblock window.
- `libc6-compat` on Alpine avoids a class of native module load failures.

### Standalone output

`next.config.ts` sets `output: "standalone"`. The runner image copies:

- `.next/standalone` → app root (may nest as `sirendeck/server.js` depending on `package.json` name)
- `.next/static` → `.next/static` beside it
- `public/` → `public/`

The CMD shell probe exists because the nest path differed between early and later Next/standalone layouts. Once the path stabilizes, hardcode it and drop the probe.

---

## 10. Login smoke test narrative

Credentials for smoke tests lived **only** in shell environment variables for the browser session (`SIREN_EMAIL` / `SIREN_PASS`). They were never written to git, `Migration.md`, `.env*` committed files, agent memory, or Release secrets beyond what the platform already holds for the invited user.

Steps (no secrets):

1. Invite first end user via CLI (`blocks iam users create … --roles clouduser`) without setting a password. Mail config Default SMTP delivers activation.
2. User activates through the hosted activation flow (one-time code + password + name) until `accountState=Active`, `isVerified=true`.
3. Open `https://dblcyi-eocee.slsblx.com/login`.
4. Click **Continue with Blocks** → hosted IAM → redirect to `/login/callback` → land on `/app`.
5. Top bar shows the signed-in user’s email; session cookies stick because the app and API share the `slsblx.com` registrable domain.

Local HTTP localhost was **not** used as the proof path (Secure cookie caveat). Full Item form CRUD, reminders, and attachments were out of scope. This smoke test only had to prove OIDC and an empty or seeded Money Map load.

### What we explicitly did not test in the first smoke

- Password reset / forgot-password flows
- MFA (skill installed, not configured)
- Social IdP (out of scope by decision)
- Concurrent sessions / logout from a second device
- Local HTTPS cookie jar
- Full item edit dialog against Data Gateway
- Reminder send path
- Attachment upload

The bar for “Phase 2.2 done” was a hosted OIDC round-trip on the platform domain, the session email visible, and categories seeding or listing without crashing the map. Everything else is backlog and untested.

---

## 11. GraphQL response-shape bug, re-seed, and dedupe

After login worked, `/app` still had a seeding bug.

### Symptom

`getOrSeedCategories()` believed the Category collection was always empty, so it inserted the six default categories on **every** load. The map looked seeded, but the gateway accumulated duplicates (on the order of ~60 category rows for six names).

### Root cause

`@seliseblocks/client` `collection().list()` / `create()` return the **raw GraphQL body**:

```json
{ "data": { "getCategorys": { "items": [ … ] } }, "errors": [ … ] }
```

Early `data.ts` read `page.items` / `res.itemId` as if the SDK had already unwrapped the payload. `items` was always `undefined` → empty list → re-seed.

### Fix

Helpers in `src/lib/blocks/data.ts`:

- `gqlPayload(res, field)`: unwrap `data.<field>`, throw on GraphQL `errors`
- `pageItems(res, field)`: return `items[]`
- `mutationItemId(res, field)`: read `itemId`, honor `acknowledged`

`listCategories()` dedupes by normalized name (keep first) so the UI hides historical duplicates. Seeding keys off **raw row count**, not “mapped rows with non-null fields,” so a momentary field-cache lag after rules deploy (rows exist, fields read back `null`) does not trigger another seed. If raw rows exist but mapped list is empty, re-read once instead of inserting.

Existing duplicate Category rows were left in the gateway (hidden by dedupe). Manual cleanup remains an open ops task.

### Reproduction sketch (no credentials)

1. Sign in on the platform domain so Data Gateway calls carry the session cookie.
2. In the client, call `categoriesCollection().list({ pageNo: 1, pageSize: 200 })` and log the raw return value.
3. Observe `{ data: { getCategorys: { items: [...] } } }`, not `{ items: [...] }`.
4. Without unwrap, `raw.items` is `undefined`, so any `length === 0` check passes even when rows exist.
5. After unwrap + raw-count seed guard, an empty mapped list with `raw.length > 0` means “re-read / fix field rules,” not “insert six more defaults.”

### Dedupe vs delete

Client-side dedupe by name is a **read path** fix for the Money Map. It does not shrink the collection, does not fix pagination totals, and does not help admin tooling that lists raw rows. Plan a one-time gateway cleanup (keep one row per name per `CreatedBy`, delete the rest), then keep dedupe as a cheap safety net.

---

## 12. What is still on Supabase vs Blocks

| Concern | Blocks domain (`dev` / Release) | Still Supabase (`main` / dual-run codepaths) |
|---|---|---|
| Hosting | Blocks Release subdomain | Vercel |
| Auth | Blocks OIDC (public PKCE client) | Supabase Auth email+password |
| Categories / Items (Money Map read + sample create) | Data Gateway when `DATA_PROVIDER=blocks` | Postgres + RLS |
| Full `ItemFormDialog` / server actions | not flipped | yes |
| Reminders / pg_cron / Edge Function | not ported | yes on `main` |
| Attachments (binaries) | metadata schema only | Supabase Storage on `main` |
| Secrets / Vault | Blocks secrets for Release public env | Vercel + Vault on `main` |
| AGENTS.md “Stack (fixed)” | Blocks section appended | Top-of-file still declares Supabase+Vercel |

Supabase clients under `src/lib/supabase/*`, migrations under `supabase/`, and `@supabase/*` dependencies remain in the tree on purpose until Phase 5.

---

## 13. Open issues

1. **Duplicate categories (~60 rows).** Re-seed loop left many copies of the six defaults. UI dedupes by name; gateway still holds extras. Needs a one-time delete/dedupe (CLI or small script), then rely on raw-count seed guard.
2. **Filtered query blank fields.** Some list/filter reads return rows whose custom fields are momentarily or persistently blank (field-cache / field-level security interaction). Field-level User read rules were added; intermittent blank reads after rules deploy still warrant a re-read. Broader filtered-query blankness is not fully closed.
3. **AGENTS.md SURFACE conflict.** Top “Stack (fixed)” still says Supabase+Vercel. Rewrite at Phase 5 / cutover.
4. **Local HTTPS.** Cookie-capable local login on the project domain not set up; smoke tests use the platform HTTPS domain.
5. **Full Item CRUD on Blocks.** Sample create only; dialog + validations still Supabase-shaped.
6. **Attachments binaries + Reminders workflow.** Schemas exist; storage config and Workflow/Mail replacement not done.
7. **Data migration from Supabase.** Deferred by design (greenfield first). User-id mapping and password reset communication remain open if/when we migrate rows.
8. **Cutover.** DNS, whether to keep a read-only Supabase archive, and when (if ever) to PR `dev` → `main`. The user decides.

---

## 14. Decision log

| When (Asia/Dhaka) | Decision |
|---|---|
| 2026-10-06 | Agents: cursor, codex, gemini, copilot. Skill-fronts empty. Instruction-front: `GEMINI.md`. Reporting: opt-out. |
| 2026-10-06 | First Blocks skills install. Append Blocks block to existing `AGENTS.md`; leave SURFACE stack conflict unresolved. |
| 2026-10-06 | Branch strategy: all migration on `dev` / `origin/dev`; `main` untouched. |
| 2026-10-06 | Project: SirenDeck `<tenant-key>` (dev). Domain `https://dblcyi-eocee.slsblx.com`. |
| 2026-10-06 | Auth probe: project RT recoverable → `blocks auth refresh --project`. |
| 2026-10-06 | **Data:** greenfield on Blocks. **Auth:** email+password only (no social). **App:** wire existing Next.js. |
| 2026-10-06 | Phase 1: OIDC enabled; public PKCE client created; IdP linked with non-null authorize URL. |
| 2026-10-06 | Redirect URIs: platform + `localhost:3000` `/login/callback`. Cookie caveat documented. |
| 2026-10-06 | Phase 2: schemas Category/Item/Reminder/Attachment; User-level security; Next OIDC callback wired. |
| 2026-10-06 | Invited first clouduser; CreatedBy ownership policies on all four schemas. |
| 2026-10-06 | Money Map dual-path + category seed; Release linked to `dev`. |
| 2026-10-06 | Dockerfile/kaniko iteration: pnpm, port 8080, Release build-args (no baked IDs), scope quoting. |
| 2026-10-06 | OIDC smoke test green; GraphQL unwrap + seed guard + category name dedupe. |
| 2026-10-06 | **Security pass:** scrub Dockerfile bake-ins (project key / OIDC client id / API URLs); redact tenant/client/IdP IDs in `Migration.md`; placeholder-ize `.env.example`; drop `config.ts` hardcoded defaults. Known residual: `blocks.json` still holds `tenantId` from `blocks init` (CLI pin, not a public env bake-in). |
| _(open)_ | When to rewrite AGENTS.md “Stack (fixed)” — proposed Phase 5. |
| _(open)_ | Supabase data migration strategy / cutover date / DNS. |
| _(open)_ | Duplicate category cleanup in gateway. |

---

## 15. Recommended next phases

### Phase 3 — finish app wiring on Blocks

1. Port full Item form (create/edit/snooze/complete) to Data Gateway helpers; keep UI components, swap data layer.
2. Add field validations (title length, status/recurrence enums, amount regex, attachment size).
3. One-time dedupe/delete of duplicate Category rows; confirm seed guard with a clean collection.
4. Investigate filtered-query blank fields with a minimal reproduction against `collection().list` filters.

### Phase 4 — reminders and attachments

1. Replace Edge Function + `pg_cron` with Blocks Workflow schedule → Mail/Notifier.
2. Configure Blocks storage; port attachment upload/download; keep metadata schema in sync.
3. Run reminders in log-mode first; keep Supabase cron on `main` until Blocks path is proven.

### Phase 5 — remove Supabase from `dev`

1. Drop `@supabase/*` deps and `src/lib/supabase/*` from the Blocks-primary tree (or isolate behind a legacy package if dual-run must continue longer).
2. Stop reading `NEXT_PUBLIC_SUPABASE_*` on Blocks Release.
3. Archive `supabase/migrations` under `docs/legacy-supabase/` or leave as git history reference.
4. Rewrite AGENTS.md top “Stack (fixed)” to Blocks — resolves SURFACE conflict.

### Phase 6 — soak and cutover

1. Soak on `https://dblcyi-eocee.slsblx.com` with real usage.
2. If migrating existing Supabase users/rows: export, map ids, forced password reset communication.
3. Cutover decision (DNS / which system of record) — explicit user ask.
4. Only then consider PR `dev` → `main`.

---

## 16. Lessons learned

1. **Branch isolation contained Release failures.** With `main` still on Vercel+Supabase, no Release failure reached users.
2. **OIDC “enabled” is not enough.** You need a public PKCE client, redirect URIs that match the real callback route, an IdP with a non-null authorize URL, and cookie domain alignment (`blocksapi.slsblx.com` + app on `*.slsblx.com`).
3. **`accountActionBaseUrl` reads back differently.** What you pass and what `get` returns can differ; activation links follow the live IAM value.
4. **Localhost redirects ≠ local sessions.** Authorize redirects on `http://localhost:3000` do not imply Secure cookies will stick. Prove login on HTTPS first.
5. **RLS intuition does not port.** Schema User access ≠ row ownership. Custom CreatedBy policies need a real `ruleGroup` shape; inventing SQL-shaped rules fails closed or open in surprising ways. API errors were more useful than the skill docs here.
6. **Field-level vs row-level policies are different types.** Row policies reject `fieldNames`. Blank custom fields after a rules deploy may be cache lag, so count raw rows before re-seeding.
7. **Log the SDK’s actual return shape.** Assuming an unwrapped `{ items }` when the client returns a GraphQL envelope creates a silent seed loop.
8. **Kaniko is literal.** No Dockerfile means an immediate fail. Wrong listen port means a green deploy and a 502. Empty `--build-arg` values wipe `ARG` defaults. Inject public Next config via Release secrets (never bake the project key or client id into the Dockerfile) and fail the build if they are blank.
9. **pnpm in Docker must match the lockfile.** Fighting npm in CI when the repo is pnpm-only wastes builds; allow native builds explicitly.
10. **Quote multi-word ENV values.** `openid profile` without quotes is two tokens to the image.
11. **Do not hardcode project IDs as “public fallbacks” in source.** Prefer correct Release / `.env.local` injection. Hardcoded client ids in `config.ts` or Dockerfile recreate the same exposure the security pass removes.
12. **Dual-provider flags beat a big-bang cut.** `AUTH_PROVIDER` / `DATA_PROVIDER` let us ship OIDC and Money Map reads without deleting Supabase codepaths on day one.
13. **SURFACE conflicts in AGENTS.md should stay visible.** Overwriting “Stack (fixed)” early would paper over the fact that `main` still runs Supabase.
14. **Never commit smoke credentials or check screenshots.** Env-only passwords; `.sirendeck-check/` and `.playwright-mcp/` stay gitignored.
15. **The skills did not cover everything.** Bootstrap, OIDC config, and Release skills got us started; the CreatedBy `ruleGroup` shape and GraphQL unwrap details came from debugging live traffic on the `dev` domain.

---

## 17. Appendix — bootstrap provenance

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

CLI: `@seliseblocks/cli-os` **0.8.0**.

Repo paths that matter for this post: `Migration.md` (this file), `Dockerfile`, `.dockerignore`, `.npmrc`, `blocks.json`, `blocks/data/schemas/*`, `blocks/data/rules.json`, `src/lib/blocks/*`, `src/components/blocks-*.tsx`, `src/app/login/callback/page.tsx`, `.agents/skills/`, Blocks section at the end of `AGENTS.md`.
