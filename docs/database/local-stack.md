# Running the database locally

Development and the tests share one throwaway database: Postgres 17 with
`pg_cron`, in Docker, from [`compose.dev.yaml`](../../compose.dev.yaml). It is
the same image the server runs, as a separate instance, and it keeps its data in
memory, so it starts empty whenever it starts. For the server, see
[Deploying the game](../deploy.md).

Two instances can run on one machine, each its own compose project and port, so
neither can reach the other's data:

| Instance    | Compose file       | Port  | Database         | Used by                                                 |
| ----------- | ------------------ | ----- | ---------------- | ------------------------------------------------------- |
| Production  | `compose.yaml`     | 54322 | `overwander`     | The live game, through `scripts/deploy.sh`              |
| Development | `compose.dev.yaml` | 54324 | `overwander_dev` | `pnpm db`, `pnpm seed`, `pnpm test:db`, `pnpm test:e2e` |

`pnpm seed` and the test suites refuse any database whose name does not end in
`_dev`. `pnpm db:reset` only ever touches the development instance.

## What you need

- **A Docker daemon**, running first. Colima is what this project uses on macOS:

  ```bash
  brew install colima docker docker-compose
  colima start --cpu 4 --memory 6 --disk 60
  ```

- **Node 26** and **pnpm**, for the app itself.

## Its settings

Development reads the committed [`.env.development`](../../.env.development)
rather than the root `.env`, which is production's. It sets every value that
reaches data, accounts or sign-in, so nothing of production's gets through; the
world (seed, generation, sprite host) is left to `.env`, so development shows
the live game's world. Personal changes go in `.env.development.local`, which git
ignores.

## Starting it

```bash
pnpm db                # start the development database on 127.0.0.1:54324
pnpm db:migrate        # apply db/migrations
pnpm seed              # two accounts and a few rows
pnpm dev               # http://localhost:3000
```

- `pnpm dev` also applies any pending migration as it starts, so after pulling a
  branch with a new one, restarting `pnpm dev` is enough.
- The data lives in memory, so stopping the database, or Colima, empties it.
- `colima stop` stops the database with it. `pnpm db` starts it again.

`pnpm seed` makes **alice@example.com** and **bob@example.com**, both with the
password `walking-in-the-tall-grass` and the `admin` role. It is safe to run twice.
A development build draws the email and password form, so either signs in at once.

## Everyday commands

| Command           | What it does                                                    |
| ----------------- | --------------------------------------------------------------- |
| `pnpm db`         | Start the database, or leave a running one alone                |
| `pnpm db:stop`    | Stop it. The data goes with it                                  |
| `pnpm db:reset`   | Delete the development data and start again from the migrations |
| `pnpm db:migrate` | Apply the migrations the database has not seen                  |
| `pnpm seed`       | Put the two accounts and their rows back                        |

A shell on the database:

```bash
docker compose -f compose.dev.yaml exec db psql -U postgres -d overwander_dev
```

## Changing the schema

A migration is a plain SQL file in [`db/migrations/`](../../db/migrations). Files
apply in filename order and are never edited once they have run anywhere:

```bash
# write db/migrations/0002_gym_seat_freeing.sql
pnpm db:migrate       # applies it, and records it in schema_migrations
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
pnpm test:db     # the server modules against the development database
pnpm test:e2e    # the browser suites, against the same one
```

Both start the development instance if it is not up, and migrate it. They reach
it only through `TEST_DATABASE_URL`, and refuse a database whose name does not
end in `_dev`, so no setting can point them at production. They clear its data,
so `pnpm seed` again afterwards.

Run them one at a time: the database suite clears the game rows between cases,
accounts included. Every suite reads `test/env/.env.test` rather than your `.env`.

## When something is wrong

- **`pnpm db` cannot find Docker.** Start Colima, or point `DOCKER_HOST` at its
  socket, which `colima status` prints.
- **The port is taken.** Something else holds 54324. `docker ps` shows what.
- **Every call says "Not signed in".** `BETTER_AUTH_SECRET` changed, or the
  database was reset under a signed-in tab. Sign in again.
- **`pnpm dev` exits with "Migration failed".** The error names the statement.
  Fix the file and start again.

## See also

- [The database](../database.md): every table
- [Schema changes](../deploy/schema-changes.md): shipping a migration to the server
