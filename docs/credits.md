# Credits

Who and what this game is built out of: the person who wrote it, the libraries
it stands on, the art it draws with, and the games it takes its rules from.

Anything shipped in this repository that somebody else made belongs in the
credits. This page is the half that has to be explained: the terms, why they
bind, and what they rule out. The **lists** are in
[public/credits.json](../public/credits.json), which is where the credits
screen in the game reads them from, so a name reaches a player rather than only
a reader of the source.

If you add a dependency, an asset, or a piece of somebody else's work, add it to
that file in the same commit. A credit left for later is a credit that never
gets written.

Two of its sections are derived and must not be edited by hand: `sprites` is
scanned out of every `sheet.json` by `pnpm import-sprites`, and `overworld` is
written a row at a time by the sprite processor as it packs a charset.

## The game

Overwander is written by **Alexis H. Munsayac**, and the code is MIT licensed.
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

## The libraries

Every package that ships in the app and every one that only builds it is listed
in [credits.json](../public/credits.json), under `packages`, with what it does
here and what its licence is. Versions are in [package.json](../package.json);
the exact tree is in `pnpm-lock.yaml`.

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

Each body of somebody else's work, and its terms, is listed in
[credits.json](../public/credits.json) under `sources`.

**SpriteCollab** is the Pokémon Mystery Dungeon sprite collection this game's
pokemon are animated from. The drawings themselves, the frame durations and the
marked shadow, head and hands are all theirs, and they survive the repacking
unchanged. Its terms are `CC BY-NC`: it may be redistributed and built upon with
appropriate credit, and **not commercially**.

Every sprite in it carries its own credit row in `sprite/{dex}/credits.txt`, with
the names in the collection's `credit_names.txt`. Those rows are carried into each
sheet's own `sheet.json`, under `credits`, one list per coat: the 281 sheets that
ship, Kanto and Johto's 251 with Unown's 27 other letters plus the three under
`unknown`, name their artists in the file beside the drawing. `pnpm
import-sprites` scans them back out into `credits.json`, so a pokemon cannot
land in `public/` without its artists landing on the credits screen. Most are
**CHUNSOFT**, whose games the sprites are drawn from.

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

The sprite processor's Pokengine step writes a row into `credits.json` for every
charset it packs, from the credit typed in beside the sheet, so a sheet cannot
land in `public/` without its artist landing in the list. A sheet missing from
it predates the step and came from ripped Gen 4 overworlds; those are being
replaced.

### Landmarks, decorations and trees

The tiles the world is drawn out of are fan-made too, and are listed in
`credits.json` under `scenery`. It is names alone: nobody wrote down which of
them drew which tile, and inventing that mapping would be worse than not having
it.

> **What is still missing.** Three of the sheets under `pokemon` are not pokemon
> (the Missingno placeholder, an egg and a substitute, numbered past a hundred
> thousand) and nobody wrote down which entry of which pack each came from. The
> source of the three move-category marks is also unrecorded. Both need filling
> in before this is published anywhere.
>
> **The art is not MIT.** The licence at the root of this repository covers the
> code; it does not and cannot cover this directory. `CC BY-NC` makes a
> commercial release impossible without replacing the pokemon sheets, and the
> item icons are Nintendo's outright.

## The rules

The dex is Gen 1, with 151 species and their moves, abilities and items, but the
mechanics are the modern ones wherever the two disagree: the special split, the
current type chart, natures, effort values, abilities, held items and
friendship. All of that is the mainline games' design, reimplemented here from
the published behaviour rather than copied from anything. The tables in
`src/data/` are typed out, and what they mean is worked out again in
`src/battle/` and `src/overworld/`. Where this game departs on purpose, such as
real-time battles instead of turns, a derived world instead of a drawn one,
candy and raids and auctions, [the mechanics pages](mechanics.md) say so and
say why.

The world itself owes nothing to the series. The terrain is Perlin noise sorted
into biomes by a Whittaker-style climate diagram, which is the standard approach
to the problem and nobody's in particular.
