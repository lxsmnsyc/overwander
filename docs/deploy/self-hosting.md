# Self-hosting

Running the whole game on your own machines, with no Vercel, no Supabase project
and no Cloudflare account.

**Assumes:** you can run Docker or Postgres on a host you control, and you have a
domain name pointed at it.

## What the game actually needs

The app talks to four things. Three of them are open-source services that Supabase
the company publishes and anybody may run, and the fourth is the app itself.

| Piece         | What it is                    | Why it is needed                                                     |
| ------------- | ----------------------------- | -------------------------------------------------------------------- |
| **Postgres**  | Version 17, as the stack runs | Every row, every policy, and the cron jobs that sweep old data        |
| **GoTrue**    | Supabase Auth, an HTTP server | Accounts. 55 foreign keys point at `auth.users`, so it cannot be left out |
| **PostgREST** | The REST layer over Postgres  | Every read the browser makes, under row-level security                |
| **Realtime**  | The websocket server          | Lobbies, trades, auctions and gym seats update without polling        |
| **The app**   | Node 26 running the build     | The pages, and the privileged writes in `src/server/`                 |

There is no queue, no object storage and no separate API. The world is derived
from its seed rather than stored, and the sprites are static files.

The quickest way to stand the first four up is the self-host compose file from
the Supabase repository, which runs those images on your own host and talks to
nobody else. Using it is not the same as using their hosted service. Assembling
the three services yourself works too, and the gotchas below are the parts that
bite when you do.

## 1. The database

Create the database, then the two extensions the schema expects:

```sql
create extension if not exists pg_cron;
create extension if not exists pg_trgm;
```

`pg_cron` has to be loaded by the server, not only created, so `postgresql.conf`
needs `shared_preload_libraries = 'pg_cron'` and a restart. Without it the four
sweep jobs never run and the database grows forever.

Start GoTrue once before applying the migrations. It creates the `auth` schema
and the `auth.users` table that almost every table in this schema references.

Then apply `supabase/migrations/` in filename order. The Supabase CLI does it
against any Postgres, hosted or not:

```bash
supabase db push --db-url 'postgresql://user:password@host:5432/postgres'
```

If you would rather not use the CLI, run each file with `psql` in order and keep
your own record of which have been applied. The CLI keeps that record in
`supabase_migrations.schema_migrations`, and later releases expect it.

## 2. The roles and helpers the schema assumes

The migrations were written against the role names the Supabase images create.
If you assembled the services yourself, create these before the first migration:

- `anon`, `authenticated` and `service_role`, granted to the `authenticator`
  login role that PostgREST connects as. The schema grants to them 93 times.
- `auth.uid()`, returning the `sub` claim of the request's JWT as a `uuid`. It is
  the whole of row-level security here, read 45 times across the 55 policies.
- The `supabase_realtime` publication. Six migrations add tables to it, and a
  publication that does not exist fails the migration rather than the feature.

All three come with the compose file. Only a hand-assembled stack needs them
written out.

## 3. One JWT secret, four readers

GoTrue signs the tokens. PostgREST, Realtime and the game's own server all verify
them. Give every one of them the same secret, and make it long and random.

The app server reads `SUPABASE_JWT_SECRET` and verifies signatures itself, with
no round trip. Left empty it fetches a JWKS from the auth server instead, which
works but costs a request on a cold start.

## 4. The app

Node 26 and pnpm, as the test workflow uses. The build writes a plain Node
server, so nothing about the deployment is serverless:

```bash
pnpm install
pnpm build
node .output/server/index.mjs
```

It listens on `PORT`, which defaults to 3000. Run it under systemd, Docker or
whatever keeps a process alive on your host.

Sprites are the one difference from the live game, and it is in your favour.
The live build keeps `public/sprites` out of the upload and serves them from a
separate host. Your build has no such exclusion, so the Node server serves them
from `.output/public` and `VITE_SPRITE_ORIGIN` stays empty, which means "this
origin". Point your proxy at that tree with a long cache lifetime:

```
Cache-Control: public, max-age=31536000, immutable
```

The paths are content-addressed with a `?v=` digest, so a regenerated sheet
arrives under a new URL and a year-long cache is safe. If you do move the
sprites to a second host, set `VITE_SPRITE_ORIGIN` to it and send
`Access-Control-Allow-Origin` with them: the terrain pack is drawn into a canvas
and read back, and a cross-origin image without that header taints the canvas.

