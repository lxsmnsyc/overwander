import registerLearnSets from '../../src/data/species/learnsets';
import { describe, expect, it } from 'vitest';
import registerAbilities from '../../src/data/abilities/register';
import registerBiomeSpawns from '../../src/data/biome';
import registerItems from '../../src/data/items/register';
import Abilities from '../../src/data/ids/abilities';
import { Items } from '../../src/data/ids/items';
import Natures from '../../src/data/ids/natures';
import { Genders, Species } from '../../src/data/ids/species';
import registerMoves from '../../src/data/moves/register';
import { getSpeciesData, registerSpecies } from '../../src/data/species';
import { EGG_HATCH_STEPS } from '../../src/model/egg';
import type { Buddy } from '../../src/overworld/core';
import { EXP_CHARM_BONUS, OVAL_CHARM_FACTOR } from '../../src/overworld/items/key-items';
import createOverworld from '../../src/overworld/setup';

registerMoves();
registerSpecies();
registerLearnSets();
registerItems();
registerAbilities();
registerBiomeSpawns();

function buddyWith(items: Items[], abilities: Abilities[] = []): Buddy {
  return {
    species: Species.Bulbasaur,
    shiny: false,
    abilities,
    items,
    nature: Natures.Adamant,
    gender: Genders.Male,
  };
}

describe('Exp Charm', () => {
  it('pays one candy of the caught family on every catch, and none to the buddy', () => {
    const buddyFamily = getSpeciesData(Species.Bulbasaur).family;
    const caughtFamily = getSpeciesData(Species.Rattata).family;
    const charmed = createOverworld('player-uid', buddyWith([Items.ExpCharm]));

    expect(buddyFamily).not.toBe(caughtFamily);

    for (let index = 0; index < 40; index++) {
      const bonus = charmed.checkCatchCandy(`spawn#${index}`, caughtFamily);

      expect([...bonus]).toStrictEqual([[caughtFamily, EXP_CHARM_BONUS]]);
    }
  });

  it('pays nothing when the buddy does not carry it', () => {
    const plain = createOverworld('player-uid', buddyWith([]));

    expect(plain.checkCatchCandy('spawn#0', getSpeciesData(Species.Rattata).family).size).toBe(0);
  });
});

describe('Oval Charm', () => {
  it('halves the steps of an egg picked up while the buddy carries it', () => {
    const charmed = createOverworld('player-uid', buddyWith([Items.OvalCharm]));

    expect(charmed.checkEggSteps('egg', EGG_HATCH_STEPS)).toBe(EGG_HATCH_STEPS * OVAL_CHARM_FACTOR);
    expect(charmed.checkEggSteps('egg', 1)).toBe(1);
    expect(createOverworld('player-uid', buddyWith([])).checkEggSteps('egg', EGG_HATCH_STEPS)).toBe(
      EGG_HATCH_STEPS,
    );
  });

  it('halves them once, not twice, on a Flame Body buddy', () => {
    const both = createOverworld('player-uid', buddyWith([Items.OvalCharm], [Abilities.FlameBody]));

    expect(both.checkEggSteps('egg', EGG_HATCH_STEPS)).toBe(EGG_HATCH_STEPS / 2);
  });
});
