# Overwander

A Pokémon-style overworld you walk through, generated as you go. The map is
never stored. One seed produces climate noise, the climate sorts into biomes,
and each chunk rolls its own landmarks, spawns, item stashes and raids from that
seed plus the clock. Two players in the same place at the same time compute the
same world without exchanging any of it, and nothing is generated ahead of time.

On top of that world sits the game: pokemon to meet and throw balls at, eggs to
walk, raids that need a party, trainers and gym leaders to beat, gym seats other
players are holding, quests and badges to collect, an auction house and
friend-to-friend trades, and a real-time battle engine both sides replay from a
seed.

The dex runs to 493: Kanto, Johto, Hoenn and Sinnoh, with their moves,
abilities and items.
Where the old games and the modern ones disagree, the mechanics follow the
modern ones.

- [Releases](docs/update.md): what each major release brought, newest first.
- [Player's guide](docs/mechanics.md): how the world, catching, fighting and
  raising work, written for players rather than for programmers.
- [The battle engine](docs/engine.md): how the real-time engine, the AI and the
  battle canvas actually run.
- [The database](docs/database.md): every table the game writes to, what it
  holds, and who may touch it.
- [Deploying it](docs/deploy.md): standing the game up on your own server.
- [Credits](docs/credits.md): who wrote it, what it is built from, and where the
  art and rules come from.
- [Contributing](CONTRIBUTING.md): branches, changesets, the checks to run, and
  the conventions a reviewer looks for.

## How it is built

| Piece          | What it does                                                   |
| -------------- | -------------------------------------------------------------- |
| SolidStart 2   | The app: file routes, server functions, SSR                    |
| Solid 1.9      | Signals and resources; no virtual DOM                          |
| terracotta     | Headless, accessible dialogs, tabs, listboxes and buttons      |
| Tailwind CSS 4 | Styling, configured in `src/app.css` rather than a config file |
| Postgres 17    | Every row, with `pg_cron` for the sweeps, in Docker            |
| postgres.js    | The one connection every read and write travels over           |
| Better Auth    | Accounts, sessions, Google and GitHub sign-in                  |
| valibot        | The schemas every server function checks its arguments against |
| Vitest         | The tests, which run the real engines rather than mocks        |
| oxlint / oxfmt | Linting and formatting                                         |

## Getting started

### What you need

- **Node 22 or newer**, which the Vite 8 toolchain expects.
- **pnpm 12**. The version is pinned in `packageManager`, so Corepack picks it
  up. The lockfile is `pnpm-lock.yaml`; npm and yarn will fight it.
- **Docker** with the compose plugin, for the local database.

### Install and run

```bash
pnpm install
pnpm db                 # the development database on 127.0.0.1:54324
pnpm db:migrate         # the schema
pnpm seed               # two accounts and a few rows
pnpm dev                # http://localhost:3000
```

The whole of it, including what to do when something is wrong, is in
[Running the database locally](docs/database/local-stack.md).

### Configuring it

The script's name says which settings it reads:

- **Development** (`pnpm dev`, `pnpm db:*`, `pnpm seed`) reads the committed
  `.env.development`, which sets every database, account and sign-in value.
  Personal changes go in `.env.development.local`.
- **Production** (`pnpm start`, `pnpm migrate`) reads the root `.env`.
  `.env.example` documents every variable it takes.

- **`VITE_` variables** are baked into the browser bundle, so they are public.
  `VITE_WORLD_SEED` is the world everyone shares.
- **Everything else is the server's**, and secret: `DATABASE_URL`,
  `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` and the OAuth apps' credentials.

The browser never reaches the database. Every read and write is a server
function in `src/auth/` calling into `src/server/`, which verifies the caller and
decides what they may see or change.

Changing `VITE_WORLD_SEED` changes the world. Chunk seeds, biomes, landmark
placement, spawn rolls and lair contents all derive from it. Two deployments with
different seeds are two different planets, and stored records naming a chunk will
point at ground that no longer looks the same.

### The schema

[`db/migrations/`](db/migrations) is the whole database, applied in filename
order. `pnpm db:migrate` applies what is pending, and the server does the same as it
starts. [Schema changes](docs/deploy/schema-changes.md) covers writing one.

The database suite runs the server modules against a real Postgres:

```bash
pnpm test:db
```

It uses the throwaway development database on port 54324, which it starts and
migrates itself, and never production. It refuses any database whose name does
not end in `_dev`. It **clears the game rows between cases**, so run it apart
from the e2e suite, which shares that database. Every suite reads
`test/env/.env.test` rather than the root `.env`.

### Signing in

Every build offers an **email and password**, and a **passkey**. **Google and
GitHub** buttons appear only where the server has both of that provider's
credentials. A sign-up answers with a live session. A development build also
hands every account it creates the `admin` role, granted on the server.

An account can turn on an authenticator app and add passkeys under Settings,
Security, after typing its password again. The game sends no email, so staff
give a player a **password link** from the player's admin page instead, or with
`pnpm password-link <email>` for an account no staff member ranks above.

## Commands

| Command                | What it does                                                                        |
| ---------------------- | ----------------------------------------------------------------------------------- |
| `pnpm dev`             | Development server with HMR                                                         |
| `pnpm build`           | Production build (client, server and Nitro output)                                  |
| `pnpm start`           | Serve the built output from `.output/`                                              |
| `pnpm preview`         | Preview the build locally                                                           |
| `pnpm db`              | Start the development database (`compose.dev.yaml`)                                 |
| `pnpm db:reset`        | Delete the development data and rebuild it from `db/migrations/`                    |
| `pnpm db:migrate`      | Apply pending migrations to the development database                                |
| `pnpm migrate`         | Apply pending migrations to production, from the root `.env`                        |
| `pnpm seed`            | Fill a fresh database with accounts and sample rows                                 |
| `pnpm server`          | Build and start production (database, app and tunnel), from the root `.env`         |
| `pnpm server:tunnel`   | Start the tunnel alone, when the app is already up                                  |
| `pnpm server:ps`       | Show production's services and their health                                         |
| `pnpm server:logs`     | Follow production's logs; name a service to follow one, such as `tunnel`            |
| `pnpm import-sprites`  | Copy the pokemon sheets in from `../SpriteCollab`, the `lxsmnsyc/SpriteCollab` fork |
| `pnpm compact-sprites` | Rewrite the sprite PNGs smaller, pixel for pixel                                    |
| `pnpm sprite-coats`    | Restamp `coats.json` after anything writes a sheet                                  |
| `pnpm sprite-stamps`   | Restamp every other sheet, which `pnpm build` also does                             |
| `pnpm test`            | The whole test suite, once                                                          |
| `pnpm test:db`         | The server modules against the development database                                 |
| `pnpm test:e2e`        | The Playwright suites under `e2e/`                                                  |
| `npx tsc --noEmit`     | Type-check                                                                          |
| `npx oxlint src test`  | Lint                                                                                |
| `npx oxfmt src test`   | Format                                                                              |
| `pnpm cs:add`          | Add a changeset                                                                     |

## Where things live

| Path                   | What is in it                                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `src/data/`            | The dex: species, moves, abilities, items, biomes, spawn and item pools                                                   |
| `src/overworld/`       | The world: chunks, snapshots, landmarks, encounters, safari, breeding, raids                                              |
| `src/battle/`          | The battle engine: events, units, moves, statuses, abilities, items, AI                                                   |
| `src/auth/`            | The browser's side: `'use server'` wrappers around every read and write, sign-in, and the live feed                       |
| `src/server/`          | Reads and writes over the owner connection, behind a verified caller                                                      |
| `src/components/`      | The UI, in a folder per feature (`overworld/`, `catches/`, `battle/`, …) over the shared `sprites/`, `styled/` and `app/` |
| `src/canvas/`          | Sprite sheets and the animation class the map and battle canvases draw with                                               |
| `src/core/`            | The shared primitives: seeded RNG, Perlin noise, the event engine                                                         |
| `public/sprites/`      | Sprite sheets by region: a folder per pokemon holding its layout, its frames and a PNG per coat                           |
| `sprite-pipeline.json` | What has been done to each sheet, and to which version of it                                                              |
| `test/`                | Vitest suites, mirroring the source tree                                                                                  |
| `db/`                  | The migrations, their runner and the database image                                                                       |
| `supabase/`            | The Supabase migrations, kept until the live game has moved off it                                                        |
| `docs/`                | The player's guide, the database pages and the engine notes                                                               |

Two conventions are worth knowing before reading the source. Every module has a
single `export default` where it has an obvious main export. And effects (an
ability, a held item, a status) are **written once and register themselves**
against the events they care about, instead of being spelled out inside whatever
function needed them. Nothing that stages a spawn or resolves a hit names an
ability.

## License

MIT. See [LICENSE](LICENSE).
