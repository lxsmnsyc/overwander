# Credits

Who and what this game is built out of: the person who wrote it, the libraries
it stands on, the art it draws with, and the games it takes its rules from.

Anything shipped in this repository that somebody else made belongs on this
page. If you add a dependency, an asset, or a piece of somebody else's work, add
it here in the same commit. A credit left for later is a credit that never gets
written.

## The game

Overwander is written by **Alexis H. Munsayac**, and the code is MIT licensed —
see [LICENSE](../LICENSE). That covers the source in `src/`, `test/`, `e2e/`
and `scripts/`, and the documentation in `docs/`. It does not cover the art, or
anything named in the notice below.

## What this is not

Overwander is a fan project. **Pokémon** is a trademark of Nintendo, Creatures
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
| [fflate](https://github.com/101arrowz/fflate)        | Inflating a sheet's frames on a browser with no `DecompressionStream`, fetched only by those                              | MIT       |
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

| Path                                                | What it holds                                                     |
| --------------------------------------------------- | ----------------------------------------------------------------- |
| `public/sprites/pokemon/{region}/{species}/*.png`   | One drawing per coat: regular, shiny, and a female pair where one was drawn |
| `public/sprites/pokemon/{region}/{species}/sheet.json` | The layout every coat is drawn against, and who drew each of them |
| `public/sprites/pokemon/{region}/{species}/frames.bin` | The frames themselves: which picture, where, and the anchors on it |
| `public/sprites/pokemon/coats.json`                 | Which coats each pokemon has, and the stamp of what is on disk    |
| `public/sprites/ui/items`                           | Item icons, one sheet per kind: balls, berries, medicine, plates   |
| `public/sprites/ui/move-categories`                 | The three marks a move's category is shown by                     |
| `public/sprites/ui/types`                           | The eighteen sigils a type is shown by                            |

Sheets are filed by region, `kanto` and `johto` for the first 251 and their forms
and `unknown` for Missingno, the egg and the substitute, and which region a
pokemon belongs to comes from its dex number rather than from a list beside the
files.

**A sheet is a bag of pictures rather than a grid.** Each distinct drawing is
stored once, cropped to the pixels that are lit, wherever the packer put it; a
frame says which picture it draws, whether it is mirrored, and where that picture
hangs inside the clip's box. Two animations that share a drawing point at one copy
of it, and every coat of a pokemon is packed to one layout, so a shiny is a second
PNG over the same frames. `src/canvas/sprite-sheet.ts` is the whole of that
contract and `src/canvas/species-sprite-animation.ts` plays it.

The art is **PMD sprites**, the layout Pokémon Mystery Dungeon fan projects use:
eight facing rows per animation, an `anims` block, and an anchor for the pokemon's
shadow, centre, head and hands. The anchors survive the packing.

The sheets are made outside this repository, in the SpriteCollab checkout beside
it, which is where the archives and the packing tools live. `pnpm import-sprites`
copies the finished folders in, renaming each from the collection's
`{region}/{dex}/{form}` to the species id this game knows it by.

`pnpm compact-sprites` runs over them afterwards and rewrites any PNG container
that can be smaller without a pixel changing. [sprite-pipeline.json](../sprite-pipeline.json)
records what was done to which version of which sheet, so a sheet whose digest no
longer matches its entry has been re-exported since, and the tests say so. The
import restamps `coats.json` itself, without which a browser draws yesterday's
sheet against today's description.

### Where the sheets come from

| Sheets                             | Source                                                              | Licence                                                                                        |
| ---------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `pokemon/{region}/{species}`       | [PMDCollab/SpriteCollab](https://github.com/PMDCollab/SpriteCollab) | CC BY-NC: attribution, **non-commercial**                                                      |
| `sheet.json`, `frames.bin`         | Derived from the same collection's `AnimData.xml` and `Offsets.png` | The same terms as the sprites it describes                                                     |
| `ui/items`                         | [msikma/pokesprite](https://github.com/msikma/pokesprite)           | Sprite images © Nintendo/Creatures Inc./GAME FREAK Inc.; that repo's own code and data are MIT |
| `ui/move-categories`               | [msikma/pokesprite](https://github.com/msikma/pokesprite)           | The same terms                                                                                 |
| `ui/types`                         | [msikma/pokesprite](https://github.com/msikma/pokesprite)           | The same terms                                                                                 |

**SpriteCollab** is the Pokémon Mystery Dungeon sprite collection this game's
pokemon are animated from. The drawings themselves, the frame durations and the
marked shadow, head and hands are all theirs, and they survive the repacking
unchanged. Its terms are `CC BY-NC`: it may be redistributed and built upon with
appropriate credit, and **not commercially**.

Every sprite in it carries its own credit row in `sprite/{dex}/credits.txt`, with
the names in the collection's `credit_names.txt`. Those rows are carried into each
sheet's own `sheet.json`, under `credits`, one list per coat: the 281 sheets that
ship, Kanto and Johto's 251 with Unown's 27 other letters plus the three under
`unknown`, name their artists in the file beside the drawing. Most are **CHUNSOFT**, whose games the sprites are
drawn from.

**pokesprite** is where every icon in the interface comes from. The item icons
are its 32×32 inventory sprites, named the way that project names them, which is
why an `Exp. Share` is `exp-share.png` on the `held` sheet. The eighteen **type
badges** and the three **move category marks**, physical, special and status, are
its `misc` set. Its README is explicit that the code and the data are MIT and
**the sprite images are not**: they are © Nintendo/Creatures Inc./GAME FREAK
Inc., like the names in `src/data`.

### Pokengine community

The overworld character sheets under `public/sprites/overworld` are fan-made
sprites from the [Pokengine](https://pokengine.org) community. The rights to
each sheet stay with the artist who drew it; they are used here with credit and
not commercially, on the same footing as the pokemon sheets above.

The sprite processor's Pokengine step writes a row into this table for every
charset it packs, from the credit typed in beside the sheet, so a sheet cannot
land in `public/` without its artist landing here. A sheet missing from the
table predates the step and came from ripped Gen 4 overworlds; those are being
replaced.

| Sheet                           | Credit            |
| ------------------------------- | ----------------- |
| `characters/extra/nurse`        | kyledove          |
| `characters/frlg/ace-trainer-f` | kyledove          |
| `characters/frlg/ace-trainer-m` | kyledove          |
| `characters/frlg/agatha`        | kyledove          |
| `characters/frlg/beauty`        | kyledove          |
| `characters/frlg/bill`          | kyledove          |
| `characters/frlg/blaine`        | kyledove          |
| `characters/frlg/blue`          | kyledove          |
| `characters/frlg/brock`         | kyledove          |
| `characters/frlg/bruno`         | kyledove          |
| `characters/frlg/bug-catcher`   | kyledove          |
| `characters/frlg/camper-f`      | kyledove          |
| `characters/frlg/camper-m`      | kyledove          |
| `characters/frlg/captain`       | kyledove          |
| `characters/frlg/captain-2`     | kyledove          |
| `characters/frlg/chef`          | kyledove          |
| `characters/frlg/crush-girl`    | Ginzuishou        |
| `characters/frlg/daisy-oak`     | kyledove          |
| `characters/frlg/erika`         | kyledove          |
| `characters/frlg/gentleman`     | kyledove          |
| `characters/frlg/giovanni`      | kyledove          |
| `characters/frlg/hiker`         | kyledove          |
| `characters/frlg/koga`          | kyledove          |
| `characters/frlg/lady`          | figyberries       |
| `characters/frlg/lance`         | kyledove          |
| `characters/frlg/lass`          | Kazan(TrainerRed) |
| `characters/frlg/leaf`          | kyledove          |
| `characters/frlg/lorelei`       | PurpleZaffre      |
| `characters/frlg/man-1`         | kyledove          |
| `characters/frlg/man-2`         | kyledove          |
| `characters/frlg/man-3`         | kyledove          |
| `characters/frlg/misty`         | kyledove          |
| `characters/frlg/mr-fuji`       | PurpleZaffre      |
| `characters/frlg/oak`           | kyledove          |
| `characters/frlg/officer`       | kyledove          |
| `characters/frlg/old-man`       | kyledove          |
| `characters/frlg/red`           | Jext              |
| `characters/frlg/rocker`        | Jext              |
| `characters/frlg/roughneck`     | SoundMS           |
| `characters/frlg/ruin-maniac`   | kyledove          |
| `characters/frlg/sabrina`       | kyledove          |
| `characters/frlg/sailor`        | kyledove          |
| `characters/frlg/shop-keeper`   | kyledove          |
| `characters/frlg/staff-member`  | kyledove          |
| `characters/frlg/surge`         | kyledove          |
| `characters/frlg/tamer`         | Jext              |
| `characters/frlg/woman`         | kyledove          |
| `characters/hgss/blaine`        | Jext              |
| `characters/hgss/blue`          | Jext              |
| `characters/hgss/brock`         | Jext              |
| `characters/hgss/bruno`         | Jext              |
| `characters/hgss/erika`         | Jext              |
| `characters/hgss/giovanni`      | Jext              |
| `characters/hgss/koga`          | Jext              |
| `characters/hgss/lance`         | Jext              |
| `characters/hgss/lance-2`       | Jext              |
| `characters/hgss/misty`         | Jext              |
| `characters/hgss/oak`           | kyledove          |
| `characters/hgss/red`           | Jext              |
| `characters/hgss/rocket-f`      | Jext              |
| `characters/hgss/rocket-m`      | Jext              |
| `characters/hgss/sabrina`       | Jext              |
| `characters/hgss/surge`         | Jext              |
| `characters/lgpe/ace-trainer`   | PixelMister       |
| `characters/lgpe/agatha`        | PurpleZaffre      |
| `characters/lgpe/bill`          | kyledove          |
| `characters/lgpe/bird-keeper`   | figyberries       |
| `characters/lgpe/black-belt`    | kyledove          |
| `characters/lgpe/blaine`        | kyledove          |
| `characters/lgpe/blue`          | kyledove          |
| `characters/lgpe/brock`         | kyledove          |
| `characters/lgpe/bruno`         | kyledove          |
| `characters/lgpe/bug-catcher`   | kyledove          |
| `characters/lgpe/burglar`       | kyledove          |
| `characters/lgpe/camper`        | kyledove          |
| `characters/lgpe/channeler`     | kyledove          |
| `characters/lgpe/daisy-oak`     | kyledove          |
| `characters/lgpe/engineer`      | kyledove          |
| `characters/lgpe/erika`         | kyledove          |
| `characters/lgpe/fisherman`     | kyledove          |
| `characters/lgpe/gambler`       | kyledove          |
| `characters/lgpe/gentleman`     | kyledove          |
| `characters/lgpe/giovanni`      | kyledove          |
| `characters/lgpe/gym-guide`     | kyledove          |
| `characters/lgpe/hiker`         | kyledove          |
| `characters/lgpe/juggler`       | kyledove          |
| `characters/lgpe/koga`          | kyledove          |
| `characters/lgpe/lance`         | kyledove          |
| `characters/lgpe/lass`          | figyberries       |
| `characters/lgpe/man`           | kyledove          |
| `characters/lgpe/misty`         | kyledove          |
| `characters/lgpe/oak`           | kyledove          |
| `characters/lgpe/picnicker`     | kyledove          |
| `characters/lgpe/poke-maniac`   | kyledove          |
| `characters/lgpe/psychic`       | kyledove          |
| `characters/lgpe/punk`          | kyledove          |
| `characters/lgpe/red`           | Kazan(Red)        |
| `characters/lgpe/rocker`        | kyledove          |
| `characters/lgpe/roughneck`     | kyledove          |
| `characters/lgpe/sabrina`       | kyledove          |
| `characters/lgpe/sailor`        | kyledove          |
| `characters/lgpe/scientist`     | kyledove          |
| `characters/lgpe/super-nerd`    | kyledove          |
| `characters/lgpe/surge`         | kyledove          |
| `characters/lgpe/swimmer-f`     | kyledove          |
| `characters/lgpe/swimmer-m`     | kyledove          |
| `characters/lgpe/tamer`         | kyledove          |
| `characters/lgpe/trace`         | kyledove          |

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
