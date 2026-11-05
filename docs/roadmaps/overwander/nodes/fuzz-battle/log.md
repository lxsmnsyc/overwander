# Log: fuzz-battle

## Findings, in the order they surfaced

- A whole headless battle takes 0.06 to 0.3 s, not minutes (12 sample fights, sizes 1 and 3, levels 5 to 100). A watched fight, with the AI probed every 30 ticks, takes about 0.1 s. So 500 runs is cheap.
- `console.log` from a spec does not reach the terminal under the vite config; timings were written to stderr.
- With the central `triggerItem` or `triggerAbility` estimating guard removed (`src/battle/unit.ts`), purity still held at 40 runs: the listeners behind those cues guard themselves, so the cue alone changes no state the snapshot reads.
- With the Three Heads guard removed (`src/battle/abilities/signature/gen-5/axew-to-deino.ts`), purity held at 500 runs. Two causes: the rolled parties never carried a signature ability (they are granted, not rolled, and `getBestParty` picks from the rolled pool), and Three Heads only bites when the foe has a second unit standing.
- A pinned Hydreigon with Three Heads against two foes breaks purity on every probe, so the snapshot and probe work.
- Each `fc.assert` drew its own seed, so the properties that share fights through the cache never shared one. One seed per run now feeds every property.

## Decisions

- `SimOptions.signatures` adds each species' signature in front of its rolled abilities, and the arbitraries turn it on or off. Every one of the 693 rollable species has a signature.
- Properties read one watched fight from a cache keyed by the input, so a fight is played once for the four PvP rules. Determinism plays its own fights, unwatched, twice: the purity probe calls the AI, which draws from the battle's RNG, so a watched fight is not the same fight as a plain one.
- Raids get a quarter of the run count: a raid boss lasts the whole time limit.
- The boss cap check mirrors the boss's own allowance (cap 200, refilling at 50 a second) with one frame of slack, read at `AttackPriority.Cleanup` so it sees the final value.
- The item rule checks two things: the held set changes only through `UnitAddItem` and `UnitRemoveItem`, and a foe takes an item for good only when it is a consumable (the rule in `5b0d2841d`).
- Reverting one signature's guard (Three Heads) was the wrong acceptance check: it tests how often the generator draws Hydreigon, not the bug class. The class is an estimate that is not marked as one.
- With `Simulated` removed from `estimateDamage`, the snapshot-only purity property still passed, while the sweep in `test/battle/ai/estimates.test.ts` failed at once. The sweep fails on any non-question event and any RNG draw during a guess; the property now does the same, and then fails on the first fight with the flag removed.
- The new detector found two things on a clean engine: `CheckUnitRecoil` had an empty `id`, and `stealableItem` drew from the RNG inside Fling and Poltergeist questions.
- The damage property first failed on type Z-Moves, Max Moves, Present and Frenzy Burst, none of which can be tried bare. They are listed as untried with reasons.
