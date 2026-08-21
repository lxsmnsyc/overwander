# Credits

Who and what this game is built out of: the person who wrote it, the libraries
it stands on, the art it draws with, and the games it takes its rules from.

Anything shipped in this repository that somebody else made belongs on this
page. If you add a dependency, an asset, or a piece of somebody else's work, add
it here in the same commit. A credit left for later is a credit that never gets
written.

## The game

Poketerra is written by **Alexis H. Munsayac**, and the code is MIT licensed —
see [LICENSE](../LICENSE). That covers the source in `src/`, `test/`, `e2e/`
and `scripts/`, and the documentation in `docs/`. It does not cover the art, or
anything named in the notice below.

## What this is not

Poketerra is a fan project. **Pokémon** is a trademark of Nintendo, Creatures
Inc. and GAME FREAK Inc., and The Pokémon Company owns the franchise. None of
them is affiliated with this project, has endorsed it, or has seen it. The
species, moves, abilities, items and type chart are theirs. The names are used
for one reason only: a Gen 1 game that renamed Bulbasaur would not be a Gen 1
game. Nothing here is sold, and nothing here is offered as an official product.

## Runtime dependencies

What ships in the built app.

| Package                                              | What it does for the game                                                                                                | Licence   |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | --------- |
| [solid-js](https://solidjs.com)                      | Signals, resources and rendering — the whole reactive layer                                                              | MIT       |
| `@solidjs/start`                                     | The app framework: file routes, server functions, SSR                                                                    | MIT       |
| `@solidjs/router`                                    | Routing under SolidStart                                                                                                 | MIT       |
| `@solidjs/meta`                                      | Document head — the page title                                                                                           | MIT       |
| [terracotta](https://github.com/lxsmnsyc/terracotta) | Headless, accessible dialogs, tabs, menus and buttons; every dialog in the game is one of these with our own paint on it | MIT       |
| [Tailwind CSS](https://tailwindcss.com)              | Styling, configured in `src/app.css`                                                                                     | MIT       |
| `@supabase/supabase-js`                              | Auth, the client's reads under row-level security, and the realtime socket                                               | MIT       |
| `postgres`                                           | The direct connection the privileged writes in `src/server/` travel over                                                 | Unlicense |
| `jose`                                               | Verifying a caller's access token without a round trip                                                                   | MIT       |
| `date-fns`                                           | Formatting the dates a record carries                                                                                    | MIT       |
| `nitro`                                              | The server SolidStart builds onto                                                                                        | MIT       |
| `server-only`                                        | The marker that keeps server modules out of the client bundle                                                            | MIT       |
| `vite`                                               | Dev server and bundler, at runtime through SolidStart                                                                    | MIT       |

## Build and test

What the repository uses and the player never sees.

| Package                                  | What it does                                         | Licence    |
| ---------------------------------------- | ---------------------------------------------------- | ---------- |
| [TypeScript](https://typescriptlang.org) | The language, and `tsc --noEmit` as the first check  | Apache-2.0 |
| [Vite](https://vite.dev)                 | Dev server, bundler, and the test runner's front end | MIT        |
| [Vitest](https://vitest.dev)             | The unit suites under `test/`                        | MIT        |
| [Playwright](https://playwright.dev)     | The browser suites under `e2e/`                      | Apache-2.0 |
| [oxlint](https://oxc.rs)                 | Linting                                              | MIT        |
| `oxlint-tsgolint`                        | The type-aware half of the lint rules                | MIT        |
| [oxfmt](https://oxc.rs)                  | Formatting                                           | MIT        |
| `@lxsmnsyc/oxlint-config`                | The lint configuration this project starts from      | MIT        |
| Supabase CLI                             | The local stack the tests run against                | Apache-2.0 |
| `@tailwindcss/vite`                      | Tailwind's Vite plugin                               | MIT        |
| `@changesets/cli`                        | Versioning                                           | MIT        |

Versions are in [package.json](../package.json); the exact tree is in
`pnpm-lock.yaml`.

## Art

Everything drawn on a canvas lives under `public/sprites`, as sheets of pixel art
with a description saying where the pictures are.

| Path                                      | What it holds                                                        |
| ----------------------------------------- | -------------------------------------------------------------------- |
| `public/sprites/pokemon/{region}/regular` | One `{species}.png` per pokemon: every picture it is drawn in        |
| `public/sprites/pokemon/{region}/shiny`   | The same pokemon again in their shiny colours                        |
| `public/sprites/pokemon/{region}/meta`    | One `{species}.json` per pokemon: the clips, the frames, the anchors |
| `public/sprites/coats.json`               | Which coats each pokemon has, and the stamp of what is on disk       |
| `public/sprites/ui/items`                 | Item icons, one sheet per kind — balls, berries, medicine, plates    |
| `public/sprites/ui/move-categories`       | The three marks a move's category is shown by                        |

Sheets are filed by region — `kanto` for the first 151, `unknown` for Missingno,
the egg and the substitute — and which region a pokemon belongs to comes from its
dex number rather than from a list beside the files.

**A sheet is a bag of pictures rather than a grid.** Each distinct drawing is
stored once, cropped to the pixels that are lit, wherever the packer put it; a
frame says which picture it draws, whether it is mirrored, and where that picture
hangs inside the clip's box. Two animations that share a drawing point at one copy
of it, and the four coats are compared together so a picture is only shared when
it matches in all of them. `src/canvas/sprite-sheet.ts` is the whole of that
contract and `src/canvas/species-sprite-animation.ts` plays it.

The art began as **PMD sprites** — the layout Pokémon Mystery Dungeon fan
projects use, eight facing rows per animation with an `anims` block and per-frame
anchors — and the anchors survive the repacking: every frame still says where the
pokemon's shadow, centre, head and hands are.

Two passes run over the sheets. `pnpm compact-sprites` rewrites the PNG containers
as indexed colour without touching a pixel, and
[`scripts/repack-sprites.ts`](../scripts/repack-sprites.ts) crops and de-duplicates
the pictures — together they took the 154 sheets that ship from 15.0MB to 2.1MB on
disk, and from 1,752MB to 49MB decoded in a browser.
[sprite-pipeline.json](../sprite-pipeline.json) records what was done to which
version of which sheet, so a sheet whose digest no longer matches its entry has
been re-exported since, and the tests say so. `pnpm sprite-coats` restamps
`coats.json` afterwards, without which a browser draws yesterday's sheet against
today's description.

### Where the sheets come from

| Sheets                             | Source                                                              | Licence                                                                                        |
| ---------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `pokemon/regular`, `pokemon/shiny` | [PMDCollab/SpriteCollab](https://github.com/PMDCollab/SpriteCollab) | CC BY-NC — attribution, **non-commercial**                                                     |
| `pokemon/meta`                     | Derived from the same collection's `AnimData.xml` and `Offsets.png` | The same terms as the sprites it describes                                                     |
| `ui/items`                         | [msikma/pokesprite](https://github.com/msikma/pokesprite)           | Sprite images © Nintendo/Creatures Inc./GAME FREAK Inc.; that repo's own code and data are MIT |
| `ui/move-categories`               | Not recorded yet                                                    | Unknown                                                                                        |

**SpriteCollab** is the Pokémon Mystery Dungeon sprite collection this game's
pokemon are animated from. The drawings themselves, the frame durations and the
marked shadow, head and hands are all theirs, and they survive the repacking
unchanged. Its terms are `CC BY-NC`: it may be redistributed and built upon with
appropriate credit, and **not commercially**.

Every sprite in it carries its own credit row in `sprite/{dex}/credits.txt`, with
the names in the collection's `credit_names.txt`. The 164 sheets that ship —
Kanto's 161 plus the three under `unknown` — are credited there, most of them to
**CHUNSOFT**, whose games the sprites are drawn from.

**pokesprite** is where the item icons come from: 32×32 inventory sprites, named
the way that project names them, which is why an `Exp. Share` is `exp-share.png`
on the `held` sheet. Its README is explicit that the code is MIT and **the sprite
images are not** — they are © Nintendo/Creatures Inc./GAME FREAK Inc., like the
names in `src/data`.

> **What is still missing.** Three of the sheets under `pokemon` are not pokemon
> — the Missingno placeholder, an egg and a substitute, numbered past a hundred
> thousand — and nobody wrote down which entry of which pack each came from. The
> source of the three move-category marks is also unrecorded. Both need filling
> in before this is published anywhere. Any pokemon added later needs its own credit row pulled
> from `sprite/{dex}/credits.txt` when its sheet is added.
>
> **The art is not MIT.** The licence at the root of this repository covers the
> code; it does not and cannot cover this directory. `CC BY-NC` makes a
> commercial release impossible without replacing the pokemon sheets, and the
> item icons are Nintendo's outright.

## The rules

The dex is Gen 1 — 151 species and their moves, abilities and items — but the
mechanics are the modern ones wherever the two disagree: the special split, the
current type chart, natures, effort values, abilities, held items and
friendship. All of that is the mainline games' design, reimplemented here from
the published behaviour rather than copied from anything. The tables in
`src/data/` are typed out, and what they mean is worked out again in
`src/battle/` and `src/overworld/`. Where this game departs on purpose —
real-time battles instead of turns, a derived world instead of a drawn one,
candy and raids and auctions — [the mechanics pages](mechanics.md) say so and
say why.

The world itself owes nothing to the series. The terrain is Perlin noise sorted
into biomes by a Whittaker-style climate diagram, which is the standard approach
to the problem and nobody's in particular.
