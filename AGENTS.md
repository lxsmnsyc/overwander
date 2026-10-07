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
- `move-visuals` - every legendary or mythical signature move has a battle
  shape of its own (two signatures of one pokemon are two shapes); other moves
  reuse an earlier shape, named in `effect/named.ts`.
- `prefer-sets` - use `Set.has` for membership checks instead of scanning arrays.
- `prefer-for-of` - iterate with `for...of` rather than callback Array methods
  such as `map`, `filter`, `some` and `find`; `sort` and JSX `<For>` stay.
- `batched-queries` - `batchedQuery` is for the browser, where many rows each read
  one key at once; the server reads many keys with one query instead, and never
  merges separate requests or batches inside a transaction.
- `server-reads` - the browser reads only through server functions, which check
  their arguments, call `requireReader`, decide who may see each row, and are
  registered with `readOnly`; a table followed live needs its trigger and a
  rule in `src/server/live/rules.ts`.
- `server-function-order` - a `'use server'` function is addressed by its place
  in its file; the build guard refuses every call from another build, so it
  must never be weakened and every server call must go through `fetch`.
- `spawn-surfaces` - a biome's pools are mixed into one roster that each cell
  cuts by surface; a species' kind (ground, water or flying) decides where it
  stands, and only an amphibious water species leaves the water.
- `world-generation` - the live world's generation is frozen and pinned by a
  fingerprint test; every roll that places something on the ground goes through
  `world.draws(key)` with a name, and existing calls are never reordered; rows
  tied to the ground carry a `generation` column that every query filters on.
- `trigger-driven-abilities` - ability effects that do not mutate their
  detection event ride `UnitTriggerAbility` at `Exact` priority.
- `action-forms` - a dialog that asks something is a form opened with
  `openForm` and awaited; an NPC is a folder under `src/overworld/npcs` whose
  `createNpc` names who they are and lazily loads the script that talks
  through a conversation of forms, and the server still decides.
- `changesets` - every change against `main` ships with one, and a fix for
  something the same branch broke ships with none. `patch` when something that
  already existed behaves differently, `minor` when something new exists,
  `major` only with the maintainer's approval. The description stays short,
  a list when it covers several things.
