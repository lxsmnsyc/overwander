# Poketerra

A Pokémon-style overworld you walk through, generated as you go. The map is
never stored. One seed produces climate noise, the climate sorts into biomes,
and each chunk rolls its own landmarks, spawns, item stashes and raids from that
seed plus the clock. Two players in the same place at the same time compute the
same world without exchanging any of it, and nothing is generated ahead of time.

On top of that world sits the game: pokemon to meet and throw balls at, eggs to
walk, raids that need a party, Team Rocket grunts who block a cell for six
hours, an auction house for trading between players, and a real-time battle
engine both sides replay from a seed.

The dex is Gen 1 — 151 species with their moves, abilities and items. Where Gen
1 and the modern games disagree, the mechanics follow the modern games.

- [Releases](docs/update.md): what each major release brought, newest first.
- [Player's guide](docs/mechanics.md): how the world, catching, fighting and
  raising work, written for players rather than for programmers.
- [The battle engine](docs/engine.md): how the real-time engine, the AI and the
  battle canvas actually run.
- [The database](docs/database.md): every table the game writes to, what it
  holds, and who may touch it.
- [Credits](docs/credits.md): who wrote it, what it is built from, and where the
  art and rules come from.

## How it is built

| Piece          | What it does                                                   |
| -------------- | -------------------------------------------------------------- |
| SolidStart 2   | The app: file routes, server functions, SSR                    |
| Solid 1.9      | Signals and resources; no virtual DOM                          |
| terracotta     | Headless, accessible dialogs, tabs, listboxes and buttons      |
| Tailwind CSS 4 | Styling, configured in `src/app.css` rather than a config file |
| Supabase       | Postgres, auth, row-level security and the realtime stream     |
| postgres.js    | The direct connection every privileged write travels over      |
| Vitest         | The tests, which run the real engines rather than mocks        |
| oxlint / oxfmt | Linting and formatting                                         |

## Getting started

### What you need

- **Node 22 or newer**, which the Vite 8 toolchain expects.
- **pnpm**. This repository is pnpm-managed and its lockfile is
  `pnpm-lock.yaml`; npm and yarn will fight it.
- **The Supabase CLI** and **Docker**, for the local stack. A hosted project
  works too, but nothing about development needs one.

### Install and run

```bash
pnpm install
cp .env.example .env    # then fill it in, see below
pnpm db                 # starts the local stack and prints its keys
pnpm dev                # http://localhost:3000
```

`pnpm db` is `supabase start`. It prints the API URL, the anon key and the
service-role key; `pnpm db:stop` puts it away and `pnpm db:reset` rebuilds the
database from the migrations. `pnpm seed` fills a fresh stack with a couple of
accounts and enough rows to walk the game.

### Configuring it

`.env.example` documents every variable and its local default. There are two
groups.

The **browser's pair** is public by design and lets the client reach auth, the
tables it may read, and the realtime socket:

| Variable                 | Where it comes from                             |
| ------------------------ | ----------------------------------------------- |
| `VITE_SUPABASE_URL`      | `supabase start`, or the project's API settings |
| `VITE_SUPABASE_ANON_KEY` | The same                                        |
| `VITE_WORLD_SEED`        | Any string; the world everyone shares           |

The **server's** variables are secret. Everything that creates or moves value,
recording a catch, paying gold, granting an item, raising a level, settling an
auction, is written by `src/server/*` over a direct Postgres connection as the
table owner, which row-level security does not bind:

| Variable                    | What it is for                                                   |
| --------------------------- | ---------------------------------------------------------------- |
| `SUPABASE_DB_URL`           | The owner connection every privileged write travels over         |
| `SUPABASE_URL`              | Where tokens are verified and the auth admin API lives           |
| `SUPABASE_JWT_SECRET`       | Checking an HS256 token's signature without a round trip         |
| `SUPABASE_SERVICE_ROLE_KEY` | Auth admin calls alone: finding a player by email, the dashboard |

Against a hosted project, point `SUPABASE_DB_URL` at the **transaction-mode
pooler** (port 6543), and leave `SUPABASE_JWT_SECRET` empty so the server fetches
the project's JWKS instead. Without `SUPABASE_DB_URL` the game reads fine and
refuses every write.

Changing `VITE_WORLD_SEED` changes the world. Chunk seeds, biomes, landmark
placement, spawn rolls and lair contents all derive from it. Two deployments with
different seeds are two different planets, and stored records naming a chunk will
point at ground that no longer looks the same.

### The schema

[`supabase/migrations/`](supabase/migrations) is the whole database, applied in
filename order: the tables, the functions and triggers, the row-level security,
and what is published to realtime. [Security](docs/database/security.md) explains
what the policies say and why.

```bash
supabase db push --project-ref <ref>   # apply them to a hosted project
```

Most tables are read-only to clients on purpose: the server owns anything worth
cheating for. The exceptions are a player's own profile and the shared snapshot
window, which goes through a function rather than a table write.

The policies have their own tests, since nothing outside a real Postgres can say
what a policy does:

```bash
pnpm db          # in one terminal
pnpm test:rules  # in another
```

`test/rls/` signs two accounts in and checks what each may read and write. It is
separate from `pnpm test` because it is the only suite that needs the stack
running, and because it **clears the game rows between cases**: run it while the
e2e suite is using the same stack and it will delete the accounts those browsers
are signed in as.

### Signing in

A deployed game offers **Google and GitHub**, both redirect-based, and nothing
else. The **email and password form is drawn on a development build alone**,
which is what the browser tests sign in with: the local stack skips address
confirmation, so a sign-up answers with a live session. A development build also
hands every account it creates the `admin` role, granted on the server.

## Commands

| Command                | What it does                                        |
| ---------------------- | --------------------------------------------------- |
| `pnpm dev`             | Development server with HMR                         |
| `pnpm build`           | Production build (client, server and Nitro output)  |
| `pnpm start`           | Serve the built output from `.output/`              |
| `pnpm preview`         | Preview the build locally                           |
| `pnpm db`              | Start the local Supabase stack                      |
| `pnpm db:reset`        | Rebuild the database from `supabase/migrations/`    |
| `pnpm seed`            | Fill a fresh stack with accounts and sample rows    |
| `pnpm compact-sprites` | Rewrite the sprite PNGs smaller, pixel for pixel    |
| `pnpm sprite-coats`    | Restamp `coats.json` after anything writes a sheet  |
| `pnpm test`            | The whole test suite, once                          |
| `pnpm test:rules`      | The row-level security suite, against a local stack |
| `pnpm test:e2e`        | The Playwright suites under `e2e/`                  |
| `npx tsc --noEmit`     | Type-check                                          |
| `npx oxlint src test`  | Lint                                                |
| `npx oxfmt src test`   | Format                                              |
| `pnpm cs:add`          | Add a changeset                                     |

## Where things live

| Path                   | What is in it                                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `src/data/`            | The dex: species, moves, abilities, items, biomes, spawn and item pools                                                   |
| `src/overworld/`       | The world: chunks, snapshots, landmarks, encounters, safari, breeding, raids                                              |
| `src/battle/`          | The battle engine: events, units, moves, statuses, abilities, items, AI                                                   |
| `src/auth/`            | Client-side reads under row-level security, and the `'use server'` wrappers around the writes                             |
| `src/server/`          | Privileged writes over the owner connection, behind a verified caller                                                     |
| `src/components/`      | The UI, in a folder per feature (`overworld/`, `catches/`, `battle/`, …) over the shared `sprites/`, `styled/` and `app/` |
| `src/canvas/`          | Sprite sheets and the animation class the map and battle canvases draw with                                               |
| `src/core/`            | The shared primitives: seeded RNG, Perlin noise, the event engine                                                         |
| `public/sprites/`      | Sprite sheets by region: a packed `{species}.png` per coat and one description per pokemon                                |
| `sprite-pipeline.json` | What has been done to each sheet, and to which version of it                                                              |
| `test/`                | Vitest suites, mirroring the source tree                                                                                  |
| `supabase/`            | The migrations, and the local stack's configuration                                                                       |
| `docs/`                | The player's guide, the database pages and the engine notes                                                               |

Two conventions are worth knowing before reading the source. Every module has a
single `export default` where it has an obvious main export. And effects — an
ability, a held item, a status — are **written once and register themselves**
against the events they care about, instead of being spelled out inside whatever
function needed them. Nothing that stages a spawn or resolves a hit names an
ability.

## License

MIT. See [LICENSE](LICENSE).
