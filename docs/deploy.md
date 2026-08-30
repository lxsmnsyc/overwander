# Deploying the game

The live game is two services and nothing else:

- **Vercel** runs the app. SolidStart builds through Nitro, which detects Vercel
  on its own and writes the serverless output there.
- **Supabase** is the database, the accounts, the row-level security and the
  realtime stream, in a hosted project rather than the local Docker stack.

Nothing else needs to be stood up. There is no separate API, no queue and no
file storage: the world is derived rather than stored, and the sprites ship in
the build as static files.

If you are only running the game on your own machine, you want
[Running the database locally](database/local-stack.md) instead. This page is
about the hosted pair.

## Before you start

- A **Supabase** account, and the **Supabase CLI** on your `PATH`. The CLI is
  what pushes the schema; the dashboard cannot replay a migration folder.
- A **Vercel** account, and the repository on GitHub, GitLab or Bitbucket.
- The two OAuth apps, since a deployed build signs in with **Google and GitHub**
  and offers nothing else. The email and password form is drawn on a development
  build alone.

## 1. Make the Supabase project

Create a project, and note two things while you do:

- **The region.** Every privileged write travels over a direct Postgres
  connection, so the distance between the app's region and the database's is
  paid on every write. Pick one, then point Vercel's functions at the same part
  of the world in step 4.
- **The database password.** It is shown once, and it is half of
  `SUPABASE_DB_URL`.

The project's Postgres major version should be **17**, which is what
[`supabase/config.toml`](../supabase/config.toml) pins locally. New projects are
already there.

## 2. Push the schema

[`supabase/migrations/`](../supabase/migrations) is the whole database: tables,
functions, triggers, the row-level security, the grants and what is published to
realtime. Push it before the first deploy, since the app has nothing to talk to
until it is there.

```bash
supabase login
supabase link --project-ref <ref>   # the ref is in the project's URL
supabase db push
```

Two things to check afterwards, in the dashboard's SQL editor:

```sql
select extname from pg_extension where extname = 'pg_cron';
select jobname, schedule from cron.job;
```

**pg_cron** is the one extension the schema needs, and three jobs hang off it:
the fled-encounter sweep, the claim sweep and the encounter sweep. The first
migration creates the extension, but if the push fails on that line, enable
`pg_cron` under Database, Extensions and push again.

Migrations are never edited once pushed. A schema change is a new file, pushed
the same way, and nothing on Vercel runs one for you: **push first, deploy
second**, so the build never meets a database that is a migration behind.

## 3. Set up authentication

Under Authentication in the dashboard:

| Setting                     | What to put there                                                       |
| --------------------------- | ------------------------------------------------------------------------ |
| **Site URL**                | The production origin, `https://your-domain`                            |
| **Redirect URLs**           | `https://your-domain/**`, plus a preview pattern if you want previews    |
| **Google**, **GitHub**      | Enabled, with the client id and secret from each provider                |
| **Email sign-ups**          | Off, unless you want them: the form is not drawn on a deployed build     |

Sign-in is redirect-based, and the player is sent back to **the page they left**
rather than to a fixed callback route, so the redirect list needs the `/**`
wildcard rather than a bare origin. Vercel's preview deployments each get their
own hostname, so previews need a pattern of their own,
`https://*-<your-team>.vercel.app/**`, or a second Supabase project to point at.

In each provider's own console, the callback is Supabase's, not the site's:

```text
https://<ref>.supabase.co/auth/v1/callback
```

Signing in for the first time creates the profile row through the `auth.users`
trigger. Nothing about that needs configuring.

## 4. Make the Vercel project

Import the repository. The build needs no `vercel.json` and no framework
override:

| Setting              | Value                                                 |
| -------------------- | ----------------------------------------------------- |
| **Install command**  | `pnpm install`                                        |
| **Build command**    | `pnpm build`                                          |
| **Output directory** | Left alone. Nitro writes `.vercel/output` itself      |
| **Node version**     | **22 or newer**, which the Vite 8 toolchain expects   |
| **Function region**  | The one nearest the Supabase project from step 1      |

Nitro picks its Vercel preset off the `VERCEL` environment variable that the
builder sets, so the same `pnpm build` that produces a Node server locally
produces Vercel's build output there.

## 5. Fill in the environment

Set these in Project Settings, Environment Variables, for every environment you
mean to deploy. `.env.example` documents all of them.

The **browser's pair** is public by design and is **baked into the build**, so a
change to either needs a redeploy rather than a restart:

| Variable                 | What to put there                                  |
| ------------------------ | -------------------------------------------------- |
| `VITE_SUPABASE_URL`      | `https://<ref>.supabase.co`                        |
| `VITE_SUPABASE_ANON_KEY` | The project's anon key                             |
| `VITE_WORLD_SEED`        | Any string, and then never touched again           |

