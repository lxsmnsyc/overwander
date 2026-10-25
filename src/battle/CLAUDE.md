# Battle engine

Real time, not turns. A mainline turn is 2 seconds, written `turns(n)` from `src/battle/turn.ts` rather than as milliseconds. Per-turn residuals have no clock to hang on: they are paid when a unit begins casting or channelling, via `onUnitActs` (`src/battle/acts.ts`).

Everything is an event on one bus ([src/battle/events/index.ts](events/index.ts)). `Check*` events are questions whose answer is a field the listeners mutate (`power`, `immune`, `priority`, `success`); `Unit*` events are things that happened. Listeners pick `EventPriority.Pre | Exact | Post` (or `AttackPriority`), where `Exact` is the mechanic's own answer and `Post` is everyone modifying it.

Effects register themselves and nothing else names them: no mechanic mentions an ability by id. An ability is `createAbility(id, setup)` from [src/battle/abilities/\_\_create/](abilities/__create/index.ts), which starts its listeners only while some unit on the field holds it. Abilities that share one behaviour go through a `createXAbility` meta factory in that folder rather than a local helper. A visual cue is `unit.triggerAbility(id)`, and the effect usually rides the resulting `UnitTriggerAbility` at `Exact`; a cue fires once per matching unit. Reuse a move rather than reimplementing its machinery where one exists (Drought casts Sunny Day; Cursed Body casts Disable).

[src/battle/setup.ts](setup.ts) wires a battle: mechanics first, then moves, statuses, abilities, items, then the AI. Tests build one through `test/battle/harness.ts` (`createBattle`, `createUnit`, `pinRandom`) and drive time with `battle.tick(ms)`.
