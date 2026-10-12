import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { EffectType } from '../../src/battle/events';
import registerGameData from '../../src/data';
import { Stages, Stats } from '../../src/data/constants/stats';
import Abilities from '../../src/data/ids/abilities';
import { Moves } from '../../src/data/ids/moves';
import { Species } from '../../src/data/ids/species';
import { BOSS_ALLIANCE, PLAYER_ALLIANCE, createRaidBossTeam } from '../../src/overworld/raid';
import { type RaidBattle, createRaidBattle } from '../../src/overworld/raid-battle';
import type Unit from '../../src/battle/unit';

beforeAll(() => {
  registerGameData();
  // Starting a fight starts its frame clock, which a test drives by hand
  vi.stubGlobal('requestAnimationFrame', () => 0);
  vi.stubGlobal('cancelAnimationFrame', () => undefined);
});

afterAll(() => {
  vi.unstubAllGlobals();
});

interface TotemRaid extends RaidBattle {
  totem: Unit;
  player: Unit;
}

function totemRaid(species: Species): TotemRaid {
  const boss = createRaidBossTeam(species, 0x12345678, false, true);
  const built = createRaidBattle('totem-seed', [
    { player: '', alliance: BOSS_ALLIANCE, catches: boss },
    {
      player: 'trainer',
      alliance: PLAYER_ALLIANCE,
      catches: [{ ...boss[0], caught: 'mine', abilities: [], called: undefined }],
    },
  ]);

  built.battle.initialize();
  // The units walk on, and the aura goes up, as the fight starts
  built.battle.start();

  const totem = [...(built.units.get(BOSS_ALLIANCE) ?? [])][0];
  const player = [...(built.units.get(PLAYER_ALLIANCE) ?? [])][0];

  return { ...built, totem, player };
}

describe('Totem raids', () => {
  it('stages the Totem with its ally waiting off the field', () => {
    const { totem } = totemRaid(Species.Salazzle);

    expect(totem.hasAbility(Abilities.Totem)).toBe(true);
    // The ally is built but nowhere on the boss side yet
    expect(totem.team.units.size).toBe(1);
  });

  it('starts the fight wrapped in its aura', () => {
    const { totem } = totemRaid(Species.Lurantis);

    expect(totem.stages[Stages.Speed]).toBe(2);
  });

  it('gives the ally 50x its HP and 1.5x every other stat', () => {
    const ally = createRaidBossTeam(Species.Salazzle, 0x12345678, false, true)[1];

    // The same pokemon fielded with and without the mark
    function fielded(abilities: Abilities[]): Unit {
      const { battle, units } = createRaidBattle('ally-seed', [
        {
          player: '',
          alliance: BOSS_ALLIANCE,
          catches: [{ ...ally, abilities, called: undefined }],
        },
      ]);

      battle.initialize();
      battle.start();
      return [...(units.get(BOSS_ALLIANCE) ?? [])][0];
    }

    const plain = fielded([]);
    const marked = fielded([Abilities.TotemAlly]);

    expect(marked.checkStat(Stats.HP, 0)).toBe(plain.checkStat(Stats.HP, 0) * 50);
    expect(marked.checkStat(Stats.Attack, 0)).toBeCloseTo(plain.checkStat(Stats.Attack, 0) * 1.5);
  });

  it('calls its ally at half HP, once, and the ally flees when it falls', () => {
    const { totem, player, battle } = totemRaid(Species.Salazzle);
    const hit = { type: EffectType.Move, move: Moves.Tackle, unit: player } as const;
    const max = totem.checkStat(Stats.HP, 0);

    player.damage(hit, totem, Math.ceil(max / 2) + 1, 0);

    const called = [...totem.team.units].filter((unit) => unit !== totem);

    expect(called).toHaveLength(1);
    expect(called[0].species).toBe(Species.Salandit);
    // Not a second boss, but raid-sized all the same
    expect(called[0].hasAbility(Abilities.Boss)).toBe(false);
    expect(called[0].hasAbility(Abilities.TotemAlly)).toBe(true);
    expect(called[0].health).toBe(called[0].checkStat(Stats.HP, 0));

    // A second blow under half calls nobody else
    player.damage(hit, totem, 10, 0);
    expect(totem.team.units.size).toBe(2);

    player.damage(hit, totem, totem.health, 0);
    expect(totem.alive).toBe(false);
    expect(totem.team.units.has(called[0])).toBe(false);

    // With the Totem down and its ally gone, the party takes the raid
    battle.tick(5000);
    expect(battle.winner?.boss).toBe(false);
  });
});
