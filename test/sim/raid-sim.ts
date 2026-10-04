import { readFileSync } from 'node:fs';
import type { CatchSnapshot } from '../../src/auth/catch-snapshot';
import { getMaxHealth } from '../../src/auth/health';
import type { TeamSnapshotRecord } from '../../src/auth/teams';
import type Battle from '../../src/battle/core';
import { BattleModes } from '../../src/battle/core';
import { BattleEvents, type EffectCause, EffectType } from '../../src/battle/events';
import createBattle from '../../src/battle/setup';
import { AttackPriority, EventPriority } from '../../src/core/event-emitter';
import { UNLIMITED_BATTLE_LIMITS } from '../../src/data/constants/battle-limits';
import { BASE_FRIENDSHIP } from '../../src/data/constants/friendship';
import { countAbilitySlots, packSlots } from '../../src/data/constants/slots';
import { PERFECT_IVS, Stats } from '../../src/data/constants/stats';
import { getAbilityData, getRegisteredAbilities } from '../../src/data/abilities';
import type Abilities from '../../src/data/ids/abilities';
import { DamageFlags } from '../../src/data/ids/moves';
import { ItemTypes, type Items } from '../../src/data/ids/items';
import type { Moves } from '../../src/data/ids/moves';
import Natures from '../../src/data/ids/natures';
import type { Species } from '../../src/data/ids/species';
import { getItemData, listItemsByType } from '../../src/data/items/__create';
import { getMoveData, getRegisteredMoves } from '../../src/data/moves';
import { getRegisteredSpecies, getSpeciesData } from '../../src/data/species';
import { deriveGender, deriveSize } from '../../src/overworld/encounter';
import { BOSS_ALLIANCE, PLAYER_ALLIANCE, createRaidBossSnapshot } from '../../src/overworld/raid';
import { fieldTeams } from '../../src/overworld/raid-battle';

/** The server calls an unsettled raid lost after this long */
export const RAID_SIM_LIMIT = 10 * 60 * 1000;

const FRAME = 1000 / 60;

const NATURES: Partial<Record<string, Natures>> = {
  Adamant: Natures.Adamant,
  Bold: Natures.Bold,
  Calm: Natures.Calm,
  Modest: Natures.Modest,
  Timid: Natures.Timid,
  Jolly: Natures.Jolly,
  Impish: Natures.Impish,
  Careful: Natures.Careful,
  Sassy: Natures.Sassy,
  Relaxed: Natures.Relaxed,
  Quiet: Natures.Quiet,
  Brave: Natures.Brave,
};

const STAT_NAMES: Partial<Record<string, Stats>> = {
  HP: Stats.HP,
  Attack: Stats.Attack,
  Defense: Stats.Defense,
  'Special Attack': Stats.SpecialAttack,
  'Special Defense': Stats.SpecialDefense,
  Speed: Stats.Speed,
};

function byName<T>(ids: Iterable<T>, name: (id: T) => string): Map<string, T> {
  const found = new Map<string, T>();

  for (const id of ids) {
    found.set(name(id).toLowerCase(), id);
  }
  return found;
}

const ITEM_TYPES = [
  ItemTypes.Medicine,
  ItemTypes.PokeBall,
  ItemTypes.Berry,
  ItemTypes.Held,
  ItemTypes.Machine,
  ItemTypes.KeyItem,
  ItemTypes.Evolution,
  ItemTypes.Valuable,
  ItemTypes.Training,
  ItemTypes.Fossil,
];

function itemIds(): Items[] {
  const ids: Items[] = [];

  for (const type of ITEM_TYPES) {
    ids.push(...listItemsByType(type));
  }
  return ids;
}

export interface SheetMember {
  name: string;
  species: Species;
  nature: Natures;
  effortValues: Record<Stats, number>;
  abilities: Abilities[];
  moves: Moves[];
  items: Items[];
}

export interface Sheet {
  title: string;
  members: SheetMember[];
  /** Names nothing in the registries matched */
  missing: string[];
}

