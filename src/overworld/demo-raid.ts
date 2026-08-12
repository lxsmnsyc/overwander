import type { CatchSnapshot } from '../auth/catch-snapshot';
import { getMaxHealth } from '../auth/health';
import type { TeamSnapshotRecord } from '../auth/teams';
import AleaRNG from '../core/alea';
import { MAX_LEVEL } from '../data/constants/levels';
import { MAX_IV, Stats, packIVs } from '../data/constants/stats';
import { Species } from '../data/ids/species';
import { getRegisteredSpecies, isFullyEvolved } from '../data/species';
import { deriveAbility, deriveGender, deriveMoves, deriveNature, deriveSize } from './encounter';
import { BOSS_ALLIANCE, PLAYER_ALLIANCE, canStageBoss, createRaidBossSnapshot } from './raid';

/**
 * A raid built out of nothing, for looking at.
 *
 * The battle engine and the sprite canvas are the two parts of the
 * game that need a **fight** to be exercised at all, and the only
 * fights the game stages are ones somebody walked to, filled a lobby
 * for and paid for. That makes the loop that most wants watching the
 * hardest one to reach, so this builds the same shapes out of a seed:
 * a boss, five parties, no store, no session, no consequences.
 *
 * Everything here is **derived from the seed**, so a demo is a
 * permalink — the same seed is the same fight, frame for frame, on
 * anybody's screen. It is the same property a real raid has for the
 * same reason, and it is what makes an animation bug reportable
 * rather than a thing somebody once saw.
 *
 * Nothing in here is reachable from the game: it writes no documents,
 * reads no profile, and stands behind its own route
 */

/**
 * How many parties face the boss, and how many pokemon each brings.
 * Eight full parties is a lobby drawn as eight points of a circle
 * around the boss, which is what a spectator sees — and a busy enough
 * field that whatever the canvas does with a crowd it does here first
 */
export const DEMO_TEAMS = 8;
export const DEMO_TEAM_SIZE = 6;

/**
 * The band the parties are rolled in. High enough that a fight against
 * a maxed boss lasts long enough to watch, low enough that the boss is
 * still the biggest thing on the field
 */
export const DEMO_MIN_LEVEL = 70;
export const DEMO_MAX_LEVEL = 80;

/**
 * The placeholders at the front of the species list: a missing entry,
 * an egg and a substitute. None of them is a pokemon and none has a
 * sheet worth drawing, so nothing rolls one
 */
const PLACEHOLDERS = new Set<Species>([Species.Missingno, Species.Egg, Species.Substitute]);

/**
 * Everything that can be rolled onto a field. Worked out on the first
 * ask rather than at import, since the registry is filled by
 * `registerGameData()` and a list read at import time would be
 * reading an empty one
 */
let rollable: Species[] | null = null;

function getRollableSpecies(): Species[] {
  rollable ??= getRegisteredSpecies().filter(
    // Fully evolved only. The parties are rolled at level 70 and up,
    // where a Caterpie is a pokemon that would have evolved twice
    // over long ago — and a field of finished pokemon is a field of
    // the sprites and the movesets worth looking at
    (species) => !PLACEHOLDERS.has(species) && isFullyEvolved(species),
  );
  return rollable;
}

function pick<T>(entries: T[], random: () => number): T {
  return entries[Math.min(entries.length - 1, Math.floor(random() * entries.length))];
}

/**
 * One rolled pokemon, in the shape a battle fields.
 *
 * It goes through the same `derive*` helpers a real encounter does —
 * ability, gender, nature, size and the level-up move list — so what
 * is on the field is built the way the game builds one rather than
 * the way a demo might find convenient. A bug that shows up here is a
 * bug the game has
 */
function rollCatch(random: () => number, index: number): CatchSnapshot {
  const species = pick(getRollableSpecies(), random);
  const level = Math.min(
    MAX_LEVEL,
    DEMO_MIN_LEVEL + Math.floor(random() * (DEMO_MAX_LEVEL - DEMO_MIN_LEVEL + 1)),
  );
  const traitValue = Math.floor(random() * 0x1_0000_0000);
  const roll = (): number => Math.floor(random() * (MAX_IV + 1));
  const ivs = packIVs({
    [Stats.HP]: roll(),
    [Stats.Attack]: roll(),
    [Stats.Defense]: roll(),
    [Stats.SpecialAttack]: roll(),
    [Stats.SpecialDefense]: roll(),
    [Stats.Speed]: roll(),
  });
  const effortValues = {
    [Stats.HP]: 0,
    [Stats.Attack]: 0,
    [Stats.Defense]: 0,
    [Stats.SpecialAttack]: 0,
    [Stats.SpecialDefense]: 0,
    [Stats.Speed]: 0,
  };
  const size = deriveSize(species, traitValue);

  return {
    // It stands for no record, which is what keeps the aftermath
    // machinery from having anything to say about it
    caught: '',
    species,
    level,
    ivs,
    effortValues,
    nature: deriveNature(traitValue),
    gender: deriveGender(species, traitValue),
    height: size.height,
    weight: size.weight,
    // One in eight sparkles, far above the real odds: the point of
    // the page is to see the shiny palette without walking for it
    shiny: index % 8 === 0,
    shadow: false,
    moves: deriveMoves(species, level),
    abilities: [deriveAbility(species, traitValue)],
    items: [],
    health: getMaxHealth({ species, level, ivs, effortValues }),
    statuses: 0,
  };
}

/**
 * The teams of a demo raid: the boss in its own alliance, and
 * `DEMO_TEAMS` parties sharing the other one, exactly as a real lobby
 * publishes them.
 *
 * The parties are separate **teams** rather than one big party
 * because that is what a lobby is — five players who happen to be
 * allied — and it is the arrangement the targeting rules and the
 * spread moves actually run against
 */
export function createDemoRaidTeams(seed: string): TeamSnapshotRecord[] {
  const rng = new AleaRNG(`demo-raid:${seed}`);
  const random = (): number => rng.random();
  const bosses = getRollableSpecies().filter(canStageBoss);
  const boss = pick(bosses, random);

  const teams: TeamSnapshotRecord[] = [
    {
      // A boss belongs to nobody, the way a real one does
      player: '',
      alliance: BOSS_ALLIANCE,
      catches: [createRaidBossSnapshot(boss, Math.floor(random() * 0x1_0000_0000))],
    },
  ];

  for (let team = 0; team < DEMO_TEAMS; team++) {
    const catches: CatchSnapshot[] = [];

    for (let member = 0; member < DEMO_TEAM_SIZE; member++) {
      catches.push(rollCatch(random, team * DEMO_TEAM_SIZE + member));
    }
    teams.push({ player: `demo-${team + 1}`, alliance: PLAYER_ALLIANCE, catches });
  }
  return teams;
}
