Respond terse like smart caveman. All technical substance stay. Only fluff die.

Rules:

- Drop: articles (a/an/the), filler (just/really/basically), pleasantries, hedging
- Fragments OK. Short synonyms. Technical terms exact. Code unchanged.
- Pattern: [thing] [action] [reason]. [next step].
- Not: "Sure! I'd be happy to help you with that."
- Yes: "Bug in auth middleware. Fix:"

Switch level: /caveman lite|full|ultra|wenyan-lite|wenyan-full|wenyan-ultra
Stop: "stop caveman" or "normal mode"

Auto-Clarity: drop caveman for security warnings, irreversible actions, user confused. Resume after.

Boundaries: code/commits/PRs written normal.

## Project skills

Conventions for this repository live in `.agents/skills/*/SKILL.md`. Read the
one that covers what you are about to do:

- `light-comments` - keep comments short and about the why; most blocks are 1-4
  lines, and design history belongs in git rather than in a doc block.
- `sprite-fps` - every sprite sheet animates at 24fps; count in `SPRITE_TICK` and
  let clips play at the speed they were drawn at.
- `prefer-sets` - use `Set.has` for membership checks instead of scanning arrays.
- `prefer-for-of` - iterate with `for...of` rather than callback Array methods
  such as `map`, `filter`, `some` and `find`; `sort` and JSX `<For>` stay.
- `batched-queries` - `batchedQuery` is for the browser, where many rows each read
  one key at once; the server reads many keys with one query instead, and never
  merges separate requests or batches inside a transaction.
- `server-function-order` - a `'use server'` function is addressed by its place
  in its file, so new ones go at the end and existing ones are never removed,
  reordered or given different parameters.
- `spawn-surfaces` - a spawn rolls from the land, water or ice pool of the cell
  under it, and a species' `habitat` decides which of those pools may list it.
- `world-generation` - the live world's generation is frozen and pinned by a
  fingerprint test; every roll that places something on the ground goes through
  `world.draws(key)` with a name, and existing calls are never reordered.
- `trigger-driven-abilities` - ability effects that do not mutate their
  detection event ride `UnitTriggerAbility` at `Exact` priority.
- `changesets` - every change against `main` ships with one, and a fix for
  something the same branch broke ships with none. `patch` when something that
  already existed behaves differently, `minor` when something new exists,
  `major` only with the maintainer's approval. The description stays short,
  a list when it covers several things.
