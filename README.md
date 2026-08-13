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
- [Credits](docs/credits.md) — who wrote it, what it is built out of, and where
  the art and the rules come from.

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

### Running against the emulators

A Firebase project is not needed to develop against. `firebase.json` configures
the **Auth and Firestore emulators**, and a `demo-` project id makes them run
entirely offline — no account to hold, no key to leak, and nothing a mistake can
cost.

```bash
pnpm emulators   # in one terminal: auth on 9099, firestore on 8080, UI on 4000
pnpm dev         # in another
```

`pnpm emulators` clears up after itself before it starts. The Firebase CLI runs
Firestore as a separate Java process, and a run cut short with Ctrl-C regularly
leaves that process holding its ports with nothing driving it — which used to
mean the next start died on `port taken` and had to be untangled by hand. A set
that is still answering is left alone and said so; only wreckage is cleared.

Point the app at them by uncommenting the emulator block at the bottom of
`.env.example` in your `.env`. The web config above it can stay blank — an
emulated run fills in its own, because a developer who has no project has nothing
to copy a key out of, and the emulators verify none of it. Anything you do set is
still honoured, which is how you point the emulators at a real project's id to
work against a copy of its data.

Both halves of the game have to be told separately, because they are separate
SDKs: `VITE_FIREBASE_EMULATOR=true` is the browser's half, and
`FIRESTORE_EMULATOR_HOST` / `FIREBASE_AUTH_EMULATOR_HOST` are read by the Admin
SDK itself, which is what routes the privileged writes. Both default to the same
project id, since the emulators keep one store per project — name it on both
sides or neither.

Naming only one is the mistake worth knowing about, because nothing about it
looks like a mistake: `VITE_FIREBASE_PROJECT_ID=test` with `FIREBASE_PROJECT_ID`
left at the default puts the browser in one store and the server in another. Both
halves work, both write successfully, and the player is looking at a store that
nothing the server writes ever reaches — no catches, no bag, no gold, no profile,
and no error anywhere. The server refuses to start against a project the browser
is not using, so this now fails with a message that names both ids instead.

The emulators enforce `firestore.rules`, so a client write the rules refuse fails
locally the way it would in production — which is the point of developing against
them rather than against a project where the rules are not deployed yet.

**The Firestore emulator needs a JDK 21 or newer** (the auth emulator is Node and
needs nothing). `firebase emulators:start` says so plainly if the one on `PATH`
is older — having a new enough one installed is not the same as it being the one
found first:

```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 21)   # macOS
```

Sign-in against the emulators is worth knowing two things about. The **Emulator
UI** at <http://localhost:4000/auth> can add a user outright, which is the
shortest way to a signed-in session. And **Google sign-in opens a popup** served
from the emulator's own port, which some browsers will not let talk back to the
page that opened it; the app falls back to a redirect when that happens, but
email sign-in avoids the question entirely.

### Firestore rules and indexes

[`firestore.rules`](firestore.rules) and
[`firestore.indexes.json`](firestore.indexes.json) are what the code assumes, and
what [Security](docs/firestore/security.md) explains. Deploy them before the game
is exposed to anybody:

```bash
npx firebase deploy --only firestore:rules,firestore:indexes --project <id>
```

Most collections are read-only to clients on purpose: the server owns anything
worth cheating for.

The rules have tests of their own, since nothing outside the emulator can say
what a rule does:

```bash
pnpm test:rules
```

It starts a Firestore emulator, runs `test/firestore/`, and stops it again —
which is why it is not part of `pnpm test`, the rest of which needs nothing
running. The run **clears the store between cases**, so it wants an emulator to
itself; if one is already up on 8080, give it a spare port rather than letting
it empty the one you are using:

```bash
FIRESTORE_EMULATOR_PORT=8099 pnpm test:rules   # with a firestore.port to match
```

## Commands

| Command               | What it does                                       |
| --------------------- | -------------------------------------------------- |
| `pnpm dev`            | Development server with HMR                        |
| `pnpm build`          | Production build (client, server and Nitro output) |
| `pnpm start`          | Serve the built output from `.output/`             |
| `pnpm preview`        | Preview the build locally                          |
| `pnpm emulators`      | Local Firebase (auth, Firestore, UI on port 4000)  |
| `pnpm test`           | The whole test suite, once                         |
| `pnpm test:rules`     | The Firestore rules, against a throwaway emulator  |
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
