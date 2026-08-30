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
the same way, and nothing on Vercel runs one for you. [Shipping a schema
change](#shipping-a-schema-change) is the whole of that loop.

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

That is worth sitting with, because it decides how many OAuth apps you need:
**one per Supabase project, not one per hostname**. The player's browser goes to
the provider, the provider returns to Supabase, and Supabase returns to whatever
page the player left, which is why the site's own origins are configured in the
redirect list above and nowhere else. Production and every preview deployment
share one app.

Signing in for the first time creates the profile row through the `auth.users`
trigger. Nothing about that needs configuring.

### GitHub, step by step

**In GitHub.** Settings, Developer settings, OAuth Apps, New OAuth App. It sits
under your account, or under an organisation if the project should belong to
one:

| Field                        | What to put there                          |
| ---------------------------- | ------------------------------------------ |
| Application name             | What the player is asked to authorise      |
| Homepage URL                 | `https://your-domain`                      |
| Authorization callback URL   | `https://<ref>.supabase.co/auth/v1/callback` |

Create it, then **Generate a new client secret**. The secret is shown once.

**In Supabase.** Authentication, Providers, GitHub. Turn it on, paste the client
id and the secret, and save. The callback URL is printed on that same page,
which is the one to copy into GitHub if you are doing this in the other order.

**Then check it.** Sign in on the deployed site. A first sign-in shows GitHub's
authorisation screen once and comes back signed in.

Three things worth knowing about GitHub in particular:

- **The email may be private.** GitHub only hands over an address if the account
  has a verified one, and Supabase asks for the `user:email` scope to reach it.
  An account with no verified address is refused rather than let in without one.
- **The display name is GitHub's `name`, not the login.** An account that has
  left its name blank arrives with none, and the profile trigger writes
  **Trainer** instead. The player renames themselves in the game, so this is a
  starting point rather than a problem.
- **The avatar is ignored.** A trainer is seen as the overworld character they
  earned, so nothing reads the provider's picture.

### Google, step by step

Same shape, more paperwork: Google wants to know what the app is before it will
let strangers sign in to it.

**In Google Cloud.** Pick a project or make one, then go to the OAuth consent
screen, which newer consoles file under Google Auth Platform:

| Field                   | What to put there                                     |
| ----------------------- | ------------------------------------------------------ |
| User type or audience   | **External**, unless everyone signing in is in one Workspace |
| App name, support email | What the player is shown on the consent screen         |
| Developer contact       | Where Google writes to you about the app               |
| Scopes                  | The default three: `openid`, `email`, `profile`        |

Those scopes are the non-sensitive ones, so nothing here needs Google's
verification review. Asking for more does.

Then Credentials, Create credentials, **OAuth client ID**, application type
**Web application**:

| Field                          | What to put there                            |
| ------------------------------ | -------------------------------------------- |
| Authorised redirect URI        | `https://<ref>.supabase.co/auth/v1/callback` |
| Authorised JavaScript origins  | Nothing. The game uses the redirect flow, not One Tap |

Creating it shows the client id and secret.

**In Supabase.** Authentication, Providers, Google. Turn it on, paste the id and
the secret, save.

**Then publish it.** An app left in **Testing** only admits the accounts listed
as test users, and hands out sessions that expire after seven days, which looks
exactly like players being randomly signed out. Publishing to Production is a
button on the consent screen, and with only the default scopes it takes effect
immediately.

Google is the easier of the two to live with once it is up: every account has a
verified address, and the name comes through, so nobody arrives called
**Trainer** unless they signed in with GitHub.

### Signing in with a provider locally

The local stack runs its own auth server, so it needs its own OAuth app: a
second one whose callback is `http://127.0.0.1:54321/auth/v1/callback`. Most of
the time this is not worth doing, since a development build draws the email and
password form and `pnpm seed` leaves two accounts ready to use.

If you do want it, add the provider to
[`supabase/config.toml`](../supabase/config.toml) and keep the secret out of the
file:

```toml
[auth.external.github]
enabled = true
client_id = "env(SUPABASE_AUTH_EXTERNAL_GITHUB_CLIENT_ID)"
secret = "env(SUPABASE_AUTH_EXTERNAL_GITHUB_SECRET)"

[auth.external.google]
enabled = true
client_id = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID)"
secret = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET)"
```

Put the variables in `.env`, and restart the stack with `pnpm db:stop && pnpm db`
so the auth container picks them up. While you are in that file, note that
`site_url` and `additional_redirect_urls` still name port **4321** and the dev
server runs on **3000**: a local sign-in comes back nowhere until one of them is
corrected.

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
| `VITE_SUPABASE_ANON_KEY` | The project's **publishable** or **anon** key      |
| `VITE_WORLD_SEED`        | Any string, and then never touched again           |

The **server's** variables are secret and are read at run time:

| Variable                    | What to put there                                                    |
| --------------------------- | --------------------------------------------------------------------- |
| `SUPABASE_DB_URL`           | The **transaction pooler** URI, port **6543**, with `?sslmode=require` |
| `SUPABASE_URL`              | `https://<ref>.supabase.co`                                           |
| `SUPABASE_SERVICE_ROLE_KEY` | The project's **secret** or **service_role** key                      |
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

### Which key is which

Supabase hands out two keys per project, and has two generations of names for
them. The variable names here predate the newer pair, so read them as roles
rather than as formats: either generation works as the value, since both are
passed to the client as a string.

| The variable                | Newer key                | Older key      | What it is                                          |
| --------------------------- | ------------------------ | -------------- | --------------------------------------------------- |
| `VITE_SUPABASE_ANON_KEY`    | **Publishable**, `sb_publishable_...` | **anon**, a JWT | Public. Bound by row-level security |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret**, `sb_secret_...`           | **service_role**, a JWT | Secret. Ignores row-level security |

Both are on the project's API settings page, and `supabase status` prints the
local stack's.

**The anon or publishable key is meant to be in the browser.** It is in the
JavaScript bundle of every Supabase app, this one included. It identifies the
project and grants nothing on its own: what a player may read is decided by the
policies in [Security](database/security.md) and by the session token they
carry. Restricting it would break the game rather than protect it.

**The service_role or secret key is the opposite of that.** It bypasses every
policy and can read or write any row, so it belongs on the server and nowhere
else. Never give it a `VITE_` name: those are inlined into the browser bundle at
build time, and publishing one hands the project away.

This game asks little of it. Game data does not travel over that key at all:
every privileged write goes over the owner connection in
[`src/server/db.ts`](../src/server/db.ts), which is a separate bypass.
[`src/server/admin-api.ts`](../src/server/admin-api.ts) is the only module that
uses the key, and only for **auth admin calls**: finding a player by email, and
the account pages of the admin dashboard. Accounts live in `auth.users`, which
nothing else may ask. Leave it unset and those calls refuse while the rest of
the game runs, which makes it a reasonable thing to leave out of a preview
environment.

The newer keys are worth preferring where a project offers them: several may
exist at once, and one can be revoked or rotated on its own.

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

## Shipping a schema change

Nothing on Vercel touches the database. A release with a migration in it is two
deployments, yours and the CLI's, and the order between them is the only part
that can go wrong.

### Write it locally

```bash
supabase migration new gym_seat_freeing   # writes a timestamped empty file
# edit supabase/migrations/<timestamp>_gym_seat_freeing.sql
pnpm db:reset                             # replay everything, including the new one
pnpm test:rules                           # the policies still say what they should
```

`pnpm db:reset` is the real test of a migration: it replays the folder from
nothing, which is what a fresh environment does. A file that only works against
your current database is a file that works once.

A new table needs two things beyond its columns, both easy to forget because the
originals were done in bulk: **its own grants**, and **its own policy** or a
deliberate decision to have none. [Changing the
schema](database/local-stack.md#changing-the-schema) covers both, and
[Security](database/security.md) covers what the existing policies say.

If the browser is meant to watch the new table live, it also needs a line in the
realtime publication, and `replica identity full` if the client filters updates
or merges deletes:

```sql
alter publication supabase_realtime add table gym_seats;
alter table gym_seats replica identity full;
```

### See what the project is missing

```bash
supabase migration list        # local files against what the project has applied
supabase db push --dry-run     # exactly what would run
```

`migration list` prints a row per file with a **Local** and a **Remote** column.
Anything with a local version and no remote one is what the next push will
apply, in that order.

### Push it, then deploy

```bash
supabase db push
```

The order depends on which way the change cuts:

| The change                                  | Order                                                |
| ------------------------------------------- | ---------------------------------------------------- |
| **Adding** a table, column, index or policy | **Push, then deploy.** The old code ignores what it does not know about |
| **Dropping or renaming** one                | **Deploy, then push.** The new code stops using it first |

A rename is therefore two releases rather than one: add the new column and write
to both, deploy, backfill, then drop the old one in a later migration once
nothing reads it. The alternative is a window where the live site is talking to
a schema that no longer has what it asks for, and that window is however long
the Vercel build takes.

Two more things worth knowing before pushing to a live project:

- **There are no down migrations here.** A mistake is fixed by a new file, not by
  reversing an old one. Nothing in this repository has ever needed a rollback,
  which is a reason to keep migrations small rather than a reason to trust them.
- **Creating an index locks the table against writes** while it builds. On a
  table with any size to it, build it with `create index concurrently` from the
  dashboard's SQL editor, and keep the plain `create index` in the migration file
  for the environments that replay from empty.

### Check it landed

In the SQL editor:

```sql
select jobname, schedule from cron.job;    -- if the migration scheduled one
select * from pg_policies where tablename = 'gym_seats';
```

`supabase migration list` should now show the same version on both sides. Then
deploy the app, or let the push be the whole of the release if no code changed.

### Preview deployments share whatever they point at

A preview pointed at the production project is talking to the production
database, so a migration pushed to try something out is pushed to the live game.
Give previews their own Supabase project if you expect to be pushing
half-finished schema at them, and their own environment variables to match.

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

**Looking a player up by email refuses, everything else works.**
`SUPABASE_SERVICE_ROLE_KEY` is unset. Only the auth admin calls need it.

**A player's screen never updates until reload.** Realtime is not reaching them.
The publication is created by the migrations, so the usual cause is a schema
pushed only in part.

## See also

- [Running the database locally](database/local-stack.md)
- [Security](database/security.md), for what the policies and grants say
- [The database](database.md), for every table and who may touch it