function list(cell: string): string[] {
  const names: string[] = [];

  for (const part of cell.replaceAll('*', '').replace(', then ', ', ').split(',')) {
    const name = part.trim();

    if (name !== '') {
      names.push(name);
    }
  }
  return names;
}

/** Every team table in TEAMS.md, its first six rows, resolved against the registries */
export function readSheets(path: string): Sheet[] {
  const species = byName(getRegisteredSpecies(), (id) => getSpeciesData(id).name);
  const moves = byName(getRegisteredMoves(), (id) => getMoveData(id).name);
  const abilities = byName(getRegisteredAbilities(), (id) => getAbilityData(id).name);
  const items = byName(itemIds(), (id) => getItemData(id).name);
  const sheets: Sheet[] = [];
  let current: Sheet | undefined;
  let ended = false;

  for (const line of readFileSync(path, 'utf8').split('\n')) {
    if (line.startsWith('## ')) {
      current = { title: line.slice(3), members: [], missing: [] };
      ended = false;
      sheets.push(current);
      continue;
    }
    if (current == null || ended || !line.startsWith('| ')) {
      continue;
    }

    const cells = line
      .split('|')
      .slice(1, -1)
      .map((cell) => cell.trim());

    if (cells.length < 8 || cells[0] === 'Role' || cells[0].startsWith('---')) {
      continue;
    }
    if (cells[1] === '') {
      // The blank row splits the six from the backups
      ended = true;
      continue;
    }

    const missing = current.missing;
    const lookup = <T>(map: Map<string, T>, name: string): T | undefined => {
      const id = map.get(name.toLowerCase());

      if (id == null) {
        missing.push(name);
      }
      return id;
    };
    const name = /\*\*(.+?)\*\*/.exec(cells[1])?.[1] ?? cells[1];
    const effortValues = {
      [Stats.HP]: 0,
      [Stats.Attack]: 0,
      [Stats.Defense]: 0,
      [Stats.SpecialAttack]: 0,
      [Stats.SpecialDefense]: 0,
      [Stats.Speed]: 0,
    };

    for (const part of cells[3].split(',')) {
      const match = /(\d+) (.+)/.exec(part.trim());

      const stat = match == null ? undefined : STAT_NAMES[match[2]];

      if (match != null && stat != null) {
        effortValues[stat] = Number(match[1]);
      }
    }

    const found = lookup(species, name);

    if (found == null) {
      continue;
    }

    const member: SheetMember = {
      name,
      species: found,
      nature: NATURES[cells[2]] ?? Natures.Hardy,
      effortValues,
      abilities: [],
      moves: [],
      items: [],
    };

    for (const ability of list(cells[5])) {
      const id = lookup(abilities, ability);
      if (id != null) {
        member.abilities.push(id);
      }
    }
    for (const move of list(cells[6])) {
      const id = lookup(moves, move);
      if (id != null) {
        member.moves.push(id);
      }
    }
    for (const item of list(cells[7])) {
      const id = lookup(items, item);
      if (id != null) {
        member.items.push(id);
      }
    }
    current.members.push(member);
  }

  const full: Sheet[] = [];

  for (const sheet of sheets) {
    if (sheet.members.length > 0) {
      full.push(sheet);
    }
  }
  return full;
}

function snapshot(member: SheetMember, index: number): CatchSnapshot {
  const level = 100;
  const size = deriveSize(member.species, index);

  return {
    caught: '',
    species: member.species,
    level,
    ivs: PERFECT_IVS,
    effortValues: member.effortValues,
    nature: member.nature,
    gender: deriveGender(member.species, index),
    height: size.height,
    weight: size.weight,
    shiny: false,
    shadow: false,
    moves: member.moves,
    movePoints: {},
    abilities: member.abilities,
    items: member.items,
    slots: packSlots(Math.max(4, countAbilitySlots(member.abilities)), 8, 8),
    health: getMaxHealth({
      species: member.species,
      level,
      ivs: PERFECT_IVS,
      effortValues: member.effortValues,
    }),
    friendship: BASE_FRIENDSHIP,
    statuses: 0,
  };
}

