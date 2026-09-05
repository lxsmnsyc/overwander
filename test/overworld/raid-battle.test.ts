import { describe, expect, it } from 'vitest';
import registerGameData from '../../src/data';
import { BASE_FRIENDSHIP } from '../../src/data/constants/friendship';
import { PERFECT_IVS, Stats } from '../../src/data/constants/stats';
import { defaultSlots } from '../../src/data/constants/slots';
import { Species } from '../../src/data/ids/species';
import type { CatchSnapshot } from '../../src/auth/catch-snapshot';
import type { TeamSnapshotRecord } from '../../src/auth/teams';
import { getMaxHealth } from '../../src/auth/health';
import { BattleModes } from '../../src/battle/core';
import { EventPriority } from '../../src/core/event-emitter';
import { BattleEvents } from '../../src/battle/events';
import createBattle from '../../src/battle/setup';
import type Unit from '../../src/battle/unit';
import { fieldTeams } from '../../src/overworld/raid-battle';
import { mythicalRaidId, mythicalRelicOf } from '../../src/auth/raid-record';
import { Items } from '../../src/data/ids/items';

registerGameData();

const LEVEL = 50;

function snapshot(species: Species): CatchSnapshot {
  const effortValues = {
    [Stats.HP]: 0,
    [Stats.Attack]: 0,
    [Stats.Defense]: 0,
    [Stats.SpecialAttack]: 0,
    [Stats.SpecialDefense]: 0,
    [Stats.Speed]: 0,
  };

  return {
    caught: '',
    species,
    level: LEVEL,
    ivs: PERFECT_IVS,
    effortValues,
    // A neutral nature, so the species' own speed is the whole answer
    nature: 0,
    gender: 0,
    height: 1,
    weight: 1,
    shiny: false,
    shadow: false,
    moves: [],
    movePoints: {},
    abilities: [],
    items: [],
    slots: defaultSlots(),
    health: getMaxHealth({ species, level: LEVEL, ivs: PERFECT_IVS, effortValues }),
    friendship: BASE_FRIENDSHIP,
    statuses: 0,
  };
}

/**
 * The species each party is dealt, slowest written first so the order
 * asserted below can only come from the sort
 */
const ONE = [Species.Slowpoke, Species.Rattata, Species.Jolteon];
const TWO = [Species.Snorlax, Species.Pidgey, Species.Electrode];

function stage(mode: BattleModes): Species[] {
  const teams: TeamSnapshotRecord[] = [
    { player: 'one', alliance: 0, catches: ONE.map(snapshot) },
    { player: 'two', alliance: 1, catches: TWO.map(snapshot) },
  ];
  const battle = createBattle('entry-order', { mode });
  const entered: Unit[] = [];

  battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
    entered.push(event.source);
  });
  fieldTeams(battle, teams, null);

  return entered.map((unit) => unit.species);
}

describe('who walks on first', () => {
  it('orders a raid party by speed, one party at a time', () => {
    // Each party arrives on its own: whose Jolteon is quickest says
    // nothing about who should act ahead of another player
    expect(stage(BattleModes.Raid)).toEqual([
      Species.Jolteon,
      Species.Rattata,
      Species.Slowpoke,
      Species.Electrode,
      Species.Pidgey,
      Species.Snorlax,
    ]);
  });

  it('orders a fight between trainers as one field', () => {
    // Everybody stands on the same field, so the whole of it is
    // ordered together and the two sides interleave
    expect(stage(BattleModes.Npc)).toEqual([
      Species.Electrode,
      Species.Jolteon,
      Species.Rattata,
      Species.Pidgey,
      Species.Snorlax,
      Species.Slowpoke,
    ]);
    expect(stage(BattleModes.PvP)).toEqual(stage(BattleModes.Npc));
  });

  it('hands the caller its parties in the order they were stored', () => {
    // The sort decides who acts first and nothing else: a report
    // still reads the party the way the record wrote it
    const battle = createBattle('entry-order', { mode: BattleModes.Raid });
    const fielded = fieldTeams(
      battle,
      [{ player: 'one', alliance: 0, catches: ONE.map(snapshot) }],
      null,
    );

    expect(fielded.units.get(0)?.map((unit) => unit.species)).toEqual(ONE);
  });
});

describe('mythical lobby ids', () => {
  it('reads back the relic that opened one', () => {
    const id = mythicalRaidId(1_700_000_000_000, Items.GSBall, 'player-1', 60);

    expect(mythicalRelicOf(id)).toBe(Items.GSBall);
  });

  it('names one lobby for a relic and a window, wherever it was spent', () => {
    // The chunk is not in it on purpose: a relic pressed a chunk over
    // opens the lobby it already has rather than a second one
    expect(mythicalRaidId(1_700_000_000_000, Items.OldSeaMap, 'player-1', 60)).toBe(
      mythicalRaidId(1_700_000_000_000, Items.OldSeaMap, 'player-1', 60),
    );
    expect(mythicalRaidId(1_700_000_000_000, Items.OldSeaMap, 'player-1', 60)).not.toBe(
      mythicalRaidId(1_700_010_800_000, Items.OldSeaMap, 'player-1', 60),
    );
  });

  it('says nothing for a lobby no relic opened', () => {
    expect(mythicalRelicOf('seed@1700000000000$legendary42')).toBeNull();
  });
});
