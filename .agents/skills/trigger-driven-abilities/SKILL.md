---
name: trigger-driven-abilities
description: >
  Battle ability implementation pattern: when an ability's effect does
  not override or mutate the detection event's properties, split it
  into a detection listener that fires triggerAbility and an effect
  listener on UnitTriggerAbility. Applies whenever writing or
  refactoring abilities in src/battle/abilities.
---

When implementing an ability, separate _detection_ from _effect_ whenever the effect stands on its own — i.e. it does not read or mutate the event that detected the activation.

## The pattern

```ts
createAbility(
  Abilities.Example,
  (battle) =>
    new MergedAbilityLifecycle([
      // Detection: guards live here; fire the trigger and nothing else
      battle.on(BattleEvents.SomeEvent, EventPriority.Post, (event) => {
        if (/* activation conditions */) {
          event.source.triggerAbility(Abilities.Example);
        }
      }),
      // Effect: rides the trigger at Exact priority
      battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
        if (event.ability === Abilities.Example) {
          // apply the effect to event.source (or closure state)
        }
      }),
    ]),
),
```

## Rules

- Effect listeners on `UnitTriggerAbility` use `EventPriority.Exact` — the trigger's canonical resolution. Post stays free for observers (visual layer, tests).
- The effect may only use `event.source`, `event.ability`, and the ability's closure state (e.g. Flash Fire's `activated` set). Chance rolls and condition guards belong in detection.
- `Unit.triggerAbility` already checks the unit has the ability, so the effect listener needs only the ability-id match.
- Self-boosts guard against re-triggering naturally when the detection condition can't match the effect (e.g. Defiant detects negative stage deltas; its own boost is positive).

## When to stay inline

- The effect **mutates the detection event** (Shield Dust disabling the attack effect, Run Away setting escape success, Inner Focus vetoing a stage drop, Arena Trap blocking escape).
- The effect **requires context the trigger event cannot carry** (Static/Poison Point/Cute Charm/Effect Spore/Stench afflict the attacker; Pickup needs the item id; Synchronize reflects onto the inflicter). Do not stash such context in closure state to force the pattern — keep the effect inline.
- One ability id covers **multiple distinct effect contexts** (Dry Skin's water absorb vs rain heal vs sun chip) — a single trigger listener cannot tell which fired.

In those cases, fire `triggerAbility` purely as the visual cue at the point of effect, and keep the cue off speculative check events (use real-attempt events like `UnitTriggerMoveFailed` / `UnitAddStatusFailed`).
