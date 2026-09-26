# Contributing to Overwander

Thanks for taking an interest. This page covers what a change needs before it is
ready to send, and where the rules that are not obvious from the source live.

[README.md](README.md) covers installing, running and configuring the game. Read
that first if you have not run it yet.

## Before you write code

- **Open an issue for anything large.** A bug fix or a small addition can go
  straight to a pull request. A new system, a schema change or a change to world
  generation is worth agreeing on first.
- **Read the skill that covers your task.** Conventions live in
  `.agents/skills/*/SKILL.md` and `.claude/skills/*/SKILL.md`, one folder per
  convention. The two sets are not identical, so list both. `CLAUDE.md` and
  `AGENTS.md` summarise the ones that touch nearly every change.
- **Check `docs/`.** [The battle engine](docs/engine.md) explains the event bus
  and the AI. [The database](docs/database.md) lists every table and who may
  write to it. [The player's guide](docs/mechanics.md) is how the game is meant
  to behave.

## Setting up

```bash
pnpm install
cp .env.example .env    # fill it in, see the README
pnpm db                 # the local Supabase stack
pnpm dev                # http://localhost:3000
```

Use pnpm. The lockfile is `pnpm-lock.yaml`, and npm or yarn will fight it.

## Branches and commits

- **Branch off `main`**, one branch per piece of work.
- **A branch stacked on another branch syncs from that branch**, not from
  `main`. Merge, do not rebase: these branches are shared.
- **Commit messages are `type: summary`**, in the imperative and under about 72
  characters. `add:` for something new, `fix:` for something that already
  existed. A scope is optional: `add(battle): move plates`.
- Put extra detail in the body as a list of sentences.

## Prose rules

These apply to comments, commit messages, pull requests, changesets and
documentation alike.

- **Keep comments short and about the why.** Most blocks are one to four lines.
  Design history belongs in git, not in a doc block.
- **No em-dashes.** Use a comma, a colon, brackets, or two sentences.
- **No metaphors.** Say what the code does in plain terms.
- **Write several points as a list**, one idea per sentence.

## Changesets

Every user-visible change ships with a changeset. Run `pnpm cs:add`, or write
the file under `.changeset/` by hand.

- **`patch`**: something that already existed now behaves differently. A bug
  fixed, a number retuned, a screen relaid.
- **`minor`**: something exists now that did not exist before. A new item, a new
  ability, a new screen.
- **`major`**: ask first. Never write one on your own judgement.

A changeset describes the change **against `main`**. If your branch adds
something and then corrects it before merging, nobody outside ever saw the
broken version, so amend the original changeset rather than adding a second one.

Keep the description to one line saying what is true now, or a list of such
lines. The audience is a player or another developer, not a reviewer of your
diff.

## Checks

Run these before you push. CI runs the first three on every pull request.

```bash
pnpm exec tsc --noEmit      # type-check
pnpm exec oxlint src test   # lint, never biome
pnpm test                   # the whole unit suite
pnpm exec oxfmt src test    # format
```

Two suites need the local stack and are not run by CI:

```bash
pnpm db          # in one terminal
pnpm test:rules  # the row-level security suite
pnpm test:e2e    # the Playwright suites
```

Run those two **one at a time**. The rules suite clears game rows between cases
and will delete the accounts the browser tests are signed in as.

## What reviewers look for

### Tests

Tests live in `test/`, mirroring the source tree, and run the real engines
rather than mocks. A battle test builds a fight through `test/battle/harness.ts`
and drives it with `battle.tick(ms)`. A test that reads species, moves,
abilities or items must call `registerGameData()` first.

A fix should come with a test that fails without it.

### Data

Everything in `src/data/` describes itself and registers itself. Each registry
is a folder with a `__create.ts`, files of entries and an `index.ts` that
registers them. Ids are `const enum`s in `src/data/ids/`.

Every entry carries a one-line player-facing `description` that says what this
engine does, not what the mainline does, using this engine's own numbers. A test
asserts each one ends in a full stop.

### The battle engine

The engine is real time. A mainline turn is 2 seconds, written `turns(n)` from
`src/battle/turn.ts` rather than as a number of milliseconds.

Everything is an event on one bus. Effects register themselves, and no mechanic
names an ability by id. Where a move already does what you need, cast that move
rather than reimplementing it.

### The server boundary

- `src/auth/` runs in the browser and reads under row-level security.
- `src/server/` is privileged. Every module opens with `import 'server-only'`.

A server function checks each of its arguments with `check` from
`src/server/validate.ts`, then calls `requireUid(token)` before touching
anything privileged. A `'use server'` function is addressed by its place in its
file, so new ones go at the end, and existing ones are never removed, reordered
or given different parameters.

### The world

The map is never stored. Terrain, landmarks, spawns and raids are derived from
the world seed, the coordinates and the clock, so **anything that changes
generation changes what every existing player sees**. A fingerprint test pins
both generations, and moving it is a decision rather than an accident. Say so in
the pull request when you do.

Every roll that places something on the ground goes through `world.draws(key)`
with a name, and existing calls are never reordered.

### The interface

Build controls on the terracotta primitives rather than hand-rolled elements.
Canvas is for the overworld and battle scenes only; interface sprites are CSS
background-images in the DOM. A component that calls `createResource` must not
read it, since the read belongs in a child under `Suspense`.

## Sprites

Pokemon sheets come from [lxsmnsyc/SpriteCollab](https://github.com/lxsmnsyc/SpriteCollab),
this project's fork of [SpriteCollab](https://github.com/PMDCollab/SpriteCollab).
Check it out beside this repository, at `../SpriteCollab`, and copy the sheets
in with `pnpm import-sprites`. Whether a pokemon or a coat has art is answered
there rather than by what is already packed into `public/sprites/`, so pull the
fork before concluding a sprite is missing.

Do not hand-draw a stand-in for art that exists there, and do not add a species
to a spawn pool until its whole family is drawn.

`sprite-pipeline.json` records what has been done to each sheet.

## Pull requests

Write a short summary, then list the changes as sentences, then say how you
tested them. Mention anything a reviewer could not see from the diff: a moved
fingerprint, a migration, a change to what existing players will find in the
world.

Releases are cut by the maintainer. Pending changesets on `main` keep a version
pull request up to date, and merging that one publishes the release, so you
never need to bump a version yourself.

## License

Contributions are MIT licensed, the same as the rest of the repository. See
[LICENSE](LICENSE).
