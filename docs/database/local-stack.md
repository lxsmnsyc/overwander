# Running the database locally

Development runs against the same database the server runs: Postgres 17 with
`pg_cron`, in Docker, from [`compose.yaml`](../../compose.yaml). For the server,
see [Deploying the game](../deploy.md).

## What you need

- **A Docker daemon**, running first. Colima is what this project uses on macOS:

  ```bash
  brew install colima docker docker-compose
  colima start --cpu 4 --memory 6 --disk 60
  ```

- **Node 26** and **pnpm**, for the app itself.

## Starting it

```bash
cp .env.example .env   # once; the local defaults work as they are
pnpm db                # start Postgres on 127.0.0.1:54322
pnpm migrate           # apply db/migrations
pnpm seed              # two accounts and a few rows
pnpm dev               # http://localhost:3000
```

- `pnpm dev` also applies any pending migration as it starts, so after pulling a
  branch with a new one, restarting `pnpm dev` is enough.
- The data lives in the `overwander_db` Docker volume, so `pnpm db:stop` keeps it.
- `colima stop` stops the database with it. `pnpm db` starts it again.

`pnpm seed` makes **alice@example.com** and **bob@example.com**, both with the
password `walking-in-the-tall-grass` and the `admin` role. It is safe to run twice.
A development build draws the email and password form, so either signs in at once.

## Everyday commands

| Command         | What it does                                        |
| --------------- | --------------------------------------------------- |
| `pnpm db`       | Start the database, or leave a running one alone    |
| `pnpm db:stop`  | Stop it. The data survives                          |
| `pnpm db:reset` | Delete the data and start again from the migrations |
| `pnpm migrate`  | Apply the migrations the database has not seen      |
| `pnpm seed`     | Put the two accounts and their rows back            |

A shell on the database:

```bash
docker compose exec db psql -U postgres -d overwander
```

## Changing the schema

A migration is a plain SQL file in [`db/migrations/`](../../db/migrations). Files
apply in filename order and are never edited once they have run anywhere:

```bash
# write db/migrations/0002_gym_seat_freeing.sql
pnpm migrate          # applies it, and records it in schema_migrations
pnpm db:reset         # proves the folder still replays from nothing
```

- Everything pending runs in one transaction, so a failing file applies nothing.
- `create index concurrently` cannot run in a transaction. Run it by hand and
  keep a plain `create index` in the file.
- A table the browser follows live needs the `live_changes` trigger, and an entry
  in [`src/server/live/rules.ts`](../../src/server/live/rules.ts) saying who may
  read its rows. A test checks that the two lists match.

Nothing a browser does reaches the database directly. Every read and write goes
through a server function, so a new table needs no grants or policies.

## Running the tests

```bash
pnpm test        # the unit suites; nothing needs to be running
```

```bash
pnpm test:db     # the server modules against the tests' own database
pnpm test:e2e    # the browser suites, against the same one
```

Neither touches this database. Both start a separate instance from
[`compose.test.yaml`](../../compose.test.yaml), on port 54323 with its data in
memory, and migrate it. They reach it only through `TEST_DATABASE_URL`, and
refuse a database whose name does not end in `_test`, so no setting can point
them at development or production data. `pnpm db:test:stop` removes it.

Run them one at a time: the database suite clears the game rows between cases,
accounts included. Every suite reads `test/env/.env.test` rather than your `.env`.

## When something is wrong

- **`pnpm db` cannot find Docker.** Start Colima, or point `DOCKER_HOST` at its
  socket, which `colima status` prints.
- **The port is taken.** Something else holds 54322, such as a Supabase stack
  left from before the move. `docker ps` shows what.
- **Every call says "Not signed in".** `BETTER_AUTH_SECRET` changed, or the
  database was reset under a signed-in tab. Sign in again.
- **`pnpm dev` exits with "Migration failed".** The error names the statement.
  Fix the file and start again.

## See also

- [The database](../database.md): every table
- [Schema changes](../deploy/schema-changes.md): shipping a migration to the server
