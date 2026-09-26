# The server

Running the app on a machine you control, behind a Cloudflare tunnel, and
shipping each release to it.

**Assumes:** the Supabase project exists, the schema is pushed, and the
providers are set up. See [The Supabase project](supabase-project.md) and
[Authentication](authentication.md).

## 1. The machine

It needs three things:

- **Docker** with the compose plugin. On macOS, Colima or Docker Desktop.
- **A clone of the repository**, for example in `/srv/overwander`.
- **cron**, or anything else that can run a script every few minutes.

[`compose.yaml`](../../compose.yaml) runs two containers:

- `app`, the Node server built by the [`Dockerfile`](../../Dockerfile).
- `tunnel`, `cloudflared`, which connects out to Cloudflare.

Nothing is published on the host. The tunnel is the only way in, so the machine
needs no open ports and no fixed address. Both containers restart on their own,
so the Docker service itself must start on boot.

## 2. The tunnel

1. In the Cloudflare dashboard, open **Zero Trust, Networks, Tunnels** and
   create a tunnel of type **Cloudflared**.
2. Copy the token from the install command it shows. It is the long string after
   `--token`.
3. Under **Public hostnames**, add your domain with the service
   `http://app:3000`. `app` is the compose service name, which the tunnel
   container resolves.

The token goes in `.env` as `TUNNEL_TOKEN`.

## 3. Fill in the environment

Copy `.env.example` to `.env` on the server. `.env.example` documents every
variable.

The **browser's variables** are public by design and are **baked into the
build**, so a change to one needs a deploy rather than a restart:

| Variable                   | What to put there                                               |
| -------------------------- | --------------------------------------------------------------- |
| `VITE_SUPABASE_URL`        | `https://<ref>.supabase.co`                                     |
| `VITE_SUPABASE_ANON_KEY`   | The project's **publishable** or **anon** key                   |
| `VITE_SPRITE_ORIGIN`       | The sprite host's origin, such as `https://sprites.your-domain` |
| `VITE_WORLD_SEED`          | Any string, and then never touched again                        |
| `VITE_EMAIL_SIGN_IN`       | Left empty, unless the deploy is to offer passwords             |
| `VITE_REAL_TIME_OF_DAY`    | `true` for the local clock, empty for the game clock            |
| `VITE_TIME_OF_DAY_MINUTES` | Minutes per period on the game clock. Empty means 90            |

The **server's variables** are secret and are read at run time:

| Variable                    | What to put there                                                  |
| --------------------------- | ------------------------------------------------------------------ |
| `SUPABASE_DB_URL`           | The **session pooler** URI, port **5432**, with `?sslmode=require` |
| `SUPABASE_URL`              | `https://<ref>.supabase.co`                                        |
| `SUPABASE_SERVICE_ROLE_KEY` | The project's **secret** or **service_role** key                   |
| `SUPABASE_JWT_SECRET`       | **Left empty**                                                     |
| `TUNNEL_TOKEN`              | The tunnel's token from step 2                                     |

Some of those need explaining:

- **The session pooler.** The server is one long-lived process holding a pool of
  up to ten connections, so it does not need the transaction pooler that
  serverless hosts use. The live feed also holds one connection open to `LISTEN`,
  which the transaction pooler cannot do. The direct connection works too, but
  only over IPv6 unless the project pays for an IPv4 address. Copy the URI from
  the dashboard's **Connect** dialog.
- **`SUPABASE_JWT_SECRET` stays empty against a hosted project.** Hosted stacks
  sign asymmetrically, so the server fetches the project's JWKS from
  `SUPABASE_URL` and checks signatures with that. The variable is only for the
  local stack's shared HS256 secret.
- **`VITE_WORLD_SEED` decides the whole world.** Chunk seeds, biomes, landmark
  placement, spawn rolls and lair contents all derive from it. Changing it after
  players have walked anywhere leaves every stored record pointing at ground
  that no longer looks the same.
- **`VITE_SPRITE_ORIGIN` empty** makes the server serve the sprites and sounds
  itself, with the same cache headers the sprite host sends.

