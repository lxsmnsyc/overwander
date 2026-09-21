# Vercel

The build settings, the environment variables, and the first deploy.

**Assumes:** the Supabase project exists, the schema is pushed, and the
providers are set up. See [The Supabase project](supabase-project.md) and
[Authentication](authentication.md).

## 1. Make the Vercel project

Import the repository. The build needs no framework override. The
[`vercel.json`](../../vercel.json) at the root only limits automatic deployments
to pushes on `main`, so other branches get no preview unless you deploy one by
hand.

| Setting              | Value                                                 |
| -------------------- | ----------------------------------------------------- |
| **Install command**  | `pnpm install`                                        |
| **Build command**    | `pnpm build`                                          |
| **Output directory** | Left alone. Nitro writes `.vercel/output` itself      |
| **Node version**     | **22 or newer**, which the Vite 8 toolchain expects   |
| **Function region**  | The one nearest the Supabase project                  |

Nitro picks its Vercel preset off the `VERCEL` environment variable that the
builder sets, so the same `pnpm build` that produces a Node server locally
produces Vercel's build output there.

## 2. Fill in the environment

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
  live one holds a pool of up to ten connections. The pooler is what stands
  between that and the database's connection limit. The driver already runs with
  prepared statements off, which is what transaction mode requires.
- **`SUPABASE_JWT_SECRET` stays empty against a hosted project.** Hosted stacks
  sign asymmetrically, so the server fetches the project's JWKS from
  `SUPABASE_URL` and checks signatures with that. The variable is only for the
  local stack's shared HS256 secret.
- **`VITE_WORLD_SEED` decides the whole world.** Chunk seeds, biomes, landmark
  placement, spawn rolls and lair contents all derive from it. Changing it after
  players have walked anywhere leaves every stored record pointing at ground
  that no longer looks the same.

If you give preview deployments their own Supabase project, give them their own
values here too, scoped to the Preview environment.

## Which key is which

Supabase hands out two keys per project, and has two generations of names for
them. The variable names here predate the newer pair, so read them as roles
rather than as formats. Either generation works as the value, since both are
passed to the client as a string.

| The variable                | Newer key                | Older key      | What it is                                          |
| --------------------------- | ------------------------ | -------------- | --------------------------------------------------- |
| `VITE_SUPABASE_ANON_KEY`    | **Publishable**, `sb_publishable_...` | **anon**, a JWT | Public. Bound by row-level security |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret**, `sb_secret_...`           | **service_role**, a JWT | Secret. Ignores row-level security |

Both are on the project's API settings page, and `supabase status` prints the
local stack's.

**The anon or publishable key is meant to be in the browser.** It is in the
JavaScript bundle of every Supabase app, this one included. It identifies the
project and grants nothing on its own. What a player may read is decided by the
policies in [Security](../database/security.md) and by the session token they
carry. Restricting it would break the game rather than protect it.

**The service_role or secret key is the opposite of that.** It bypasses every
policy and can read or write any row, so it belongs on the server and nowhere
else. Never give it a `VITE_` name: those are inlined into the browser bundle at
build time, and publishing one hands the project away.

This game asks little of it. Game data does not travel over that key at all.
Every privileged write goes over the owner connection in
[`src/server/db.ts`](../../src/server/db.ts), which is a separate bypass.
[`src/server/admin-api.ts`](../../src/server/admin-api.ts) is the only module
that uses the key, and only for **auth admin calls**: finding a player by email,
and the account pages of the admin dashboard. Accounts live in `auth.users`,
which nothing else may ask. Leave it unset and those calls refuse while the rest
of the game runs, which makes it a reasonable thing to leave out of a preview
environment.

The newer keys are worth preferring where a project offers them. Several may
exist at once, and one can be revoked or rotated on its own.

## 3. Deploy, then check it

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

## See also

- [Authentication](authentication.md), the step before this one
- [Schema changes](schema-changes.md), for the next release with a migration
- [Operating the game](operating.md), for what each failure means
- [Security](../database/security.md), for what the policies and grants say
