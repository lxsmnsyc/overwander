import fc from 'fast-check';
import type { TeamSnapshotRecord } from '../../src/auth/teams';
import type { Species } from '../../src/data/ids/species';
import { getRegisteredSpecies, isFullyEvolved, isWornForm } from '../../src/data/species';
import {
  BOSS_ALLIANCE,
  PLAYER_ALLIANCE,
  canStageBoss,
  createRaidBossTeam,
} from '../../src/overworld/raid';
import { type SimOptions, rollTeams } from '../sim/ai-sim';

/** One random fight between two rolled parties */
export interface BattleInput extends SimOptions {
  seed: string;
}

/** One random raid: a staged boss against two rolled parties */
export interface RaidInput extends BattleInput {
  /** Picks the boss out of every species a raid can stage */
  boss: number;
  traitValue: number;
}

/**
 * How many battles a property plays, and the seed and path fast-check
 * printed for a failure, to play it again
 */
export function readFuzzParameters(): fc.Parameters<unknown> {
  // One seed for every property in the run, so they draw the same
  // fights and each fight is played once however many rules read it
  const parameters: fc.Parameters<unknown> = {
    numRuns: Number(process.env.FUZZ_RUNS ?? 100),
    seed: Number(process.env.FUZZ_SEED ?? Date.now() % 0x8000_0000),
  };

  if (process.env.FUZZ_PATH != null) {
    parameters.path = process.env.FUZZ_PATH;
  }
  return parameters;
}

/** The seed string a battle is rolled and played from, small enough to read back */
const seedArbitrary = fc.nat({ max: 1_000_000 }).map((value) => `fuzz-${value}`);

export const battleArbitrary: fc.Arbitrary<BattleInput> = fc.record({
  seed: seedArbitrary,
  size: fc.integer({ min: 1, max: 3 }),
  level: fc.integer({ min: 1, max: 100 }),
  abilities: fc.constantFrom(0, 1),
  items: fc.constantFrom(0, 1),
  signatures: fc.boolean(),
});

export const raidArbitrary: fc.Arbitrary<RaidInput> = fc.record({
  seed: seedArbitrary,
  size: fc.integer({ min: 1, max: 3 }),
  level: fc.integer({ min: 50, max: 100 }),
  abilities: fc.constantFrom(0, 1),
  items: fc.constantFrom(0, 1),
  signatures: fc.boolean(),
  boss: fc.nat(),
  traitValue: fc.nat({ max: 0xffff_ffff }),
});

let bosses: Species[] | null = null;

function getStageableBosses(): Species[] {
  if (bosses == null) {
    bosses = [];
    for (const species of getRegisteredSpecies()) {
      if (isFullyEvolved(species) && !isWornForm(species) && canStageBoss(species)) {
        bosses.push(species);
      }
    }
  }
  return bosses;
}

/** The boss side and both rolled parties, the parties allied against the boss */
export function buildRaidTeams(input: RaidInput): TeamSnapshotRecord[] {
  const pool = getStageableBosses();
  const boss = pool[input.boss % pool.length];
  const teams: TeamSnapshotRecord[] = [
    {
      player: '',
      alliance: BOSS_ALLIANCE,
      catches: createRaidBossTeam(boss, input.traitValue, false, false),
    },
  ];

  for (const party of rollTeams(input.seed, input)) {
    teams.push({ ...party, alliance: PLAYER_ALLIANCE });
  }
  return teams;
}