## 5. The environment

Copy `.env.example` and fill it in. Against your own stack the values are:

| Variable                    | What to put                                                        |
| --------------------------- | ------------------------------------------------------------------ |
| `VITE_SUPABASE_URL`         | The public URL of your API gateway, the one the browser calls       |
| `VITE_SUPABASE_ANON_KEY`    | The anon key you generated for that stack                           |
| `VITE_SPRITE_ORIGIN`        | Empty, unless the sprites live on another host                      |
| `VITE_WORLD_SEED`           | Any string. It decides the entire world                             |
| `VITE_WORLD_GENERATION`     | `2` for a new world, empty for the first                            |
| `SUPABASE_URL`              | The same API URL, read by the server                                |
| `SUPABASE_DB_URL`           | A direct Postgres connection as the table owner                     |
| `SUPABASE_SERVICE_ROLE_KEY` | The service key. Only the auth admin calls need it                  |
| `SUPABASE_JWT_SECRET`       | The shared signing secret                                           |

`SUPABASE_DB_URL` bypasses row-level security by design, because it connects as
the table owner. It belongs to the server process and nowhere near the browser.

Put a reverse proxy with TLS in front of both the app and the API gateway. Caddy
gets certificates on its own; nginx with certbot does the same job.

## 6. Signing in

A deployed build offers Google and GitHub, and nothing else. The email and
password form is behind `import.meta.env.DEV`, so it is not in a production
bundle at all.

That means two OAuth apps, neither of which is a hosting account:

- Google Cloud, OAuth client, with your auth server's `/auth/v1/callback` as the
  redirect URI.
- GitHub, developer settings, OAuth app, the same callback.

Put the client ids and secrets in GoTrue's configuration, set its site URL to
your domain, and add the domain to its redirect allow list.

If you want the email form instead, GoTrue can do it, but you also have to
remove the `DEV` guard in `src/components/app/LoginForm.tsx` and give GoTrue an
SMTP server for confirmations and password resets.

## 7. Make yourself an admin

A development build grants the `admin` role on sign-up. That grant is behind
`import.meta.env.DEV` and is not in your build, so do it once by hand:

```sql
update profiles set role = 'admin' where id = '<your uid>';
```

The uid is the row in `auth.users`. [Security](../database/security.md) says what
each role may do.

## What it costs to run

Measured from real payloads, one active player costs about 0.8MB of traffic an
hour and about 15KB of storage that is kept for good. In round numbers:

- 150 players online at once: about 0.3Mbit/s of upstream and 16 requests a
  second.
- 1,000 players online at once: about 2Mbit/s and 107 requests a second, and
  roughly 11GB of database growth a month.

Neither number is large. A small server on a domestic fibre line runs further
into the thousands of players than the free tiers of the hosted pair do, which is
the main reason to do this at all.

## Upkeep

- **Back the database up.** Every catch, bag, auction and friendship is a row.
  The world itself needs no backup, since it is derived from the seed.
- **Leave the seed and the generation alone.** Both decide what the ground looks
  like. Changing either moves every town, landmark and cave for everybody who has
  already played.
- **Keep the server's clock in UTC.** `src/server/timezone.ts` pins it, so a host
  in another zone needs nothing set, but a clock that is simply wrong breaks the
  five-minute spawn windows.
- **Push migrations before deploying the build that needs them**, always in that
  order.
- **Watch the sweep jobs.** `select * from cron.job_run_details order by
  start_time desc limit 20;` says whether they are running. They are what keeps
  the database from growing without bound.

## What you give up

- Backups, point-in-time recovery, upgrades and certificate renewal are yours.
- One host is one point of failure. Neither the app nor the database has a
  failover here.
- Players far from your host pay the round trip on every call. Battles run in
  the browser, so they are unaffected, but encounters, throws and dialogs are
  not.
- The machine holds every player's account. The service key, the JWT secret and
  the database password all live on it.

## See also

- [Deploying the game](../deploy.md), for the hosted pair this replaces
- [Running the database locally](../database/local-stack.md), which is the same
  stack on a laptop
- [Security](../database/security.md), for what the policies and grants say
- [Operating the game](operating.md), for the parts that are the same either way
