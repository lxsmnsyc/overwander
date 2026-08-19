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

- [Player's guide](docs/mechanics.md) — how the world, catching, fighting and
  raising work, written for players rather than for programmers.
- [The battle engine](docs/engine.md) — how the real-time engine, the AI and the
  battle canvas actually run.
- [Firestore](docs/firestore.md) — every store the game writes to, what it
  holds, and who may touch it.
- [Credits](docs/credits.md) — who wrote it, what it is built from, and where
  the art and rules come from.

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

- **Node 22 or newer**, which the Vite 8 toolchain expects.
- **pnpm**. This repository is pnpm-managed and its lockfile is
  `pnpm-lock.yaml`; npm and yarn will fight it.
- **A Firebase project** with **Authentication** and **Cloud Firestore**
  enabled. The login form offers email/password and Google, so enable whichever
  you plan to use.

### Install and run

```bash
pnpm install
cp .env.example .env   # then fill it in, see below
pnpm dev               # http://localhost:3000
```

### Configuring Firebase

`.env.example` documents every variable. There are two groups.

The **web config** is public by design and lets the browser reach Auth and
Firestore. Copy it from the Firebase console under *Project settings → Your apps
→ Web app*:

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
verified caller. None of it reaches Firestore without credentials:

```bash
# Firebase console -> project settings -> service accounts -> generate new
# private key, then paste the whole JSON on one line.
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
```

If you leave it empty, the app falls back to application default credentials,
which a Google-hosted runtime already has. With neither, the game reads fine and
refuses every write.

Changing `VITE_WORLD_SEED` changes the world. Chunk seeds, biomes, landmark
placement, spawn rolls and lair contents all derive from it. Two deployments
with different seeds are two different planets, and stored records naming a
chunk will point at ground that no longer looks the same.

### Running against the emulators

You do not need a Firebase project to develop. `firebase.json` configures the
**Auth and Firestore emulators**, and a `demo-` project id runs them fully
offline — no account, no key to leak, and no cost to a mistake.

```bash
pnpm emulators   # in one terminal: auth on 9099, firestore on 8080, UI on 4000
pnpm dev         # in another
```

`pnpm emulators` cleans up before it starts. The Firebase CLI runs Firestore as
a separate Java process, and a run killed with Ctrl-C often leaves that process
holding its ports with nothing driving it — which used to make the next start
fail with `port taken`. The script clears that wreckage, but leaves a set that
is still answering alone and says so.

To point the app at the emulators, uncomment the emulator block at the bottom of
`.env.example` in your `.env`. The web config above it can stay blank: an
emulated run fills in its own, since a developer without a project has no key to
copy and the emulators verify none of it. Anything you do set is still used,
which is how you point the emulators at a real project's id to work against a
copy of its data.

Tell both halves of the game separately, because they are separate SDKs.
`VITE_FIREBASE_EMULATOR=true` is the browser's half.
`FIRESTORE_EMULATOR_HOST` and `FIREBASE_AUTH_EMULATOR_HOST` are read by the
Admin SDK, which routes the privileged writes. Both default to the same project
id, since the emulators keep one store per project — so name it on both sides or
neither.

Naming only one side is the mistake worth knowing about, because nothing about
it looks wrong. Setting `VITE_FIREBASE_PROJECT_ID=test` while leaving
`FIREBASE_PROJECT_ID` at the default puts the browser in one store and the
server in another. Both halves work, both write successfully, and the player
watches a store the server never reaches — no catches, no bag, no gold, no
profile, and no error anywhere. The server now refuses to start against a
project the browser is not using, and the failure message names both ids.

The emulators enforce `firestore.rules`, so a client write the rules reject
fails locally exactly as it would in production. That is the point of developing
against them instead of a project where the rules are not deployed yet.

**The Firestore emulator needs JDK 21 or newer** (the auth emulator is Node and
needs nothing). `firebase emulators:start` says so plainly when the JDK on
`PATH` is older. Having a new enough one installed is not the same as it being
found first:

```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 21)   # macOS
```

Two things help with emulator sign-in. The **Emulator UI** at
<http://localhost:4000/auth> can add a user directly, which is the fastest route
to a signed-in session. And **a provider sign-in opens a popup** served from the
emulator's own port; some browsers block that popup from talking back to the
page that opened it. The app falls back to a redirect when that happens, but
email sign-in avoids the problem entirely.

The email and password form is drawn on a **development build alone** — a
deployed game offers Google and GitHub and nothing else. A development
build also hands every account it creates the `admin` role, which is granted on
the server: the rules refuse a browser that names its own.

### Firestore rules and indexes

[`firestore.rules`](firestore.rules) and
[`firestore.indexes.json`](firestore.indexes.json) are what the code assumes and
what [Security](docs/firestore/security.md) explains. Deploy them before exposing
the game to anybody:

```bash
npx firebase deploy --only firestore:rules,firestore:indexes --project <id>
```

Most collections are read-only to clients on purpose: the server owns anything
worth cheating for.

The rules have their own tests, since nothing outside the emulator can say what
a rule does:

```bash
pnpm test:rules
```

That starts a Firestore emulator, runs `test/firestore/`, and stops it again.
It is separate from `pnpm test` because the rest of the suite needs nothing
running. The run **clears the store between cases**, so it needs an emulator to
itself. If one is already up on 8080, give the test run a spare port rather than
letting it empty the one you are using:

```bash
FIRESTORE_EMULATOR_PORT=8099 pnpm test:rules   # with a firestore.port to match
```

## Commands

| Command                | What it does                                        |
| ---------------------- | --------------------------------------------------- |
| `pnpm dev`             | Development server with HMR                         |
| `pnpm build`           | Production build (client, server and Nitro output)  |
| `pnpm start`           | Serve the built output from `.output/`              |
| `pnpm preview`         | Preview the build locally                           |
| `pnpm emulators`       | Local Firebase (auth, Firestore, UI on port 4000)   |
| `pnpm compact-sprites` | Rewrite the sprite PNGs smaller, pixel for pixel    |
| `pnpm test`            | The whole test suite, once                          |
| `pnpm test:rules`      | The Firestore rules, against a throwaway emulator   |
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
| `src/auth/`            | Client-side Firestore reads and the `'use server'` wrappers around the writes                                             |
| `src/server/`          | Privileged writes, Admin SDK only, behind a verified caller                                                               |
| `src/components/`      | The UI, in a folder per feature (`overworld/`, `catches/`, `battle/`, …) over the shared `sprites/`, `styled/` and `app/` |
| `src/canvas/`          | Sprite sheets and the animation class the map and battle canvases draw with                                               |
| `src/core/`            | The shared primitives: seeded RNG, Perlin noise, the event engine                                                         |
| `public/sprites/`      | PMD-style sprite sheets, `{species}.png` per coat and one description per pokemon                                         |
| `sprite-pipeline.json` | What has been done to each sheet, and to which version of it                                                              |
| `test/`                | Vitest suites, mirroring the source tree                                                                                  |
| `docs/`                | The mechanics and Firestore documentation                                                                                 |

Two conventions are worth knowing before reading the source. Every module has a
single `export default` where it has an obvious main export. And effects — an
ability, a held item, a status — are **written once and register themselves**
against the events they care about, instead of being spelled out inside whatever
function needed them. Nothing that stages a spawn or resolves a hit names an
ability.

## License

MIT. See [LICENSE](LICENSE).