The **server's** variables are secret and are read at run time:

| Variable                    | What to put there                                                    |
| --------------------------- | --------------------------------------------------------------------- |
| `SUPABASE_DB_URL`           | The **transaction pooler** URI, port **6543**, with `?sslmode=require` |
| `SUPABASE_URL`              | `https://<ref>.supabase.co`                                           |
| `SUPABASE_SERVICE_ROLE_KEY` | The service-role key                                                  |
| `SUPABASE_JWT_SECRET`       | **Left empty**                                                        |

Three of those want a word:

- **The pooler, not the direct connection.** Copy the URI out of the dashboard's
  Connect dialog, transaction mode. Serverless functions come and go, and each
  live one holds a pool of up to ten connections; the pooler is what stands
  between that and the database's connection limit. The driver already runs with
  prepared statements off, which is what transaction mode requires.
- **`SUPABASE_JWT_SECRET` stays empty against a hosted project.** Hosted stacks
  sign asymmetrically, so the server fetches the project's JWKS from
  `SUPABASE_URL` and checks signatures with that. The variable is only for the
  local stack's shared HS256 secret.
- **`VITE_WORLD_SEED` is the planet.** Chunk seeds, biomes, landmark placement,
  spawn rolls and lair contents all derive from it. Changing it after players
  have walked anywhere leaves every stored record pointing at ground that no
  longer looks the same.

If you give preview deployments their own Supabase project, give them their own
values here too, scoped to the Preview environment.

## 6. Deploy, then check it

Push to the production branch, or press Deploy. When it is up, walk through the
four things that each prove a different half of the setup:

1. **Sign in with Google or GitHub.** Proves the redirect list and the provider
   credentials. A sign-in that lands back on the site signed out usually means
   the redirect URL is missing its `/**`.
2. **Walk a few chunks.** Proves the browser's pair and the read policies.
3. **Catch something.** Proves `SUPABASE_DB_URL`: a catch is a privileged write,
   and the whole of that path is the owner connection.
4. **Open a raid lobby in two browsers.** Proves realtime, which is a separate
   socket with its own policies.

## Making yourself an admin

A development build hands every new account the `admin` role. That grant is
behind `import.meta.env.DEV`, so it is not merely skipped in a deployed build,
it is not in the bundle. Grant it by hand once, in the SQL editor:

```sql
update profiles set role = 'admin' where id = '<your uid>';
```

Your uid is the account's id under Authentication, Users. What each role may do
is in [Security](database/security.md).

## What does not work on a deployed build, by design

- **The sprite tools.** The admin sprite processor writes finished sheets into
  `public/`, which is only ever right on a machine where `public/` is the working
  tree. A deployed server serves those files out of a bundle, so the write is
  refused rather than attempted. The pages are hidden on a deployed build; the
  refusal is the real guard.
- **The email and password form.** Drawn on a development build alone, which is
  what the browser tests sign in with.

## Keeping it running

- **Push migrations before deploying**, always in that order. A build that
  reaches a database missing a table fails at the first read of it rather than
  at start-up, which is a worse place to find out.
- **Free-tier projects pause** after a week of no activity, and a paused project
  answers nothing. A game nobody is playing goes quiet on its own.
- **Backups are the database's.** The world needs none, since it is derived, but
  every catch, bag, auction and friendship is a row.
- **The clock is the server's.** `src/server/*` runs in UTC deliberately, and
  Vercel's functions already do, so nothing needs setting for it.

## When something is wrong

**Every write fails, reads are fine.** `SUPABASE_DB_URL` is unset or wrong. The
game is built to read without it and refuse every write, which looks like a
permissions problem and is not.

**`SUPABASE_DB_URL is not set` in the function logs.** The variable is missing
from that environment. Preview and production are configured separately.

**Sign-in loops back signed out.** The origin is not on the redirect list, or is
there without `/**`. Preview hostnames change per deployment and need a pattern.

**"Not signed in" on every server call, with a valid session.** The server
cannot verify the token. Check that `SUPABASE_URL` names the same project the
browser is signed in to, and that `SUPABASE_JWT_SECRET` is empty rather than
holding a local stack's secret.

**Connections exhausted, or timeouts under load.** The direct connection is
being used instead of the pooler. It is port 6543, transaction mode.

**A player's screen never updates until reload.** Realtime is not reaching them.
The publication is created by the migrations, so the usual cause is a schema
pushed only in part.

## See also

- [Running the database locally](database/local-stack.md)
- [Security](database/security.md), for what the policies and grants say
- [The database](database.md), for every table and who may touch it