export interface RaidResult {
  won: boolean;
  timedOut: boolean;
  /** Fight time when it settled, or the limit */
  duration: number;
  /** The boss's health left, as a share */
  bossLeft: number;
  /** Party members standing at the end */
  standing: number;
  /** Damage the boss took, by what dealt it */
  dealt: Map<string, number>;
  /** Damage the party took, by what dealt it */
  taken: Map<string, number>;
  /** Moves the boss cast */
  bossCasts: string[];
}

function moveName(move: Moves): string {
  try {
    return getMoveData(move).name;
  } catch {
    return `move ${move}`;
  }
}

function causeName(cause: EffectCause, flags: number): string {
  const tag = flags & DamageFlags.Indirect ? ' (indirect)' : '';

  switch (cause.type) {
    case EffectType.Move:
      return `${getSpeciesData(cause.unit.species).name}: ${moveName(cause.move)}${tag}`;
    case EffectType.Ability:
      return `${getSpeciesData(cause.unit.species).name}: ${getAbilityData(cause.ability).name}${tag}`;
    case EffectType.Item:
      return `${getSpeciesData(cause.unit.species).name}: ${getItemData(cause.item).name}${tag}`;
    case EffectType.Weather:
      return `weather ${cause.weather}${tag}`;
    default:
      return `none${tag}`;
  }
}

/** One party of six against one boss, solo, played out headless */
export function runRaid(
  seed: string,
  party: SheetMember[],
  boss: Species,
  traitValue: number,
  bossAbility?: Abilities,
): RaidResult {
  const bossSnapshot = createRaidBossSnapshot(boss, traitValue);

  // In place of the rolled one, to measure a boss that blanks a strategy
  if (bossAbility != null) {
    bossSnapshot.abilities[bossSnapshot.abilities.length - 1] = bossAbility;
  }

  const catches: CatchSnapshot[] = [];

  for (const [index, member] of party.entries()) {
    catches.push(snapshot(member, index));
  }

  const teams: TeamSnapshotRecord[] = [
    {
      player: '',
      alliance: BOSS_ALLIANCE,
      catches: [bossSnapshot],
    },
    { player: 'solo', alliance: PLAYER_ALLIANCE, catches },
  ];
  const battle: Battle = createBattle(seed, {
    mode: BattleModes.Raid,
    limits: UNLIMITED_BATTLE_LIMITS,
  });
  const { alliances, units } = fieldTeams(battle, teams, BOSS_ALLIANCE);
  const dealt = new Map<string, number>();
  const taken = new Map<string, number>();
  const bossCasts: string[] = [];
  let time = 0;

  battle.on(BattleEvents.UnitDamage, AttackPriority.Cleanup, (event) => {
    if (!event.success) {
      return;
    }
    const ledger = event.target.team.alliance === alliances.get(BOSS_ALLIANCE) ? dealt : taken;

    const key = causeName(event.cause, event.flags);

    ledger.set(key, (ledger.get(key) ?? 0) + event.value);
  });
  battle.on(BattleEvents.UnitCast, EventPriority.Post, (event) => {
    if (event.source.team.alliance === alliances.get(BOSS_ALLIANCE)) {
      bossCasts.push(`${(time / 1000).toFixed(0)}s ${moveName(event.move)}`);
    }
  });

  battle.initialize();
  battle.start();

  while (!battle.settled && time < RAID_SIM_LIMIT) {
    battle.tick(FRAME);
    time += FRAME;
  }

  const bossUnit = units.get(BOSS_ALLIANCE)?.[0];
  let standing = 0;

  for (const unit of units.get(PLAYER_ALLIANCE) ?? []) {
    if (unit.alive) {
      standing++;
    }
  }

  return {
    won: battle.settled && battle.winner === alliances.get(PLAYER_ALLIANCE),
    timedOut: !battle.settled,
    duration: time,
    bossLeft: bossUnit == null ? 0 : bossUnit.health / bossUnit.checkStat(Stats.HP, 0),
    standing,
    dealt,
    taken,
    bossCasts,
  };
}
