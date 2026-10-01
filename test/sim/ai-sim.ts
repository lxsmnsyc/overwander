import type { CatchSnapshot } from '../../src/auth/catch-snapshot';
import { getMaxHealth } from '../../src/auth/health';
import type { TeamSnapshotRecord } from '../../src/auth/teams';
import { MoveRole, getMoveRoles } from '../../src/battle/ai/roles';
import type Battle from '../../src/battle/core';
import { BattleModes } from '../../src/battle/core';
import { BattleEvents } from '../../src/battle/events';
import createBattle from '../../src/battle/setup';
import AleaRNG from '../../src/core/alea';
import { EventPriority } from '../../src/core/event-emitter';
import { UNLIMITED_BATTLE_LIMITS } from '../../src/data/constants/battle-limits';
import { BASE_FRIENDSHIP } from '../../src/data/constants/friendship';
import { Slots, defaultSlots, withSlots } from '../../src/data/constants/slots';
import { MAX_IV, Stats, packIVs } from '../../src/data/constants/stats';
import { Species } from '../../src/data/ids/species';
import type { Moves } from '../../src/data/ids/moves';
import { getExpertHeldItems } from '../../src/data/items/expert-loadout';
import { getRegisteredSpecies, isFullyEvolved, isWornForm } from '../../src/data/species';
import { getBestParty } from '../../src/data/species/best-build';
import { deriveGender, deriveSize } from '../../src/overworld/encounter';
import { fieldTeams } from '../../src/overworld/raid-battle';

/** The names of the roles, for the report: the enum is erased at build */
export const ROLE_NAMES: Record<MoveRole, string> = {
  [MoveRole.Shield]: 'Shield',
  [MoveRole.TeamSetup]: 'TeamSetup',
  [MoveRole.Hazard]: 'Hazard',
  [MoveRole.Field]: 'Field',
  [MoveRole.Status]: 'Status',
  [MoveRole.Disruption]: 'Disruption',
  [MoveRole.SelfBoost]: 'SelfBoost',
  [MoveRole.FoeDrop]: 'FoeDrop',
  [MoveRole.Heal]: 'Heal',
  [MoveRole.Support]: 'Support',
  [MoveRole.Pivot]: 'Pivot',
  [MoveRole.Utility]: 'Utility',
  [MoveRole.Damage]: 'Damage',
  [MoveRole.Spread]: 'Spread',
  [MoveRole.Priority]: 'Priority',
  [MoveRole.MultiHit]: 'MultiHit',
  [MoveRole.Charge]: 'Charge',
  [MoveRole.Recharge]: 'Recharge',
  [MoveRole.Recoil]: 'Recoil',
  [MoveRole.Drain]: 'Drain',
  [MoveRole.Sacrifice]: 'Sacrifice',
  [MoveRole.OneHitKO]: 'OneHitKO',
  [MoveRole.FixedDamage]: 'FixedDamage',
  [MoveRole.LockIn]: 'LockIn',
  [MoveRole.Delayed]: 'Delayed',
  [MoveRole.Afflicts]: 'Afflicts',
  [MoveRole.Weakens]: 'Weakens',
  [MoveRole.Trapping]: 'Trapping',
};

const PLACEHOLDERS = new Set<Species>([Species.Missingno, Species.Egg, Species.Substitute]);

/** Fight time a battle is given before it is called a stalemate */
const TIME_LIMIT = 5 * 60 * 1000;

const FRAME = 1000 / 60;

export interface SimOptions {
  /** Pokemon on each side */
  size: number;
  level: number;
  /** Abilities each built pokemon carries */
  abilities: number;
  /** Held items each built pokemon carries */
  items: number;
}

export interface Cast {
  /** The side that cast it: 0 or 1 */
  side: number;
  species: Species;
  move: Moves;
  /** Fight time it was cast at */
  time: number;
}

export interface SimResult {
  /** The side left standing, or null for a draw or a stalemate */
  winner: number | null;
  /** Whether the fight ran out of time */
  timedOut: boolean;
  duration: number;
  casts: Cast[];
}

let rollable: Species[] | null = null;

function rollableSpecies(): Species[] {
  if (rollable == null) {
    rollable = [];
    for (const species of getRegisteredSpecies()) {
      if (!PLACEHOLDERS.has(species) && isFullyEvolved(species) && !isWornForm(species)) {
        rollable.push(species);
      }
    }
  }
  return rollable;
}

