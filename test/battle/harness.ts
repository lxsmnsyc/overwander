import setupAbilities from '../../src/battle/abilities';
import { setupRatingAI } from '../../src/battle/ai/rating';
import Alliance from '../../src/battle/alliance';
import Battle from '../../src/battle/core';
import setupItems from '../../src/battle/items';
import setupAbilityMechanics from '../../src/battle/mechanics/ability';
import setupAllianceMechanics from '../../src/battle/mechanics/alliance';
import setupItemMechanics from '../../src/battle/mechanics/item';
import {
  setupAttackMechanics,
  setupCastingMechanics,
  setupChannelingMechanics,
  setupCooldownMechanics,
  setupMoveMechanics,
  setupTriggerMoveMechanics,
} from '../../src/battle/mechanics/move';
import setupTeamMechanics from '../../src/battle/mechanics/team';
import setupUnitMechanics from '../../src/battle/mechanics/unit';
import setupWeatherMechanics from '../../src/battle/mechanics/weather';
import setupMoves from '../../src/battle/moves';
import setupStatus from '../../src/battle/status';
import Team from '../../src/battle/team';
import Unit from '../../src/battle/unit';
import { Stats, StatsKind } from '../../src/data/constants/stats';
import type { Types } from '../../src/data/constants/types';
import registerItems from '../../src/data/items';
import registerGen1Moves from '../../src/data/moves/gen-1';
import { registerSpecies } from '../../src/data/species';

let dataRegistered = false;

export interface BattleHarness {
  battle: Battle;
  allianceA: Alliance;
  allianceB: Alliance;
  teamA: Team;
  teamB: Team;
}

/**
 * A full battle with every mechanic, move, status, and ability wired,
 * plus one team per side. The frame timer (setupBattleMechanics) is
 * left out; tests drive time with battle.tick().
 */
export function createBattle(seed = 'test-seed'): BattleHarness {
  if (!dataRegistered) {
    registerGen1Moves();
    registerSpecies();
    registerItems();
    dataRegistered = true;
  }

  const battle = new Battle(seed);

  setupAllianceMechanics(battle);
  setupTeamMechanics(battle);
  setupUnitMechanics(battle);
  setupAbilityMechanics(battle);
  setupItemMechanics(battle);
  setupWeatherMechanics(battle);
  setupMoveMechanics(battle);
  setupCastingMechanics(battle);
  setupChannelingMechanics(battle);
  setupCooldownMechanics(battle);
  setupTriggerMoveMechanics(battle);
  setupAttackMechanics(battle);
  setupMoves(battle);
  setupStatus(battle);
  setupAbilities(battle);
  setupItems(battle);
  // Rating resolver only; the idle AI loop stays out of tests
  setupRatingAI(battle);

  const allianceA = new Alliance(battle);
  const allianceB = new Alliance(battle);

  const teamA = new Team(battle, allianceA);
  const teamB = new Team(battle, allianceB);

  allianceA.addTeam(teamA);
  allianceB.addTeam(teamB);

  return { battle, allianceA, allianceB, teamA, teamB };
}

const ALL_STATS = [
  Stats.HP,
  Stats.Attack,
  Stats.Defense,
  Stats.SpecialAttack,
  Stats.SpecialDefense,
  Stats.Speed,
];

/**
 * Level 50 unit with 100 in every base stat (105 in each battle stat,
 * 160 max HP) at full health.
 */
export function createUnit(battle: Battle, team: Team, types: Types[] = []): Unit {
  const unit = new Unit(battle, team);
  team.addUnit(unit);

  unit.setLevel(50);

  for (const stat of ALL_STATS) {
    unit.setStat(StatsKind.Base, stat, 100);
  }

  for (const type of types) {
    unit.addType(type);
  }

  unit.setHealth(unit.checkStat(Stats.HP, 0));

  return unit;
}

/**
 * Pin the battle RNG to a fixed value for deterministic rolls.
 */
export function pinRandom(battle: Battle, value: number): void {
  battle.random = () => value;
}
