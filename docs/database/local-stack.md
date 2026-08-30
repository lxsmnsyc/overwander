# Running the database locally

Development runs against a **local Supabase stack**: Postgres, the auth server,
PostgREST, the realtime server and Studio, all in Docker on your own machine. No
hosted project is needed, nothing costs anything, and a mistake is one
`pnpm db:reset` away from gone. For the hosted half, see
[Deploying the game](../deploy.md).

## What you need

- **A Docker daemon**, running before anything else. Docker Desktop, Colima,
  Podman: the CLI only needs a socket to talk to. The stack is eight containers,
  and [Colima is what this project uses](#docker-desktop-is-not-required).
- **The Supabase CLI** ([install](https://supabase.com/docs/guides/local-development)),
  on your `PATH` as `supabase`.
- **Node 22 or newer** and **pnpm**, for the app itself.

## Starting it

```bash
pnpm db      # supabase start
```

The first run pulls the images, a gigabyte or so, which takes a few minutes;
later runs start the same containers again in seconds. When it finishes it prints the URLs and keys the app needs:

```text
         API URL: http://127.0.0.1:54321
          DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
      Studio URL: http://127.0.0.1:54323
     Mailpit URL: http://127.0.0.1:54324
        anon key: eyJhbGciOi...
service_role key: eyJhbGciOi...
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
```

`supabase status` prints the same list again at any time, and
`supabase status -o env` prints it in a shape a script can read, which is what
the browser tests use.

| Port  | What is on it                                        |
| ----- | ---------------------------------------------------- |
| 54321 | The API: auth, PostgREST, realtime                   |
| 54322 | Postgres itself, for `psql` and the owner connection |
| 54323 | **Studio**: tables, the SQL editor, the log viewer   |
| 54324 | Mailpit, which catches every email the stack sends   |

Starting the stack **applies every migration** in
[`supabase/migrations/`](../../supabase/migrations) in filename order, so a fresh
machine gets the current schema without any further step.

## What is actually running

`pnpm db` is a Docker Compose stack under another name. It brings up one
container per service, all named after the `project_id` in
[`supabase/config.toml`](../../supabase/config.toml), which is `overwander`:

| Container                      | What it is                                        |
| ------------------------------ | ------------------------------------------------- |
| `supabase_db_overwander`       | Postgres itself, on 54322                         |
| `supabase_kong_overwander`     | The gateway everything on 54321 goes through      |
| `supabase_auth_overwander`     | GoTrue: accounts, sessions, tokens                |
| `supabase_rest_overwander`     | PostgREST, which is what the browser's reads are  |
| `supabase_realtime_overwander` | The change stream the live views ride             |
| `supabase_storage_overwander`  | The file API, which this game does not use        |
| `supabase_pg_meta_overwander`  | What Studio reads the schema through              |
| `supabase_inbucket_overwander` | Mailpit, holding every email the stack would send |

Look at them the way you would any container:

```bash
docker ps --filter name=overwander            # what is up
docker logs -f supabase_db_overwander         # Postgres logs, live
docker logs supabase_auth_overwander          # why a sign-in was refused
docker exec -it supabase_db_overwander psql -U postgres   # a shell on the database
```

The CLI expects to be the one starting and stopping them. Use `pnpm db` and
`pnpm db:stop` rather than `docker stop`, since the CLI writes down what it
started and gets confused by containers that went away behind its back. If that
does happen, `supabase stop --no-backup` clears the wreckage.

**The data lives in Docker volumes**, not in the containers, so stopping the
stack keeps it and `pnpm db:stop` is safe to run at the end of the day. Three
volumes carry it, one for the database, one for storage and one for the edge
runtime, and `supabase stop --no-backup` is what deletes them.

Docker itself has to be running first. On a machine where it is not, `pnpm db`
fails with a connection error naming the Docker socket rather than anything
about Supabase.

### Docker Desktop is not required

Anything that gives you a Docker daemon works, and **Colima** is what this
project is developed against on macOS:

```bash
brew install colima docker
colima start --cpu 4 --memory 6 --disk 60
```

Four CPUs and 6GB is comfortable: the eight containers idle at roughly 900MB
between them, and Postgres wants room to work during a reset. Colima uses
Apple's Virtualization framework and virtiofs mounts on Apple silicon, both of
which the stack is happy with.

`colima start` installs a Docker **context** and makes it current, which the
`docker` CLI picks up on its own. The Supabase CLI does not always read the
context, so if `pnpm db` cannot find a daemon while `docker ps` works, point it
at the socket by hand:

```bash
export DOCKER_HOST="unix://${HOME}/.colima/default/docker.sock"
```

`colima status` prints that path, and `docker context ls` shows which context is
current. Worth putting in your shell profile: the Supabase CLI, Playwright's
global setup and any `docker` command all need to agree on which daemon they are
talking to.

Two things to know about the virtual machine:

- **`colima stop` takes the whole stack down with it**, containers and all.
  Starting Colima again does not start them; `pnpm db` does.
- **Its disk is separate from yours.** The images and the Docker volumes live
  inside the VM, so `colima delete` throws away every local database on the
  machine, not only this project's.

Podman and Rancher Desktop work on the same terms: a daemon the CLI can reach,
and enough memory to hold the stack.

## Pointing the app at it

Copy the example file once and fill in the two keys the start-up printed:

```bash
cp .env.example .env
```

| Variable                    | Local value                                               |
| --------------------------- | --------------------------------------------------------- |
| `VITE_SUPABASE_URL`         | `http://127.0.0.1:54321`                                  |
| `VITE_SUPABASE_ANON_KEY`    | The **anon key** printed above                            |
| `SUPABASE_URL`              | `http://127.0.0.1:54321`                                  |
| `SUPABASE_DB_URL`           | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |
| `SUPABASE_SERVICE_ROLE_KEY` | The **service_role key** printed above                    |
| `SUPABASE_JWT_SECRET`       | The **JWT secret** printed by `supabase status`           |

The two `VITE_` variables are the browser's half and the rest are the server's;
both halves have to name the same stack. Everything else in `.env.example`
already holds a working local default.

**Vite reads `.env` at start-up**, so restart `pnpm dev` after editing it.

Then:

```bash
pnpm dev     # http://localhost:3000
```

## Seeding it

A fresh database has the schema and nothing in it. `pnpm seed` fills it with
enough to walk around:

```bash
pnpm seed
```

It creates **alice@example.com** and **bob@example.com**, both with the password
`walking-in-the-tall-grass`, gives each of them the `admin` role and a few balls,
and makes them friends. It goes through the same two doors the game does:
accounts through the auth admin API, rows over the owner connection. It needs
`SUPABASE_SERVICE_ROLE_KEY` set, and it is safe to run twice.

Sign in with either address on a development build, where the email and password
form is drawn. The local stack skips address confirmation, so a sign-up answers
with a live session immediately; anything the stack does email is caught by
**Mailpit** on 54324 rather than sent.

## Everyday commands

| Command           | What it does                                             |
| ----------------- | -------------------------------------------------------- |
| `pnpm db`         | Start the stack, or leave a running one alone            |
| `pnpm db:stop`    | Stop it. The data survives until the next reset          |
| `pnpm db:reset`   | Drop everything, replay every migration, and start empty |
| `pnpm seed`       | Put the two accounts and their rows back                 |
| `supabase status` | The URLs and keys again                                  |

`pnpm db:reset` is the one to reach for after pulling a branch that added a
migration, or whenever the data has been walked into a state that is easier to
throw away than to fix. It is a **drop**: everything, accounts included, goes.
Follow it with `pnpm seed`.

## Changing the schema

Migrations are plain SQL files, applied in filename order and never edited once
they have been pushed anywhere:

```bash
supabase migration new gym_seat_freeing   # writes a timestamped empty file
# edit supabase/migrations/<timestamp>_gym_seat_freeing.sql
pnpm db:reset                             # replay everything, including the new one
```

Two things a new table needs beyond its columns, both easy to forget because the
originals were done in bulk:

- **Its own grants.** The blanket `grant ... on all tables` in the RLS migration
  only reached the tables that existed then. A table without
  `grant select ... to authenticated` is readable by nobody, whatever its policy
  says.
- **Its own policy**, or a deliberate decision to have none. RLS on with no
  policy means closed, which is right for the gift and quest tables and wrong
  for everything else.

See [Security](security.md) for what the policies say and why.

### Applying one without a reset

`pnpm db:reset` throws the data away, which is right most of the time and
annoying when the state took a while to walk into. The CLI can apply only what
is pending instead:

```bash
supabase migration list --local   # what the database has, against the folder
supabase migration up --local     # apply the pending ones, keeping the data
```

`migration list` prints a **Local** and a **Remote** column, where "remote" means
the database being asked, the local one here. A row with a local version and an
empty remote one is pending.

**A pending file older than one already applied needs `--include-all`.** The
plain `up` only walks forwards from the newest applied version, so a migration
that arrives out of order (a branch merged after you wrote your own) is skipped
in silence:

```bash
supabase migration up --local --include-all
```

Two things this does not do, both of which `pnpm db:reset` does:

- **It does not prove the folder replays from nothing**, which is what a fresh
  machine and a hosted project both do. Reset before pushing anywhere.
- **It does not undo the previous shape.** A file changed after it was applied
  will not be applied again, since the version is already in the history table.
  Either write the fix as a new file, or reset.

If you did run something by hand in `psql` and want the history to agree with
what the database actually has:

```bash
supabase migration repair --local --status applied <version>
supabase migration repair --local --status reverted <version>
```

That writes the history table and nothing else: it does not run or undo any SQL,
so it is only ever right when the schema already matches what you are claiming.

## Running the tests

```bash
pnpm test        # the unit suites; nothing needs to be running
pnpm test:rules  # the row-level security suite, against the local stack
pnpm test:e2e    # the browser suites
```

`pnpm test:rules` and `pnpm test:e2e` both want the stack up, and **neither
should share it with the other**: the RLS suite clears the game rows between
cases and would delete the accounts the browsers are signed in as. The browser
suite starts the stack itself if it is not already running, and reads its keys
from `supabase status` rather than from your `.env`.

## When something is wrong

**`supabase start` cannot find Docker.** The daemon is not running, or the CLI
is not looking where your `docker` CLI is looking. Under Colima, export
`DOCKER_HOST` as above.

**`supabase start` hangs or fails.** An old set of containers is still holding
the ports. `docker ps --filter name=overwander`
shows what is up; `supabase stop` clears them, and
`supabase stop --no-backup` clears them and their volumes with them.

**A container keeps restarting.** `docker logs <name>` says why, and it is
usually Postgres refusing to come up after an interrupted migration. A
`pnpm db:reset` fixes the database itself; `supabase stop --no-backup` followed
by `pnpm db` rebuilds everything from nothing.

**The game loads but reads nothing back.** The browser and the server are
pointed at different places. Check that `VITE_SUPABASE_URL` and `SUPABASE_URL`
name the same stack, and remember that Vite only read `.env` when it started.

**Every write refuses.** `SUPABASE_DB_URL` is unset or wrong. The game reads
fine without it and refuses every privileged write, which looks like a
permissions problem and is not.

**Sign-in fails with a token error.** `SUPABASE_JWT_SECRET` does not match the
stack's. `supabase status` prints the current one; it changes when the stack is
recreated.

**A migration fails on reset.** The error names the file and the statement. Fix
the file and reset again: nothing is half-applied, since a reset starts from an
empty database every time.

## See also

- [The database](../database.md): every table, and who may read it
- [Security](security.md): policies, grants and the privileged writes