The build reads `.env` as a Docker build secret, so it is never stored in an
image layer.

## Which key is which

Supabase hands out two keys per project, and has two generations of names for
them. The variable names here predate the newer pair, so read them as roles
rather than as formats. Either generation works as the value.

| The variable                | Newer key                             | Older key               | What it is                          |
| --------------------------- | ------------------------------------- | ----------------------- | ----------------------------------- |
| `VITE_SUPABASE_ANON_KEY`    | **Publishable**, `sb_publishable_...` | **anon**, a JWT         | Public. Bound by row-level security |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret**, `sb_secret_...`           | **service_role**, a JWT | Secret. Ignores row-level security  |

**The anon or publishable key is meant to be in the browser.** It identifies the
project and grants nothing on its own. What a player may read is decided by the
policies in [Security](../database/security.md) and by the session token they
carry.

**The service_role or secret key bypasses every policy**, so it belongs on the
server and nowhere else. Never give it a `VITE_` name: those are inlined into
the browser bundle.

[`src/server/admin-api.ts`](../../src/server/admin-api.ts) is the only module
that uses it, for **auth admin calls**: finding a player by email, and the
account pages of the admin dashboard. Game writes go over the owner connection
in [`src/server/db.ts`](../../src/server/db.ts) instead. Leave the key unset and
those admin calls refuse while the rest of the game runs.

## 4. Deploy on release

The [release workflow](../../.github/workflows/release.yml) publishes a GitHub
release when the Version Packages pull request is merged.
[`scripts/release.sh`](../../scripts/release.sh) then publishes the sprite host
([`wrangler.jsonc`](../../wrangler.jsonc)) with `wrangler deploy`. It needs two
repository secrets:

| Secret                  | Where it comes from                                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`  | Cloudflare dashboard, **My Profile, API Tokens**, created from the **Edit Cloudflare Workers** template |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare dashboard, **Workers & Pages**, shown in the sidebar as the **Account ID**                   |

Without the token, the release still publishes and the workflow logs a warning
that the sprite host was not deployed. To publish it by hand, run
`pnpm dlx wrangler@4 deploy` while signed in with `wrangler login`.

The server fetches the release itself, so GitHub never needs a way in.
[`scripts/deploy.sh`](../../scripts/deploy.sh) checks out the newest `v*` tag,
rebuilds the `app` image and restarts it. When that tag is already live it does
nothing, so it is safe to run from cron:

```bash
*/5 * * * * /srv/overwander/scripts/deploy.sh >> /var/log/overwander-deploy.log 2>&1
```

A deploy restarts the server, so open tabs lose their connection for a moment.
Tabs from the previous build are refused by the build guard and asked to reload.

To roll back, deploy an older tag by name. That pins it, and cron leaves it
alone until it is unpinned:

```bash
scripts/deploy.sh v1.2.3   # deploy and pin
scripts/deploy.sh --unpin  # follow releases again
```

## 5. Deploy, then check it

Run `scripts/deploy.sh` once by hand for the first deploy. When it is up, check
these four things. Each one tests a different part of the setup:

1. **Sign in with Google or GitHub.** Tests the redirect list and the provider
   credentials. A sign-in that lands back on the site signed out usually means
   the redirect URL is missing its `/**`.
2. **Walk a few chunks.** Tests the browser's variables and the read policies.
3. **Catch something.** Tests `SUPABASE_DB_URL`, because a catch is a
   privileged write over the owner connection.
4. **Open a raid lobby in two browsers.** Tests the live feed: the server's
   socket at `/_live`, through the tunnel, fed by the database's change
   triggers.

`docker compose logs -f app` follows the server's output, and
`docker compose logs -f tunnel` the tunnel's.

## See also

- [Authentication](authentication.md), the step before this one
- [Schema changes](schema-changes.md), for the next release with a migration
- [Operating the game](operating.md), for what each failure means
- [Security](../database/security.md), for what the policies and grants say