function rollParty(random: () => number, options: SimOptions): CatchSnapshot[] {
  const pool = rollableSpecies();
  const species: Species[] = [];

  for (let at = 0; at < options.size; at++) {
    species.push(pool[Math.floor(random() * pool.length)]);
  }
  return buildParty(species, random, options);
}

/** One side, built the way an expert's party is: composed as a whole, then geared */
function buildParty(
  species: Species[],
  random: () => number,
  options: SimOptions,
): CatchSnapshot[] {
  const party: CatchSnapshot[] = [];

  for (const [at, build] of getBestParty(species, options.abilities).entries()) {
    const one = species[at];
    const traitValue = Math.floor(random() * 0x1_0000_0000);
    const size = deriveSize(one, traitValue);
    const ivs = packIVs({
      [Stats.HP]: MAX_IV,
      [Stats.Attack]: MAX_IV,
      [Stats.Defense]: MAX_IV,
      [Stats.SpecialAttack]: MAX_IV,
      [Stats.SpecialDefense]: MAX_IV,
      [Stats.Speed]: MAX_IV,
    });
    const effortValues = {
      [Stats.HP]: 0,
      [Stats.Attack]: 0,
      [Stats.Defense]: 0,
      [Stats.SpecialAttack]: 0,
      [Stats.SpecialDefense]: 0,
      [Stats.Speed]: 0,
    };
    const items = getExpertHeldItems(one, options.items, {
      moves: build.moves,
      abilities: build.abilities,
      role: build.role,
      best: true,
    });

    party.push({
      caught: '',
      species: one,
      level: options.level,
      ivs,
      effortValues,
      nature: build.nature,
      gender: deriveGender(one, traitValue),
      height: size.height,
      weight: size.weight,
      shiny: false,
      shadow: false,
      moves: build.moves,
      movePoints: {},
      abilities: build.abilities,
      items,
      slots: withSlots(defaultSlots(build.abilities), Slots.Item, Math.max(1, items.length)),
      health: getMaxHealth({ species: one, level: options.level, ivs, effortValues }),
      friendship: BASE_FRIENDSHIP,
      statuses: 0,
    });
  }
  return party;
}

/** Two rolled parties, the same for a given seed */
export function rollTeams(seed: string, options: SimOptions): TeamSnapshotRecord[] {
  const rng = new AleaRNG(`ai-sim:${seed}`);
  const random = (): number => rng.random();

  return [
    { player: 'a', alliance: 0, catches: rollParty(random, options) },
    { player: 'b', alliance: 1, catches: rollParty(random, options) },
  ];
}

/** Two given parties, built and geared the same way the rolled ones are */
export function buildTeams(
  seed: string,
  sides: [Species[], Species[]],
  options: SimOptions,
): TeamSnapshotRecord[] {
  const rng = new AleaRNG(`ai-sim:${seed}`);
  const random = (): number => rng.random();

  return [
    { player: 'a', alliance: 0, catches: buildParty(sides[0], random, options) },
    { player: 'b', alliance: 1, catches: buildParty(sides[1], random, options) },
  ];
}

/**
 * Field the teams and play the fight out headless, recording every
 * cast. `maxCasts` stops it early, for a look at how a fight opens
 */
export function runBattle(
  seed: string,
  teams: TeamSnapshotRecord[],
  maxCasts = Infinity,
): SimResult {
  const battle: Battle = createBattle(seed, {
    mode: BattleModes.PvP,
    limits: UNLIMITED_BATTLE_LIMITS,
  });
  const casts: Cast[] = [];
  let time = 0;

  battle.on(BattleEvents.UnitCast, EventPriority.Post, (event) => {
    casts.push({
      side: event.source.team.player === 'a' ? 0 : 1,
      species: event.source.species,
      move: event.move,
      time,
    });
  });

  const { alliances } = fieldTeams(battle, teams, null);

  while (!battle.settled && time < TIME_LIMIT && casts.length < maxCasts) {
    battle.tick(FRAME);
    time += FRAME;
  }

  let winner: number | null = null;

  for (const [side, alliance] of alliances) {
    if (battle.winner === alliance) {
      winner = side;
    }
  }
  return { winner, timedOut: !battle.settled, duration: time, casts };
}

/** Every role a cast held, for tallying */
export function castRoles(move: Moves): ReadonlySet<MoveRole> {
  return getMoveRoles(move);
}
