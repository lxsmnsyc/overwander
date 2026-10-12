import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { asCatchSnapshot } from '../../src/auth/catch-snapshot';
import { dynamaxActsLeft } from '../../src/battle/mechanics/dynamax';
import type Unit from '../../src/battle/unit';
import registerGameData from '../../src/data';
import { Stats } from '../../src/data/constants/stats';
import { Species } from '../../src/data/ids/species';
import { EncounterType } from '../../src/overworld/encounter';
import {
  BOSS_ALLIANCE,
  PLAYER_ALLIANCE,
  createRaidBossTeam,
  keepsGigantamaxFactor,
} from '../../src/overworld/raid';
import { createRaidBattle } from '../../src/overworld/raid-battle';
import { BattleEvents } from '../../src/battle/events';
import { AttackPriority } from '../../src/core/event-emitter';
import { Moves } from '../../src/data/ids/moves';
import { getMoveData } from '../../src/data/moves';
import { G_MAX_MOVES } from '../../src/data/moves/gmax-moves';
import { TYPE_MAX_MOVES } from '../../src/data/moves/max-moves';

beforeAll(() => {
  registerGameData();
  // Starting a fight starts its frame clock, which a test drives by hand
  vi.stubGlobal('requestAnimationFrame', () => 0);
  vi.stubGlobal('cancelAnimationFrame', () => undefined);
});

afterAll(() => {
  vi.unstubAllGlobals();
});

/** The boss of a raid on this species, fielded and started */
function boss(species: Species, max: boolean): Unit {
  const built = createRaidBattle(`max-${species}-${max}`, [
    {
      player: '',
      alliance: BOSS_ALLIANCE,
      catches: createRaidBossTeam(species, 7, false, false, max),
    },
  ]);

  built.battle.initialize();
  built.battle.start();
  return [...(built.units.get(BOSS_ALLIANCE) ?? [])][0];
}

describe('Max Raids', () => {
  it('stages the boss Dynamaxed for the whole fight, at twice the HP', () => {
    const giant = boss(Species.Snorlax, true);
    const plain = boss(Species.Snorlax, false);

    expect(giant.dynamaxed).toBe(true);
    expect(dynamaxActsLeft(giant)).toBe(Infinity);
    expect(giant.checkStat(Stats.HP, 0)).toBe(plain.checkStat(Stats.HP, 0) * 2);
    expect(giant.health).toBe(giant.checkStat(Stats.HP, 0));
    expect(plain.dynamaxed).toBe(false);
  });

  it('Gigantamaxes a boss whose species can, and only that one', () => {
    const [charizard] = createRaidBossTeam(Species.Charizard, 7, false, false, true);
    const [salazzle] = createRaidBossTeam(Species.Salazzle, 7, false, false, true);
    const [lair] = createRaidBossTeam(Species.Charizard, 7, false, false, false);

    expect(charizard.gigantamax).toBe(true);
    expect(salazzle.gigantamax).toBeUndefined();
    expect(lair.gigantamax).toBeUndefined();
    expect(lair.dynamaxed).toBeUndefined();
    expect(boss(Species.Charizard, true).gigantamax).toBe(true);
  });

  it('keeps both marks through a stored snapshot', () => {
    const [stored] = createRaidBossTeam(Species.Charizard, 7, false, false, true);
    const read = asCatchSnapshot(JSON.parse(JSON.stringify(stored)));

    expect(read.dynamaxed).toBe(true);
    expect(read.gigantamax).toBe(true);
  });

  it('hands the Gigantamax Factor on only from a Gigantamax Max Raid', () => {
    expect(keepsGigantamaxFactor({ type: EncounterType.MaxRaid, species: Species.Charizard })).toBe(
      true,
    );
    expect(keepsGigantamaxFactor({ type: EncounterType.MaxRaid, species: Species.Salazzle })).toBe(
      false,
    );
    expect(
      keepsGigantamaxFactor({ type: EncounterType.TotemRaid, species: Species.Charizard }),
    ).toBe(false);
  });

  it('throws only Max Moves, and its G-Max Move for its own type', () => {
    const [giant] = createRaidBossTeam(Species.Charizard, 7, false, false, true);
    const [foe] = createRaidBossTeam(Species.Blastoise, 9, false, false, false);
    const built = createRaidBattle('max-moves', [
      { player: '', alliance: BOSS_ALLIANCE, catches: [giant] },
      {
        player: 'trainer',
        alliance: PLAYER_ALLIANCE,
        catches: [{ ...foe, caught: 'mine', abilities: [] }],
      },
    ]);
    const thrown: Moves[] = [];

    built.battle.initialize();
    built.battle.start();

    const giantUnit = [...(built.units.get(BOSS_ALLIANCE) ?? [])][0];

    built.battle.on(BattleEvents.UnitTriggerMove, AttackPriority.Post, (event) => {
      if (event.source === giantUnit && !event.disabled) {
        thrown.push(event.move);
      }
    });
    // Stepped: a cast is set up on one tick and runs down over the ones after it
    for (let step = 0; step < 120; step++) {
      built.battle.tick(500);
    }

    const giants = new Set<Moves>([Moves.MaxGuard, ...TYPE_MAX_MOVES.values(), ...G_MAX_MOVES]);

    expect(thrown.length).toBeGreaterThan(0);
    for (const move of thrown) {
      expect(giants.has(move), getMoveData(move).name).toBe(true);
      // Charizard's Fire Max Move is its own
      expect(move).not.toBe(Moves.MaxFlare);
    }
  });
});
