---
milestones: [now, next, later]
merge:
  mode: maintainer
branches:
---

# Overwander roadmap

## Outcome

Every eligible pokemon has its Zenith (`now`). The game then plays in Japanese and Spanish beside English, boots lighter, wild pokemon come, go and roam around the player, and the remaining items are in (`next`). Pixel effects, dungeons, the signature rebalance, game data in Postgres and the player systems follow (`later`).

## Acceptance

- `now`: `test/data/zeniths.test.ts` lists no region as owing a Zenith, and `docs/strategy/zeniths.md` is deleted.
- `next`: every `next` node is done, and a player can switch the whole game to ja or es.
- `later`: each strategy plan under `docs/strategy/` is deleted once its last node merges.

## Priorities

- must: the `now` milestone, the Zenith rollout.
- should: the `next` milestone: translations, the first boot work, and the remaining items.
- could: the `later` milestone, worth doing when the `next` work is in.
- later: parked; listed so it is not lost.

## Constraints

- One node at a time on this device. The machine cannot take parallel agents running the suite, so run with `--max-parallel 1`.
- The `db` service on port 54322 is production and the root `.env` is production's configuration: never touch either. Tests use `pnpm db` (port 54324) through `TEST_DATABASE_URL`.
- The live world's generation is frozen and pinned by a fingerprint test. Anything placed on the ground goes through named `world.draws(key)` rolls.
- `pnpm` only. Lint is oxlint, format is oxfmt; never biome.
- The repo is public, so pushing runs CI. Check `gh repo view --json visibility` before every push.

## Non-goals

- New regions or species beyond what the SpriteCollab checkout has drawn.
- Rewriting the strategy plans under `docs/strategy/`: nodes link to them for detail.

## Verification

- Fast check (safe per node): `pnpm typecheck && pnpm exec oxlint src test`, then the node's own test files with `pnpm exec vitest run <files>`. Read oxlint's exit code, not its output.
- Full check (at checkpoints, one at a time): `pnpm test` (several minutes; tera-sites and raid-sites can time out under full load and pass alone). `pnpm test:db` and `pnpm test:e2e` share the dev database and never run together.

## Numbered resources

- Migrations: `db/migrations/NNNN_*.sql`, next free is `0011`. Reserve with `reserves: [migration 0011]`.
- Ids in `src/data/ids/` are append-only const enums. Zenith ids follow fixed formulas (species slot 99 and down, shard `2000000 + dex*100 + (100 - slot)`), so the Zenith nodes cannot collide; they still run stacked, one after another.
- Family ids in `src/data/ids/families.ts` take the next number at the end.
- Generated files (`names.ts`, `names.json`, sprite sheets, `stamps.json`) are regenerated after merging, never merged by hand.

## Sources

- [docs/strategy/zeniths.md](../../strategy/zeniths.md), [translations.md](../../strategy/translations.md), [pixel-effects.md](../../strategy/pixel-effects.md), [dungeons.md](../../strategy/dungeons.md), [rebalance.md](../../strategy/rebalance.md), [app-logic.md](../../strategy/app-logic.md).
- `docs/todo.md` and `docs/strategy/README.md`, merged into this roadmap and removed (see git history).

## Coverage

- Strategy index (`docs/strategy/README.md`) -> this file, milestones and Sources.
- App logic plan, batches 0 to 6 -> built: PR #228. Batches 7 and 8 -> dropped in the plan itself.
- Zeniths batches 0 to 7 -> zenith-johto-galar. Batch 8 -> zenith-hisui. Batch 9 -> zenith-paldea. Mr. Rime's Zenith -> inbox: waits for its art.
- Translations batches 0 to 9 -> i18n-plumbing, i18n-registry-loader, i18n-official-names, i18n-templates, i18n-server-text, i18n-ui-overworld, i18n-ui-battle, i18n-ui-rest, i18n-descriptions, i18n-people-places. Its Database section -> gamedata-names.
- Pixel effects batches 0 to 8 -> pixel-grid, pixel-lit-scene, pixel-canvas-moves, pixel-battle-cues, pixel-battle-weather, pixel-auras, pixel-sky, pixel-board-lights, pixel-raid-sites.
- Dungeons batches 0 to 12 -> dungeon-questions, dungeon-runs, dungeon-floors, dungeon-walking, dungeon-elite-four, dungeon-frontier, dungeon-endless-stair, dungeon-companion-trail, dungeon-gimmicks, dungeon-victory-road, dungeon-hideouts, dungeon-lairs, dungeon-standings.
- Rebalance batches 0 to 5+ -> rebalance-experts, rebalance-simulator, rebalance-first-run, rebalance-move-audit, rebalance-bounds, rebalance-reworks.
- todo: Internationalization -> the i18n nodes.
- todo: Boot, measure first -> boot-measure. Stop deriving whole encounters -> boot-derive-shiny. Split the species record -> built (YAML folders per field). Other registries to YAML -> built, except true shadows -> boot-true-shadows-yaml. Load on demand -> boot-lazy-registries. Learn set loader -> boot-learnsets-loader. Abilities on demand -> boot-lazy-abilities. Load by id -> boot-load-by-id.
- todo: Game data schema, sync, no foreign keys -> gamedata-schema. Box and auction search -> gamedata-search-sql. Localized names -> gamedata-names. Data endpoint -> gamedata-endpoint.
- todo: Next up, Zeniths -> the zenith nodes. Jeweler, Archaeologist, adjacent chunk preload, Mini Boss ability and catch tags -> dropped: phased out.
- todo: Boxes, `box:` search -> boxes-search. Tags against boxes -> dropped with catch tags.
- todo: Incubators -> incubators. Garden -> garden. Pokéblocks and Poffins -> treats.
- todo: Remaining items, PP restoratives -> items-pp-restoratives. Charms -> items-charms. Room Service -> items-room-service. Balls, flutes and key items -> inbox: no order or design yet.
- todo: Engine gaps in Johto moves -> johto-move-gaps.
- todo: True species -> inbox: one line, no design.
- todo: Alola trainers, Mega sprites, Waiting for SpriteCollab -> inbox: blocked on art.
- todo: Forms waiting for art -> built for Galarian Zen Darmanitan (b3e73a4f7), Cramorant Gulping and Gorging, Morpeko Hangry, Calyrex Ice and Shadow Rider, Oinkologne's female and Three-Segment Dudunsparce (registered, waiting only for sheets). The rest -> inbox.
- todo: Ideas (open world gimmicks, seeing other players) -> inbox: not committed to.
- Added 2026-10-26, spawn radius, caps and roaming (after Minecraft and wAthena) -> spawn-life-design, spawn-lifetimes, spawn-radius, spawn-roaming.
- Added 2026-10-27, updating the dependencies -> deps-update. Migrating to Solid 2.0 -> solid-2 (outline, waits for Solid 2.0 stable and SolidStart support).

## Open questions

- Whether translations should wait for the last Zenith at all: only i18n-descriptions needs the Zeniths finished, so i18n-plumbing could start now.

## Gates

- spawn-life-design is gated: the user sets the radius, caps, lifetimes and roaming numbers.
- Every Zenith node is gated: the user approves each pokemon's proposal before data is written.
- dungeon-questions and rebalance-bounds are the user's decisions.
- Contracts stop for user review once frozen.
