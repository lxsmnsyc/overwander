# The server

Running the app on a machine you control, behind a Cloudflare tunnel, and
shipping each release to it.

**Assumes:** the providers are set up. See [Authentication](authentication.md).
For the one-time move of the live data, see [Moving off Supabase](moving-off-supabase.md).

## 1. The machine

It needs three things:

- **Docker** with the compose plugin. On macOS, Colima or Docker Desktop.
- **A clone of the repository**, for example in `/srv/overwander`.
- **cron**, or anything else that can run a script every few minutes.

[`compose.yaml`](../../compose.yaml) runs three containers:

- `db`, Postgres 17 with `pg_cron`, built from [`db/Dockerfile`](../../db/Dockerfile).
  Its data is in the `overwander_db` volume.
- `app`, the Node server built by the [`Dockerfile`](../../Dockerfile). It applies
  any pending migration as it starts, before it answers a request.
- `tunnel`, `cloudflared`, which connects out to Cloudflare.

The tunnel is the only way in, so the machine needs no open ports and no fixed
address. The database listens on `127.0.0.1:54322` for the host's own tools and
nowhere else. All three restart on their own, so the Docker service itself must
start on boot.

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
| `VITE_SPRITE_ORIGIN`       | The sprite host's origin, such as `https://sprites.your-domain` |
| `VITE_WORLD_SEED`          | Any string, and then never touched again                        |
| `VITE_REAL_TIME_OF_DAY`    | `true` for the local clock, empty for the game clock            |
| `VITE_TIME_OF_DAY_MINUTES` | Minutes per period on the game clock. Empty means 90            |

The **server's variables** are secret and are read at run time:

| Variable                                | What to put there                                                        |
| --------------------------------------- | ------------------------------------------------------------------------ |
| `POSTGRES_PASSWORD`                     | The database's password. Long and random                                 |
| `DATABASE_URL`                          | `postgresql://postgres:<POSTGRES_PASSWORD>@127.0.0.1:54322/overwander`   |
| `BETTER_AUTH_SECRET`                    | A long random string. See [Authentication](authentication.md)            |
| `BETTER_AUTH_URL`                       | `https://your-domain`                                                    |
| `GOOGLE_CLIENT_*`, `GITHUB_CLIENT_*`    | The OAuth apps' ids and secrets. See [Authentication](authentication.md) |
| `TUNNEL_TOKEN`                          | The tunnel's token from step 2                                           |
| `BACKUP_BUCKET`, `CLOUDFLARE_API_TOKEN` | Where backups go. See [Backups](#6-backups)                              |

Some of those need explaining:

- **`DATABASE_URL` is for the host's tools**, such as `pnpm migrate`, and on
  the server it names production. Inside compose the app is pointed at the `db`
  service instead. A development checkout on the same machine points it at its
  own database (see [Running the database locally](../database/local-stack.md)),
  so development never reaches the live game's data.
- **`VITE_WORLD_SEED` decides the whole world.** Chunk seeds, biomes, landmark
  placement, spawn rolls and lair contents all derive from it. Changing it after
  players have walked anywhere leaves every stored record pointing at ground
  that no longer looks the same.
- **`VITE_SPRITE_ORIGIN` empty** makes the server serve the sprites and sounds
  itself, with the same cache headers the sprite host sends.

The build reads `.env` as a Docker build secret, so it is never stored in an
image layer.

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

1. **Sign in with Google or GitHub.** Tests `BETTER_AUTH_URL` and the provider
   credentials. A provider that answers with a redirect error has a callback
   that does not match `BETTER_AUTH_URL`.
2. **Walk a few chunks.** Tests the browser's variables and the server's reads.
3. **Catch something.** Tests the database, since a catch is a write.
4. **Open a raid lobby in two browsers.** Tests the live feed: the server's
   socket at `/_live`, through the tunnel, fed by the database's change
   triggers.

`docker compose logs -f app` follows the server's output, and
`docker compose logs -f tunnel` the tunnel's.

## 6. Backups

[`scripts/backup.sh`](../../scripts/backup.sh) dumps the database, keeps two
weeks of dumps in `backups/`, and copies each one to an R2 bucket. A dump that
stays on the machine is lost with its disk, so set up the bucket:

1. In the Cloudflare dashboard, open **R2** and create a bucket, for example
   `overwander-backups`. Put its name in `.env` as `BACKUP_BUCKET`.
2. Create an API token that may edit that bucket, and put it in `.env` as
   `CLOUDFLARE_API_TOKEN`.
3. Run it nightly from cron:

   ```bash
   15 4 * * * /srv/overwander/scripts/backup.sh >> /var/log/overwander-backup.log 2>&1
   ```

To restore a dump into an empty database:

```bash
docker compose exec -T db pg_restore -U postgres -d overwander --clean --if-exists < backups/<file>.dump
```

Check the sweeps now and then. `pg_cron` runs them inside the database:

```sql
select jobname, status, start_time from cron.job_run_details order by start_time desc limit 20;
```

## Without Cloudflare

The tunnel is one way in, not the only one. To use your own reverse proxy
instead, leave `TUNNEL_TOKEN` empty, stop the `tunnel` service, and publish the
app's port to the proxy in a `compose.override.yaml`:

```yaml
services:
  app:
    ports:
      - 127.0.0.1:3000:3000
```

The proxy must pass WebSocket upgrades on `/_live`. Caddy and nginx both do with
their usual reverse proxy settings. With no sprite host, leave
`VITE_SPRITE_ORIGIN` empty and the server serves the sprites itself.

## See also

- [Authentication](authentication.md), the step before this one
- [Schema changes](schema-changes.md), for the next release with a migration
- [Operating the game](operating.md), for what each failure means
- [Moving off Supabase](moving-off-supabase.md), for the one-time move of the live data
