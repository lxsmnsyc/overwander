---
id: boot-lazy-abilities
title: Set abilities up on demand
status: active
priority: could
type: refactor
outline: false
milestone: next
size: L
spike: false
verify: pnpm exec vitest run test/battle
gate: false
owns:
  - src/core/event-emitter.ts
  - src/core/event-engine.ts
  - src/battle/abilities/__create/create.ts
  - src/battle/abilities/index.ts
  - test/core/event-emitter.test.ts
  - test/battle/abilities-lazy.test.ts
shared:
  - src/battle/setup.ts
  - test/battle/harness.ts
reserves: []
provides: []
depends_on: []
---

# Set abilities up on demand

## Goal

An ability's listeners attach when a unit on the field first gains it, not when the battle is built. A late attach must still answer in the same order as an eager one, so every listener carries a rank reserved up front.

## Context

- Source: docs/todo.md (removed, see git history): Platform, Deferring data and runtime at boot.
- Today `createBattle` (`src/battle/setup.ts`) runs `setupAbilities` (`src/battle/abilities/index.ts`), which calls every `createAbility` starter once per battle. Each starter runs its `setup(battle)`, so all of the game's abilities (about 270 across `gen-*.ts`, `special/`, `signature/`) attach their `battle.on` listeners, whether or not a unit holds them. `createAbility` (`src/battle/abilities/__create/create.ts:55`) only starts and stops the lifecycle on `UnitAddAbility` and friends.
- Order is the insertion order of a `Set` per priority in `EventEmitter.on` (`src/core/event-emitter.ts:58`). Abilities attach after moves and status and before items (`setup.ts`), so a late attach must land in that same slot. That is why ranks are reserved up front.
- Read the `trigger-driven-abilities` skill in `.agents/skills`, and `src/battle/CLAUDE.md`.
- This saves per-battle setup time and memory, not download size, so it does not move the `boot-measure` numbers. Measure battle build time instead.

## Steps

- [ ] Measure first. Time `createBattle` (and the test harness's) for a 1v1 and for a raid roster of 49 units, before any change, in a throwaway vitest bench. Put the numbers in `log.md`. If the ability setup is under about 5 ms for a 1v1, write that in `outcome.md`, change nothing and stop: the node is not worth its risk.
- [ ] Give `EventEmitter` ranked listeners: a listener may carry a rank, and the queue per priority stays sorted by it (ties keep insertion order). Listeners without a rank keep today's behaviour.
- [ ] `setupAbilities` reserves one rank block per ability in today's order (gen-1 first, signature last) and attaches nothing. `createAbility` attaches the setup's listeners on the first `UnitAddAbility` or `UnitEnableAbility` for that ability in this battle, with the reserved ranks, then starts the lifecycle as now.
- [ ] Cover abilities that hold state or register things inside `setup` (closure sets, `registerWeatherWant`-style calls, listeners on `battle` that are not tied to a holder). Make each either safe to attach late or attach eagerly through an explicit `eager` flag on `createAbility`.
- [ ] Remeasure and record before and after.

## Acceptance

- [ ] The whole `test/battle` suite passes unchanged, so ordering is preserved: `pnpm exec vitest run test/battle`.
- [ ] A new test builds one battle twice, abilities eager and lazy, with units gaining abilities in a different order than the rank order, and shows the same event log from the same seed.
- [ ] A test shows a battle with no ability holder attaches no ability listener (count the emitter queues).
- [ ] `outcome.md` has the before and after build times.
- [ ] Fast check passes: `pnpm typecheck && pnpm exec oxlint src test` (read the exit code), then `pnpm exec vitest run test/battle test/core`.

## Sizing

L: blast radius high (the event emitter and every ability's start path), uncertainty medium (late attach order and abilities with setup side effects), verifiability low risk (the battle suite is a strong oracle).

## Notes for the worker

- Abilities also start without a holder at battle build in places: a unit built with an ability fires `UnitAddAbility` at setup, check that the harness `createUnit` path and `setup.ts` order still emit it before the first tick.
- An event emitted while a late attach happens must not skip the new listener or run it twice. `emit` copies the queue and the listener set before iterating, so decide what a mid-emit attach does and test it.
- Do not change the order the gen files list their abilities in. The rank is that order.
