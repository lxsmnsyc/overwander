# Moving off Supabase

The one-time move of the live game from its Supabase project to the server's own
Postgres and accounts. It takes a short maintenance window.

The first build with the `db` service changes databases the moment it deploys,
because `compose.yaml` points it at `db`. Every step below is arranged around
that. Builds from before the move read `SUPABASE_DB_URL`, and builds from after
it read `DATABASE_URL`, so `.env` holds both until the move is done.

**Assumes:** the server runs the build from before the move (see
[The server](server.md)), and a machine has the Supabase CLI and this repository.

## Before the window

1. **Stop the server following releases** until the data is across. Pin the tag
   it runs now:

   ```bash
   scripts/deploy.sh v1.2.3   # the tag that is live
   ```

2. **Push the last two Supabase migrations.** On the machine with the CLI:

   ```bash
   supabase link --project-ref <ref>
   supabase db push   # 20261003000100_live_changes and 20261003000200_accounts
   ```

   Both are safe under the live build. The first adds triggers that nothing
   listens to yet. The second copies every account into the new `users` table,
   and a player who signs up through Supabase after it lands is copied too.

3. **Set up sign-in** as [Authentication](authentication.md#moving-from-supabase-auth)
   describes: the new Google redirect URI, and a new GitHub app.

4. **Add the new settings** to the server's `.env`, leaving `SUPABASE_DB_URL` as
   it is for the live build:
   - `POSTGRES_PASSWORD`, long and random.
   - `DATABASE_URL=postgresql://postgres:<POSTGRES_PASSWORD>@127.0.0.1:54322/overwander`,
     for the tools run on the host.
   - `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` and the OAuth credentials.
   - `BACKUP_BUCKET` and `CLOUDFLARE_API_TOKEN` (see [Backups](server.md#6-backups)).

5. **Start the new database and give it the schema.** The server needs Node and
   pnpm for this and the load below. The database is empty and nothing reads it
   yet:

   ```bash
   git fetch --tags && git checkout <the new release tag>
   pnpm install
   docker compose up --detach --wait db
   pnpm migrate
   ```

6. **Announce the window** with a row in `announcements`, as
   [Operating the game](operating.md) shows.

## The window

1. **Close the game.** In the Supabase SQL editor:

   ```sql
   update switches set closed = true where feature = 'everything';
   ```

   Every call from a player without a role is refused from here on, so nothing
   changes under the copy.

2. **Dump the data**, on the machine with the CLI:

   ```bash
   supabase db dump --linked --data-only --use-copy -f data.sql
   ```

3. **Load it** into the new database, on the server:

   ```bash
   node scripts/public-data.ts data.sql | docker compose exec -T db \
     psql -U postgres -d overwander -v ON_ERROR_STOP=1 --single-transaction
   ```

   It prints how many tables it found. It replaces each table's rows, so it can
   run again, and a failure loads nothing.

4. **Compare the row counts.** Run this in the Supabase SQL editor and in
   `docker compose exec db psql -U postgres -d overwander`. The two lists should
   match:

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

6. **Check it** the way [The server](server.md#5-deploy-then-check-it) says: sign
   in, walk, catch, and open a lobby in two browsers.

7. **Open the game** on the new database:

   ```bash
   docker compose exec db psql -U postgres -d overwander \
     -c "update switches set closed = false where feature = 'everything'"
   ```

8. **Schedule the backups** (see [Backups](server.md#6-backups)).

## Going back

Until the new database has taken writes worth keeping, going back is a deploy.
The previous build still reads `SUPABASE_DB_URL`:

```bash
scripts/deploy.sh <the previous tag>
```

Then reopen the game in the Supabase SQL editor. Anything written to the new
database since the move is left behind.

## After the move

- If Google and GitHub are not set up on the new server, give each player a
  password link (see [Authentication](authentication.md#password-links)). It
  adds a password to the account they already have.
- Players who were signed in through Supabase sign in once more. Their accounts,
  links and passwords are all there, so it is the same account they come back to.
- Once going back is off the table, remove `SUPABASE_DB_URL` from `.env` and pause
  the Supabase project. Keep it paused for a few weeks before deleting it.
- The repository's `supabase/` folder is only needed for step 2. Remove it once
  the move is done.
