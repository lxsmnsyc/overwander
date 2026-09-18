import { registerMoves } from '../../../src/data/moves';
import { describe, expect, it } from 'vitest';
import Abilities from '../../../src/data/ids/abilities';
import registerAbilities, { getAbilityData } from '../../../src/data/abilities';
import registerBiomeSpawns from '../../../src/data/biome';
import registerItems from '../../../src/data/items';
import { registerSpecies } from '../../../src/data/species';
import {
  BUDDY_ABILITIES,
  KINSHIP_CATCH_BOOST,
  LURE_SPAWN_BONUS,
} from '../../../src/overworld/abilities/__create';
import {
  COMPOUND_EYES_HELD_BOOST,
  CUTE_CHARM_CHANCE,
  GLUTTONY_FEAST,
  HONEY_STEP_INTERVAL,
  ILLUMINATE_LAMP_CELLS,
  KEEN_CRITICAL_BOOST,
  LEVEL_CEILING_LIFT,
  LEVEL_FLOOR_LIFT,
  PICKUP_STEP_INTERVAL,
  PURIFIED_SHADOW_RELIEF,
  SNIPER_AIMS,
  STENCH_QUIET,
  SYNCHRONIZE_CHANCE,
} from '../../../src/overworld/abilities/gen-1';

// Spawn rolls read the species registry and the biome spawn pools;
// the berry patch reads the item registry to name what it grew, and
// the machines that registry generates read the move data
registerMoves();
registerSpecies();
registerItems();
registerAbilities();
registerBiomeSpawns();

describe('buddy copy', () => {
  /**
   * The figure each buddy line prints, against the constant the
   * overworld actually reads. The description is written by hand, so
   * this is what stops it saying one thing while the field does
   * another
   */
  const FIGURES: [Abilities, string, number][] = [
    [Abilities.ArenaTrap, '3 more', LURE_SPAWN_BONUS],
    [Abilities.Illuminate, '3 more', LURE_SPAWN_BONUS],
    [Abilities.NoGuard, '3 more', LURE_SPAWN_BONUS],
    [Abilities.Illuminate, 'lit 5 cells out', ILLUMINATE_LAMP_CELLS],
    [Abilities.Stench, '2 fewer', STENCH_QUIET],
    [Abilities.CompoundEyes, '2.5x', COMPOUND_EYES_HELD_BOOST],
    [Abilities.Pickup, 'every 512 steps', PICKUP_STEP_INTERVAL],
    [Abilities.HoneyGather, 'every 384 steps', HONEY_STEP_INTERVAL],
    [Abilities.Gluttony, '1.5x as far', GLUTTONY_FEAST],
    [Abilities.SuperLuck, 'critical 2x as often', KEEN_CRITICAL_BOOST],
    [Abilities.Sniper, '2 chances', SNIPER_AIMS],
    [Abilities.KeenEye, 'lifts by 3', LEVEL_FLOOR_LIFT],
    [Abilities.Intimidate, 'lifts by 3', LEVEL_FLOOR_LIFT],
    [Abilities.Hustle, 'lifts by 3', LEVEL_CEILING_LIFT],
    [Abilities.Pressure, 'lifts by 3', LEVEL_CEILING_LIFT],
    [Abilities.VitalSpirit, 'lifts by 3', LEVEL_CEILING_LIFT],
    [Abilities.Purified, '1.5x', PURIFIED_SHADOW_RELIEF],
    [Abilities.FlashFire, '1.5x', KINSHIP_CATCH_BOOST],
    [Abilities.SapSipper, '1.5x', KINSHIP_CATCH_BOOST],
    [Abilities.Synchronize, '1/2 of wild', SYNCHRONIZE_CHANCE],
    [Abilities.CuteCharm, '2/3 of wild', CUTE_CHARM_CHANCE],
  ];

  it('prints the figure the field actually uses', () => {
    for (const [ability, said, number] of FIGURES) {
      const data = getAbilityData(ability);
      // The figure in the line, pulled back out of it
      const printed = /(\d+(?:\.\d+)?)(?:\/(\d+))?/.exec(said);

      expect(printed, said).not.toBeNull();

      const value =
        printed?.[2] == null ? Number(printed?.[1]) : Number(printed[1]) / Number(printed[2]);

      expect(value, `${data.name}: ${said}`).toBe(number);
      expect(data.description, data.name).toContain(said);
    }
  });

  it('says what every buddy ability does out of a fight', () => {
    // Every ability the overworld listens for has to say so, or a
    // player choosing who to walk with is reading a battle line about
    // a field effect
    for (const ability of BUDDY_ABILITIES) {
      const data = getAbilityData(ability);

      expect(data.description, `${data.name} says nothing about being a buddy`).toMatch(
        /As a buddy,|while it is the buddy/,
      );
    }
  });

  it('tells Keen Eye and Illuminate apart', () => {
    // The two carry the same battle line and do completely different
    // things beside a player, which is the case that made this worth
    // writing down at all
    expect(getAbilityData(Abilities.KeenEye).description).not.toBe(
      getAbilityData(Abilities.Illuminate).description,
    );
  });
});
