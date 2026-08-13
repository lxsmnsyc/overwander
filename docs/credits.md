# Credits

Who and what this game is built out of: the person who wrote it, the libraries
it stands on, the art it draws with, and the games it takes its rules from.

Anything shipped in this repository that somebody else made belongs on this
page. If you add a dependency, an asset, or a chunk of somebody else's work,
add it here in the same commit — a credit remembered later is a credit that
does not get written.

## The game

Poketerra is written by **Alexis H. Munsayac**, and the code is MIT licensed —
see [LICENSE](../LICENSE). That covers the source in `src/`, `test/`, `e2e/`
and `scripts/`, and the documentation in `docs/`. It does not cover the art, or
anything named in the notice below.

## What this is not

Poketerra is a fan project. **Pokémon** is a trademark of Nintendo, Creatures
Inc. and GAME FREAK Inc., and The Pokémon Company owns the franchise; none of
them is affiliated with this project, has endorsed it, or has seen it. The
species, moves, abilities, items and type chart are theirs. The names are used
because a Gen 1 game that renamed Bulbasaur would not be a Gen 1 game, and for
no other reason: nothing here is sold, and nothing here is offered as an
official product.

## Runtime dependencies

What ships in the built app.

| Package                                | What it does for the game                                    | Licence    |
| -------------------------------------- | ------------------------------------------------------------ | ---------- |
| [solid-js](https://solidjs.com)        | Signals, resources and rendering — the whole reactive layer   | MIT        |
| `@solidjs/start`                       | The app framework: file routes, server functions, SSR         | MIT        |
| `@solidjs/router`                      | Routing under SolidStart                                      | MIT        |
| `@solidjs/meta`                        | Document head — the page title                                | MIT        |
| [terracotta](https://github.com/lxsmnsyc/terracotta) | Headless, accessible dialogs, tabs, menus and buttons; every dialog in the game is one of these with our own paint on it | MIT |
| [Tailwind CSS](https://tailwindcss.com) | Styling, configured in `src/app.css`                          | MIT        |
| `firebase`                             | Auth and the client's Firestore reads and subscriptions       | Apache-2.0 |
| `firebase-admin`                       | The privileged writes in `src/server/`                        | Apache-2.0 |
| `date-fns`                             | Formatting the dates a record carries                         | MIT        |
| `nitro`                                | The server SolidStart builds onto                             | MIT        |
| `server-only`                          | The marker that keeps server modules out of the client bundle | MIT        |
| `vite`                                 | Dev server and bundler, at runtime through SolidStart         | MIT        |

## Build and test

What the repository uses and the player never sees.

| Package                            | What it does                                          | Licence    |
| ---------------------------------- | ----------------------------------------------------- | ---------- |
| [TypeScript](https://typescriptlang.org) | The language, and `tsc --noEmit` as the first check | Apache-2.0 |
| [Vite](https://vite.dev)           | Dev server, bundler, and the test runner's front end   | MIT        |
| [Vitest](https://vitest.dev)       | The unit suites under `test/`                          | MIT        |
| [Playwright](https://playwright.dev) | The browser suites under `e2e/`                      | Apache-2.0 |
| [oxlint](https://oxc.rs)           | Linting                                                | MIT        |
| `oxlint-tsgolint`                  | The type-aware half of the lint rules                  | MIT        |
| [oxfmt](https://oxc.rs)            | Formatting                                             | MIT        |
| `@lxsmnsyc/oxlint-config`          | The lint configuration this project starts from        | MIT        |
| `firebase-tools`                   | The local emulators the tests run against              | MIT        |
| `@firebase/rules-unit-testing`     | The Firestore rules suite (`pnpm test:rules`)          | Apache-2.0 |
| `@tailwindcss/vite`                | Tailwind's Vite plugin                                 | MIT        |
| `@changesets/cli`                  | Versioning                                             | MIT        |

Versions are in [package.json](../package.json); the exact tree is in
`pnpm-lock.yaml`.

## Art

Everything drawn on a canvas lives under `public/sprites`, as sheets of pixel
art with a description saying where the frames are.

| Path                                | What it holds                                                                       |
| ----------------------------------- | ----------------------------------------------------------------------------------- |
| `public/sprites/pokemon/regular`    | One `{species}.png` per pokemon, an animated sheet: idle, walk, attack, hurt, sleep |
| `public/sprites/pokemon/shiny`      | The same pokemon again in their shiny colours                                       |
| `public/sprites/pokemon/meta`       | One `{species}.json` per pokemon: the animation both coats share, and the anchors   |
| `public/sprites/ui/items`           | Item icons, one sheet per kind — balls, berries, medicine, machines, plates         |
| `public/sprites/ui/move-categories` | The three marks a move's category is shown by                                       |

The pokemon sheets are in the **PMD sprite format** — the layout Pokémon Mystery
Dungeon fan sprite projects use, with eight facing rows per animation and an
`anims` block naming the frame sizes and durations. A description under `meta`
carries that block along with the collection's **anchor points**: per frame, where
the pokemon's shadow, body, head and hands are. It is one file per pokemon rather
than one per coat, because a shiny is the same animation in different colours.
`src/canvas/sprite-sheet.ts` is the whole of that contract and
`src/canvas/species-sprite-animation.ts` plays it, so a sheet from any project
that writes the format will play without conversion. `pnpm compact-sprites`
rewrites the PNG containers as indexed colour without touching a pixel; it
changes bytes, not pictures.

> **Provenance is not yet recorded, and it must be.** Nothing in this
> repository says who drew these sheets or under what terms they may be used —
> not the descriptions under `meta`, which carry no credit field, and not the commits
> that added them. Fan sprite collections are typically licensed per sprite,
> with a named artist for each one and terms that are usually non-commercial,
> so "MIT, like the rest of the repo" is almost certainly wrong for this
> directory.
>
> Before this project is published anywhere, each source below needs filling in
> with where the sheets came from, the licence they carry, and the artists
> named by it:
>
> | Sheets              | Source | Licence | Artists |
> | ------------------- | ------ | ------- | ------- |
> | `pokemon/regular`   | —      | —       | —       |
> | `pokemon/shiny`     | —      | —       | —       |
> | `ui/items`          | —      | —       | —       |
> | `ui/move-categories`| —      | —       | —       |

## The rules

The dex is Gen 1 — 151 species and their moves, abilities and items — but the
mechanics are the modern ones wherever the two disagree: the special split,
the type chart as it stands now, natures, effort values, abilities, held items
and friendship. All of that is the mainline games' design, reimplemented here
from the published behaviour rather than copied from anything; the tables in
`src/data/` are typed out, and what they mean is worked out again in
`src/battle/` and `src/overworld/`. Where this game departs on purpose — real-time
battles instead of turns, a derived world instead of a drawn one, candy and
raids and auctions — [the mechanics pages](mechanics.md) say so and say why.

The world itself owes nothing to the series: the terrain is Perlin noise
classified into biomes by a Whittaker-style climate diagram, which is the
standard approach to the problem and not anybody's in particular.
