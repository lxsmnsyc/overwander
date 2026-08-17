# Mystery gifts

A gift is something the game decides a player is owed and then waits with. It is
**offered** — written down whole, with whatever it holds already rolled — and
**claimed** later from the gifts dialog. Nothing is theirs until they take it.

`gifts/{gift}:{uid}` ([`src/auth/gift-record.ts`](../../src/auth/gift-record.ts))

| Field       | Type            | What it is                                            |
| ----------- | --------------- | ----------------------------------------------------- |
| `player`    | `string`        | Whose gift it is                                      |
| `gift`      | map             | What the player sees: `MysteryGift`, below            |
| `offeredAt` | `number`        | When the game shelved it                              |
| `claimedAt` | `number ǀ null` | When it was taken, or null while it is still waiting  |
| `encounter` | map ǀ null      | The rolled pokemon, for a catch gift and nothing else |

`gift` is one of two shapes, both carrying an `id` — the gift's name, which is
what a claim asks for — and a `reason` sentence shown on its card:

| Kind    | Id  | Extra fields                                                 |
| ------- | --- | ------------------------------------------------------------ |
| `Catch` | 0   | `species`, `level`, `shiny`, `individualValue`, `traitValue` |
| `Item`  | 1   | `item`, `amount`                                             |

## The pokemon is frozen at the offer

A catch gift stores the whole `EncounterRecord` it will become
([Encounter kinds](encounters.md)), rather than a seed to re-roll on the way out.
A species day passing between the offer and the claim would otherwise change the
pokemon the box already showed. Claiming writes that record through
`writeCaughtRecord` with `Acquisition.Gift`, in a Premier Ball — nothing was
thrown, and the record still has to name a ball.

## Offered once, taken once

The document is the offer and the marker at once. Offering reads and writes the
whole giving in one transaction, so two tabs signing in together cannot both find
nothing there. Claiming stamps `claimedAt` in a transaction **before** anything is
handed over, so a second press finds it already gone rather than being paid twice.

A claimed gift is kept rather than deleted: what the game has given somebody
stays readable.

## What is given today

One giving, in two gifts, to a player who owns no pokemon and has never been
offered one:

- `starter` — a `Base`-rarity species that still has somewhere to evolve, at
  level 5, seeded by the player's uid so retries offer the same pokemon.
- `starterBalls` — 20 Poke Balls.

Owning nothing is what makes the giving due; the documents are what make it
happen once. See [`src/server/gifts.ts`](../../src/server/gifts.ts).
