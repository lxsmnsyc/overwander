---
name: ability-pools
description: >
  An ability pool is built by walking **up** the evolution chain, never
  across the family and never forwards. An ability exclusive to an
  evolution is out of reach of every stage below it. Applies whenever
  writing or reviewing code that asks what abilities a species can
  have, and whenever filling in a species' ability data.
---

A pokemon's ability pool is what it and its **pre-evolutions** can be born with. Nothing else.

The rule that decides the shape is one-directional: **an ability exclusive to a stage is out of reach of every stage below it.** A Magikarp cannot reach Intimidate because Gyarados has it. The reverse is fine and is how the mainline works anyway: an evolution keeps what its line was born with, so Charizard reaches Blaze and Solar Power through Charmander.

## The two helpers

[`getSpeciesAbilities`](../../../src/data/species/__create.ts) walks `evolvesFrom` upwards and unions each stage's `abilities` and `hiddenAbilities`. It answers both what this stage could have been born with and what it could ever come to have, and it is what anything offering a pokemon a new ability must ask.

[`getSpeciesAbilityPools`](../../../src/data/species/__create.ts) is the same walk split into a regular list and a hidden list, since a **birth roll** treats the two differently. It is what [`encounter.ts`](../../../src/overworld/encounter.ts) and [`breeding.ts`](../../../src/overworld/breeding.ts) read. How it splits them is the next section.

There is deliberately no helper that unions a whole `family`. One existed briefly and was wrong: it let a Magikarp reach a Gyarados ability. If a new pool is needed, walk upwards.

## What a stage inherits is rare

**An ability exclusive to a pre-evolution is hidden on the stages above it.** Only a species' own `abilities` are ordinary for that species; anything it reaches only through a stage below is rolled out of the narrow hidden band instead. A Persian is born Limber or Technician, and a Persian carrying a Meowth's Pickup is the uncommon one. So is a Gyarados with Magikarp's Swift Swim, a Butterfree with Caterpie's Shield Dust, and a Vaporeon with Eevee's Adaptability.

A pre-evolution's hidden ability was already rare and stays rare. Nothing is written down for this: it falls out of the pools walk, so a line's data says what each stage has and the split follows.

## Mega abilities

A species carries no record of what its Mega form's ability would be. The `latent` field that held them is gone, so a Mega ability is simply not in the data until Megas themselves are.

## Filling it in

Check the ability against PokeAPI rather than writing it from recall.

**A species that is a final evolution in this registry is not necessarily terminal in canon.** Kanto is all that is registered, so Golbat, Onix, Chansey, Scyther, Porygon, Tangela, Electabuzz, Magmar, Rhydon, Magneton, Lickitung, Seadra, Primeape, Farfetch'd and Mr. Mime all look final here and gain an evolution in a later generation. Giving one of them an ability today creates a violation of this rule the day that evolution lands, so leave them alone.

**Regional forms are not a source.** An Alolan Marowak's Cursed Body is out of reach of a Kantonian Marowak, and the same goes for every Alolan, Galarian, Hisuian and Paldean form. They are a different pokemon wearing the same name, not a stage of this one.

## Inventing a filler ability

**A newly added final evolution that cannot reach four abilities gets filler suggestions before it is written down:** as many as it is short, plus one alternative to choose from. Count what it reaches by walking up the chain, with Megas and alternate forms left out of the count.

A species short of four abilities can be given one the mainline never gave it. It goes in `hiddenAbilities`, never in `abilities`: an invented ability should be rare to hatch, and the hidden band is what makes it rare. The band does not widen with the list, so a species with three hidden abilities rolls hidden as often as one with a single one and splits the band between them.

Two slots are already spoken for and must not be spent.

**What the species' own Mega or another of its forms carries.** Mega Charizard X's Tough Claws belongs to Charizard the day Megas land, so do not hand Charizard some other ability into that slot and do not hand it Tough Claws early either. An Alolan or Galarian form's ability is not a suggestion either, for the separate reason that it belongs to a different pokemon.

**What a future baby pre-evolution carries.** A baby stage added in a later generation sits below the species and its abilities walk straight up. Tyrogue brings Guts, Steadfast and Vital Spirit to both Hitmons, Smoochum brings Hydration to Jynx, Munchlax brings Pickup to Snorlax, Happiny brings Friend Guard to Chansey, Mime Jr. brings its set to Mr. Mime, Cleffa and Igglybuff bring Friend Guard to their lines. Those species fill themselves up and need nothing invented.
