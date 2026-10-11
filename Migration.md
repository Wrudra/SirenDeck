# Migrating a Vercel + Supabase app to Blocks OS

There is no shortage of places to put an app. Hosting, sign-in, files, translation, mail, jobs: each has a product that is very good at one of those, and quiet about the rest. In 2026 the usual names are Vercel, Netlify, and Cloudflare for the URL; Supabase, Firebase, and Appwrite for the backend; Clerk or Auth0 if identity is a separate bill; AWS Amplify if the account already lives on AWS. Blocks OS sits in that same list: one project in [os.seliseblocks.com](https://os.seliseblocks.com) with IAM, Data Gateway, files, mail, localization, workflows, secrets, and Release.

The trap is a polite one. You rarely pick a single row. You pick Vercel because Next.js is easy there, then Supabase because Vercel has no database, then a mail vendor because neither of those is your ESP, then maybe Clerk because “we might need orgs later.” Three dashboards and three secret stores later, it still feels like a small stack. The empty cells below are how that happens.

This table is a map, not a ranking. ✓ means the product is built for that job. ~ means you can get there with an add-on, a sibling product, or extra wiring. `no` means you bring someone else.

| | Vercel | Supabase | Firebase | Clerk | Cloudflare | Blocks OS |
|---|---|---|---|---|---|---|
| Git deploy / app hosting | ✓ Next.js, previews, edge | no (pair with a host) | ✓ Hosting | no | ✓ Pages / Workers | ✓ Release (container, platform domain) |
| Preview deployments | ✓ | ~ with a host + branching | ~ | no | ~ | no (not Vercel-style PR previews) |
| Auth (email, OIDC, users) | no | ✓ + RLS | ✓ | ✓ orgs, MFA, UI | no | ✓ hosted OIDC, users, orgs, roles, MFA, captcha |
| Database | no | ✓ Postgres | ✓ Firestore (NoSQL) | no | ~ D1 | ✓ Data Gateway (schemas + rules, not `psql`) |
| File storage | ~ Blob | ✓ | ✓ | no | ✓ R2 | ✓ Data files + storage provider |
| Scheduled jobs | ✓ Cron | ✓ `pg_cron` / functions | ✓ Functions | no | ~ Cron Triggers | ✓ Workflow scheduler |
| Transactional mail | no | ~ auth mail | ~ | ~ | no | ✓ Mail config + templates |
| Localization | no | no | no | no | no | ✓ languages, modules, keys |
| Notifications | no | ~ Realtime | ✓ FCM | no | no | ✓ Notifier + notification channels |
| Realtime / live queries | no | ✓ | ✓ | no | ~ | no (not a Realtime product) |
| Secrets | ✓ env | ✓ | ✓ | no | ✓ | ✓ project secrets + Release secrets |
| Global edge network | ✓ | no | ~ | no | ✓ | no (one Release region, not an edge fabric) |

A few cells worth reading twice. Vercel still does not ship auth or Postgres; in 2026 it is still the front half of a Vercel + Supabase app. Supabase still does not host your Next.js UI. Firebase covers more of the board if you accept Firestore and Google’s lock-in. Clerk is excellent at identity and then you still need a host and a database. Cloudflare is infrastructure you compose. Blocks OS covers hosting, auth, data, files, mail, localization, and jobs in one tenant, and does **not** pretend to be Vercel’s edge, Supabase Realtime, or a database you open with `psql`.

If that last row is the one you actually want, the rest of this note is the move. If you are happy on two platforms, there is nothing to fix.

---

You already have a Next.js app on Vercel, with Supabase looking after sign-in, the database, and perhaps files or a scheduled job. This note is how to point that same repository at Blocks OS instead: same UI, new login, new data store, new place the app is hosted.

You will work in two places. The console is [os.seliseblocks.com](https://os.seliseblocks.com). Create an account there if you do not have one. The repo stays the repo you already ship. Copy every key, client id, and URL from **this** project in the console. Another project’s values will not work, even if they look similar.

---

## Start here

In the console, create a project for the app. Then open Release, connect GitHub, and link this repository.

That is the only setup you need before you configure anything else. The project is created in the **dev** environment. After a short wait, the overview shows an app address on `*.slsblx.com`. That is where the hosted app will live until you add your own domain.

If you later want production, add that environment in the console. Do not create a second project and hope it is prod. Release builds whichever git branch you linked, and the branch **name** has to match the environment name (`dev` with `dev`, and so on).

A few names in the console are worth knowing up front:

- **IAM** is sign-in: users, the login page Blocks hosts, roles.
- **Data Gateway** is your tables and who may see a row.
- **Release** is build and host: the GitHub repo, secrets, the live URL.
- **Mail** is what sends activation and password-setup messages.

---

## The pieces that move

| Today | On Blocks |
|---|---|
| Vercel | Release, on the `*.slsblx.com` address (your domain later, if you want it) |
| Environment variables | Release secrets, and a local `.env.local` while you develop |
| Supabase Auth | Hosted login (OIDC) |
| Postgres and row-level security | Data Gateway schemas and ownership rules |
| File uploads | Only if you need them: storage in the console, then Data files |
| Cron or an Edge Function | Only if you need them: Workflow, plus Mail or Notifier |

You keep your screens. You change how people sign in, where rows live, and where the site is deployed.

---

## Values you will copy

From **project overview / settings**:

- **Project key:** identifies the tenant. In app code it is `xBlocksKey` (the `x-blocks-key` header). The name `projectKey` is not the one the SDK expects.
- **Environment:** `dev` on a new project.
- **App domain:** `https://….slsblx.com` on the overview. After the first Release, the live URL may include an extra suffix; use the URL that actually opens in the browser.

From **IAM**, after you create the login client in the next section:

- **OIDC client id:** IAM → OIDC clients → the public client (safe to put in the browser; it is not a password).
- **Issuer / OIDC URL:** usually `https://iam.seliseblocks.com/<project-key>`.
- Open `<issuer>/.well-known/openid-configuration` in a browser. You should get JSON, not an error. That document is also where the authorize, token, and userinfo URLs come from if you need to check them.
- **Authorize URL:** IAM → identity providers → the provider tied to your client. It has to be filled in, or the login button has nowhere to send the browser.

The address the **browser SDK** calls is easy to mix up. For an app on `*.slsblx.com`, it is `https://blocksapi.slsblx.com`. That host shares a parent domain with the app, so the sign-in cookie can be stored. `https://api.seliseblocks.com` is a different host; if the browser talks to it, the cookie is treated as third-party and sign-in will not stay.

If you later put the app on your own domain, the API host needs to share that parent domain too, or the same cookie problem returns.

Keep placeholders in `.env.example`. Real values belong in `.env.local` on your machine and in **Release → secrets** for the linked repo. They do not belong in git, in source files, or in the Dockerfile as literals. A Next.js example file looks like this (fill from the console, never commit the real ids):

```
NEXT_PUBLIC_BLOCKS_KEY=
NEXT_PUBLIC_BLOCKS_API_URL=https://blocksapi.slsblx.com
NEXT_PUBLIC_BLOCKS_OIDC_URL=https://iam.seliseblocks.com/<project-key>
NEXT_PUBLIC_BLOCKS_OIDC_CLIENT_ID=
NEXT_PUBLIC_BLOCKS_OIDC_SCOPE=openid profile
NEXT_PUBLIC_BLOCKS_APP_DOMAIN=https://<your-app>.slsblx.com
# Optional: only if this deploy still has a Supabase path beside Blocks
# NEXT_PUBLIC_AUTH_PROVIDER=blocks
# NEXT_PUBLIC_DATA_PROVIDER=blocks
```

---

## Sign-in

People will sign in on a page Blocks hosts, then come back to your app. In OpenID terms that return address is a **redirect URI**. For this SDK it is always `/login/callback` on whatever origin the user is actually using, for example `https://your-app.slsblx.com/login/callback`. You will add a route with that path in Next.js. It must be reachable **without** already being signed in.

You need three things in IAM, all on this project:

1. An **OIDC client**
   - Type **public**, with PKCE required. That means a browser app: no client secret in the frontend. A confidential client is for a server that can hold a secret.
   - Redirect URIs: `/login/callback` on each origin you really run (platform domain now; custom domain later; local HTTPS only if you use it). Plain `http://localhost` can finish the redirect and still drop the session cookie, because the cookie is marked Secure.
   - Scope `openid profile` is enough to start. If the console also stores `offline_access`, keep your env in line with the client.
   - Register the client as an **identity provider**. Turn on auto-redirect if your login page should send people straight to Blocks.
2. That **identity provider**, with an authorize URL (and the token / userinfo / jwks / issuer fields). If they are empty, copy them from the discovery document above.
3. **OIDC turned on** in the project’s auth settings. If the console asks for an account-action base URL, that is for invitation and password-setup links. Activation mail follows whatever IAM shows after you save, which is often the IAM host rather than your app host.

For a first migration, email and password on the hosted page is enough. Google, Microsoft, or Okta is a second identity provider: you create an app in that vendor’s console, then paste their client id and secret under IAM → identity providers. MFA, if you want it, lives under IAM / MFA as its own settings; it is not implied by creating the client.

Then create one user (IAM → users) **without** a password, with the least powerful role the tenant offers for an end user, often `clouduser`. They set the password through the activation mail. That mail only goes out if **Mail** is configured on the project. Until the user is marked active, login fails in a way that looks like a mis-set client.

---

## Environment variables in the app

The names are in the example above. Next.js bakes any `NEXT_PUBLIC_*` variable into the client JavaScript **when you build**. (Vite does the same with `VITE_*`.) Adding a secret in Release after the image is built does not update the login button. Put those public names in Release secrets **before** the build that has to contain them.

Read them in one place. Treat login as missing until key, API URL, issuer, and client id are all set.

`NEXT_PUBLIC_AUTH_PROVIDER` and `NEXT_PUBLIC_DATA_PROVIDER` are only useful if this deploy still has a Supabase path beside Blocks. A clean cut can omit them. If some routes still import Supabase, skip that session refresh when you are on Blocks, so a deploy with no Supabase env does not crash.

---

## Data

Your Postgres tables become **schemas** in Data Gateway. Supabase RLS (`user_id = auth.uid()`) does not come along. Ownership is a rule on **CreatedBy**, a field Blocks sets when someone creates a row.

In Data Gateway, check the data source. The default is storage Blocks runs for you. You only point it at your own database if you mean to.

In the repo, schema files usually live under `blocks/data/schemas/`, with access rules in `blocks/data/rules.json`. A `blocks.json` can point at those paths; it should not hold passwords.

Add one schema per thing you store, parents before children (a category before the items that point at it). Each schema needs a **collection name**. A usual pattern is `blx_` plus the schema name plus a literal `s`, so `Category` becomes `blx_Categorys`. List and create in the API use those names (`getCategorys`, `insertItem`). Use what the gateway shows after publish, not a guessed plural.

Leave these fields to the platform; do not add them again in your JSON: `ItemId`, `CreatedDate`, `CreatedBy`, `LastUpdatedDate`, `LastUpdatedBy`, `Language`, `OrganizationId`, `Tags`.

Coming from Supabase, ids become `ItemId`, `user_id` becomes `CreatedBy`, timestamps become `CreatedDate` / `LastUpdatedDate`. Dates can be DateTime in the schema even if the UI still shows a calendar day. Amounts that must stay exact are happier as decimal **strings** than as floats. File bytes can wait; a path and filename on the row are enough until you turn on storage.

Publish the schemas, then set access on each one. “User” (any signed-in person) is not the same as “only the owner.” A pattern that matches typical RLS:

- **Create:** all signed-in users. Blocks fills in `CreatedBy`.
- **View, edit, delete:** Custom: Auth **UserID** equals schema **CreatedBy**.

That is Data Gateway → the schema → Schema Access. Publish, then reload so the live gateway picks it up.

If rows come back but your own fields are empty, add **field-level read** access for those fields at the User level. Row rules and field rules are different; row rules do not take a field list.

---

## Wiring the Next.js app

Add `@seliseblocks/client` like any other dependency. Create **one** client and reuse it. The field is `xBlocksKey`, not `projectKey`. Talking to Blocks with `fetch` from the app is not the supported path.

```ts
createBlocksClient({
  apiUrl: process.env.NEXT_PUBLIC_BLOCKS_API_URL,
  appDomain: process.env.NEXT_PUBLIC_BLOCKS_APP_DOMAIN,
  xBlocksKey: process.env.NEXT_PUBLIC_BLOCKS_KEY,
  oidc: {
    clientId: process.env.NEXT_PUBLIC_BLOCKS_OIDC_CLIENT_ID,
    scope: process.env.NEXT_PUBLIC_BLOCKS_OIDC_SCOPE || "openid profile",
    url: process.env.NEXT_PUBLIC_BLOCKS_OIDC_URL,
  },
});
```

On the login page, a button calls `auth.idp.redirectToProvider()`. You can remember where to return in `sessionStorage`. Blocks then sends the browser to `/login/callback`. That page calls `auth.idp.callback(window.location.href)`, then `auth.userInfo()` to see that the session cookie arrived, then sends the user into the app. Sign-in normally arrives as a Secure, httpOnly cookie; you do not have to store an access token unless the body actually contains one.

Around the private pages, read `userInfo` and offer `auth.logout()`.

For data, `client.data.collection("YourSchema", { fields: […] })` lists and writes rows. The SDK returns a GraphQL body, not a bare `{ items }`. Read `data.<field>`, treat `errors` as a failure, and take `itemId` from creates.

```json
{
  "data": { "getCategorys": { "items": [ { "ItemId": "…", "name": "…" } ] } },
  "errors": []
}
```

`res.items` is undefined here. Use `res.data.getCategorys.items` (the field name matches the collection: `getCategorys`, `insertItem`, and so on). If your UI already expects `id` and `user_id`, map `ItemId` and `CreatedBy` in one helper so the rest of the tree can stay.

If the app inserts default rows when a list looks empty, count **raw** rows. A row whose fields are still blank is not an empty collection. Hiding duplicates in the UI does not delete them in the gateway.

You can stop at list-and-create until login and a first screen work. When you are ready, point the existing forms at the same collections and retire the old server actions.

---

## Hosting

Release builds a **Dockerfile** from the linked branch and runs the container. There is no Vercel-specific path. The process inside the image should listen on port **8080** (`PORT=8080`, `HOSTNAME=0.0.0.0`).

For Next.js, `output: "standalone"` keeps the image small. Use the same package manager as the lockfile, and allow any native add-ons the install needs. Pass the public Blocks variables as build arguments and `ENV` **before** `next build`, and fail the build if the required ones are empty. If the OIDC scope has a space in it, quote it in `ENV`. Put the real values in Release secrets under the same names as `.env.example`, not as text in the Dockerfile. Empty secrets at build time produce a login button that thinks Blocks is not configured.

Ignore `node_modules`, `.next`, `.git`, and env files (keep the example) in `.dockerignore`.

In Release, run **setup** the first time (region and size if asked), and **deploy** after that. As soon as you have the live URL, add its `/login/callback` on the OIDC client if it is missing. Some setups can register that callback as part of Release. Secrets for `NEXT_PUBLIC_*` need to be present for the build that ships the client bundle.

If you want your own domain, set it on the repo in Release and add that origin’s callback on the client as well.

---

## When it is working

Open `https://<your-app-domain>/login`, use hosted sign-in, and you should land in the app still signed in.

Uploads, if you have them, need a storage provider in the console and then Data files; the attachment schema can hold the path in the meantime. Scheduled jobs, if you have them, become a Workflow on a schedule, talking to Mail or Notifier. Production is another environment in the console, another matching git branch, and the same kind of client, secrets, and callback URL on that environment.

Leave the Vercel project up until you are happy. Turning it off is the last step, not the first.

---

## In order

1. Create the project in the console and link this GitHub repo in Release.
2. Create the public OIDC client, identity provider, and first user (Mail on, if you want the activation message).
3. Fill `.env.local` from this project; put the same public names in Release secrets.
4. Publish schemas and CreatedBy access; reload.
5. Add `@seliseblocks/client`, `/login/callback`, and the data unwrap.
6. Add a Dockerfile that listens on 8080 and receives public env at build time.
7. Release setup, then deploy. Add the live URL’s `/login/callback` on the client if it is missing.
8. Sign in on the platform domain. Move forms, files, and jobs when you need them. Keep Vercel until then.
)
