# Moving off Supabase

The one-time move of the live game's data from the Supabase project to the
server's own Postgres. It takes a short maintenance window.

Deploying the first build with the `db` service is the moment the app changes
databases, because `compose.yaml` points the app at `db` from then on. Every
step below is arranged around that.

## Before the window

1. **Run the builds before the move on Supabase first.** Push the two migrations
   that came with them, then let their release deploy:

   ```bash
   supabase db push   # 20261003000100_live_changes and 20261003000200_accounts
   ```

   Check that players sign in and that lobbies update live.

2. **Stop the server following releases** until the data is across. Pin the tag
   it runs now:

   ```bash
   scripts/deploy.sh v1.2.3   # the tag that is live
   ```

3. **Add the new settings** to the server's `.env`:
   - `POSTGRES_PASSWORD`, long and random.
   - `BACKUP_BUCKET` and `CLOUDFLARE_API_TOKEN`, for the backups (see [The server](server.md#6-backups)).

   Leave `SUPABASE_DB_URL` pointing at Supabase until the window.

4. **Start the new database and give it the schema.** It is empty and nothing
   reads it yet:

   ```bash
   git fetch --tags && git checkout <the new release tag>
   docker compose up --detach --wait db
   SUPABASE_DB_URL=postgresql://postgres:<POSTGRES_PASSWORD>@127.0.0.1:54322/overwander pnpm migrate
   ```

5. **Announce the window** with a row in `announcements`, as
   [Operating the game](operating.md) shows.

## The window

1. **Close the game.** In the Supabase SQL editor:

   ```sql
   update switches set closed = true where feature = 'everything';
   ```

   Every call from a player without a role is refused from here on, so nothing
   changes under the copy.

2. **Dump the data.** On a machine with the Supabase CLI linked to the project:

   ```bash
   supabase db dump --linked --data-only --use-copy -f data.sql
   ```

3. **Load it** into the new database, on the server:

   ```bash
   node scripts/public-data.ts data.sql | docker compose exec -T db \
     psql -U postgres -d overwander -v ON_ERROR_STOP=1 --single-transaction
   ```

   It prints how many tables it found. Anything that fails loads nothing, and the
   step can run again.

4. **Compare the row counts.** Run this on both databases, in the Supabase SQL
   editor and in `docker compose exec db psql -U postgres -d overwander`. The two
   lists should be the same:

   ```sql
   select table_name,
          (xpath('/row/n/text()', query_to_xml(format('select count(*) as n from %I', table_name), false, true, '')))[1]::text::int as n
   from information_schema.tables
   where table_schema = 'public' and table_type = 'BASE TABLE' and table_name <> 'schema_migrations'
   order by 1;
   ```

5. **Deploy the new build.** It runs against `db` from its first request:

   ```bash
   scripts/deploy.sh <the new release tag>
   scripts/deploy.sh --unpin
   ```

   Then point the host's own tools at the new database in `.env`:

   ```text
   SUPABASE_DB_URL=postgresql://postgres:<POSTGRES_PASSWORD>@127.0.0.1:54322/overwander
   ```

6. **Check it** the way [The server](server.md#5-deploy-then-check-it) says: sign
   in, walk, catch, open a lobby in two browsers.

7. **Open the game** on the new database:

   ```bash
   docker compose exec db psql -U postgres -d overwander \
     -c "update switches set closed = false where feature = 'everything'"
   ```

8. **Schedule the backups** (see [The server](server.md#6-backups)).

## Going back

Until the new database has taken writes worth keeping, going back is a deploy:

```bash
scripts/deploy.sh <the previous tag>
```

The previous build reads `SUPABASE_DB_URL`, so set it back to Supabase first,
and reopen the game there. Anything written to the new database since the move
is left behind.

Pause the Supabase project rather than deleting it, and keep it for a few weeks.

## After the move

- Players keep their sessions, since the sessions and signing keys are copied too.
- New schema changes go in `db/migrations`. The files under `supabase/migrations`
  are history and are removed in the last phase of the move.
