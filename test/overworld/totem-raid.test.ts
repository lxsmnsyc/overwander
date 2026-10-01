import { beforeAll, describe, expect, it } from 'vitest';
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

  it('calls its ally at half HP, once, and the ally flees when it falls', () => {
    const { totem, player, battle } = totemRaid(Species.Salazzle);
    const hit = { type: EffectType.Move, move: Moves.Tackle, unit: player } as const;
    const max = totem.checkStat(Stats.HP, 0);

    player.damage(hit, totem, Math.ceil(max / 2) + 1, 0);

    const called = [...totem.team.units].filter((unit) => unit !== totem);

    expect(called).toHaveLength(1);
    expect(called[0].species).toBe(Species.Salandit);
    // An ordinary pokemon, not a second boss
    expect(called[0].hasAbility(Abilities.Boss)).toBe(false);

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
