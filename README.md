# Poketerra

A Pokémon-style overworld you walk rather than one you are given. The map is not
stored anywhere: one seed fans out into climate noise, the climate classifies
into biomes, and every chunk rolls its own landmarks, spawns, item stashes and
raids from that seed and the clock. Two players standing in the same place at the
same moment compute the same world without exchanging a byte of it, and nothing
has to be generated in advance.

On top of that world sits a game: pokemon to meet and throw balls at, eggs to
walk, raids that need a party, Team Rocket grunts who bar a cell for three hours,
an auction house where things pass between players, and a real-time battle engine
that both sides replay from a seed.

The dex is Gen 1 — 151 species, their moves, abilities and items — with the
mechanics taken from the modern games where the two disagree.

- [Game mechanics](docs/mechanics.md) — how the world, the catching, the fights
  and the raising actually work.
- [Firestore](docs/firestore.md) — every store the game writes to, what is in
  it, and who may touch it.

## How it is built

| Piece          | What it does                                                               |
| -------------- | -------------------------------------------------------------------------- |
| SolidStart 2   | The app: file routes, server functions, SSR                                |
| Solid 1.9      | Signals and resources; no virtual DOM                                      |
| terracotta     | Headless, accessible dialogs, tabs, listboxes and buttons                  |
| Tailwind CSS 4 | Styling, configured in `src/app.css` rather than a config file             |
| Firebase       | Auth and Firestore on the client; the Admin SDK for every privileged write |
| Vitest         | The tests, which run the real engines rather than mocks                    |
| oxlint / oxfmt | Linting and formatting                                                     |

## Getting started

### What you need

- **Node 22 or newer**, which is what the Vite 8 toolchain expects.
- **pnpm**. This repository is pnpm-managed and its lockfile is
  `pnpm-lock.yaml`; npm and yarn will fight it.
- **A Firebase project** with **Authentication** and **Cloud Firestore** enabled.
  Email/password and Google are the two sign-in methods the login form offers, so
  turn on whichever you intend to use.

### Install and run

```bash
pnpm install
cp .env.example .env   # then fill it in, see below
pnpm dev               # http://localhost:3000
```

### Configuring Firebase

`.env.example` documents every variable; there are two groups.

The **web config** is public by design and is what the browser uses to reach
Auth and Firestore. Copy it out of the Firebase console under *Project settings →
Your apps → Web app*:

| Variable                    | Where it comes from                   |
| --------------------------- | ------------------------------------- |
| `VITE_FIREBASE_API_KEY`     | Firebase web app config               |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase web app config               |
| `VITE_FIREBASE_PROJECT_ID`  | Firebase web app config               |
| `VITE_FIREBASE_APP_ID`      | Firebase web app config               |
| `VITE_WORLD_SEED`           | Any string; the world everyone shares |

The **service account** is server-only and secret. Everything that creates or
moves value — recording a catch, paying gold, granting an item, raising a level,
settling an auction — is written by the Admin SDK from `src/server/*` behind a
verified caller, and none of it can reach Firestore without credentials:

```bash
# Firebase console -> project settings -> service accounts -> generate new
# private key, then paste the whole JSON on one line.
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
```

Leaving it empty falls back to application default credentials, which is what a
Google-hosted runtime already has. Without either, the game reads fine and
refuses every write.

Changing `VITE_WORLD_SEED` changes the world. Chunk seeds, biomes, landmark
placement, spawn rolls and lair contents all derive from it, so two deployments
with different seeds are two different planets — and stored records that name a
chunk will point at ground that no longer looks the same.

### Firestore rules and indexes

There is no `firestore.rules` in the repository yet. The rules the code assumes —
along with the three composite indexes its queries need — are written out in
[Security](docs/firestore/security.md), and should be deployed before the game is
exposed to anybody. Most collections are read-only to clients on purpose: the
server owns anything worth cheating for.

## Commands

| Command               | What it does                                       |
| --------------------- | -------------------------------------------------- |
| `pnpm dev`            | Development server with HMR                        |
| `pnpm build`          | Production build (client, server and Nitro output) |
| `pnpm start`          | Serve the built output from `.output/`             |
| `pnpm preview`        | Preview the build locally                          |
| `pnpm test`           | The whole test suite, once                         |
| `npx tsc --noEmit`    | Type-check                                         |
| `npx oxlint src test` | Lint                                               |
| `npx oxfmt src test`  | Format                                             |
| `pnpm cs:add`         | Add a changeset                                    |

## Where things live

| Path              | What is in it                                                                 |
| ----------------- | ----------------------------------------------------------------------------- |
| `src/data/`       | The dex: species, moves, abilities, items, biomes, spawn and item pools       |
| `src/overworld/`  | The world: chunks, snapshots, landmarks, encounters, safari, breeding, raids  |
| `src/battle/`     | The battle engine: events, units, moves, statuses, abilities, items, AI       |
| `src/auth/`       | Client-side Firestore reads and the `'use server'` wrappers around the writes |
| `src/server/`     | Privileged writes, Admin SDK only, behind a verified caller                   |
| `src/components/` | The UI, including the styled wrappers over terracotta in `components/styled/` |
| `src/canvas/`     | Sprite sheets and the animation class the map and battle canvases draw with   |
| `src/core/`       | The shared primitives: seeded RNG, Perlin noise, the event engine             |
| `public/sprites/` | PMD-style sprite sheets, one folder per species id                            |
| `test/`           | Vitest suites, mirroring the source tree                                      |
| `docs/`           | The mechanics and Firestore documentation                                     |

Two conventions are worth knowing before reading the source. Every module has a
single `export default` where it has an obvious main thing, and effects — an
ability, a held item, a status — are **written once and register themselves**
against the events they have an opinion about, rather than being spelled out
inside whichever function needed them. Nothing that stages a spawn or resolves a
hit names an ability.

## License

MIT. See [LICENSE](LICENSE).
