// The engine runs in a browser and nowhere else: a fight is played,
// watched and settled on the client, and the server keeps what it came
// to rather than replaying it. The marker is what keeps the whole of
// it — every mechanic, ability, item and move effect — out of the
// server bundle
import setupAbilities from './abilities';
import setupAI from './ai';
import Battle, { BattleModes } from './core';
import type Biome from '../data/ids/biome';
import setupItems from './items';
import setupAbilityMechanics from './mechanics/ability';
import setupAllianceMechanics from './mechanics/alliance';
import setupBattleMechanics from './mechanics/battle';
import setupItemMechanics from './mechanics/item';
import {
  setupAttackMechanics,
  setupCastingMechanics,
  setupChannelingMechanics,
  setupCooldownMechanics,
  setupMoveMechanics,
  setupTriggerMoveMechanics,
} from './mechanics/move';
import setupOutcomeMechanics from './mechanics/outcome';
import setupTeamMechanics from './mechanics/team';
import setupUnitMechanics from './mechanics/unit';
import setupWeatherMechanics from './mechanics/weather';
import setupMoves from './moves';
import setupStatus from './status';

/**
 * A battle with every mechanic, move, status, ability and item
 * wired, plus the AI that drives idle units. The frame timer is
 * optional: a UI that runs the battle in real time wants it, a test
 * or a replay drives time with battle.tick instead
 */
export default function createBattle(
  seed: string,
  options?: {
    mode?: BattleModes;
    realtime?: boolean;
    limits?: number;
    biome?: Biome;
    timeLimit?: number;
    byNature?: boolean;
  },
): Battle {
  const battle = new Battle(
    seed,
    options?.mode,
    options?.limits,
    options?.biome,
    options?.timeLimit,
  );

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
  // A demo has nobody to choose for and nothing to win: the units
  // stand until somebody casts through them, and a field with one
  // side left is a field somebody wanted to look at rather than a
  // fight that is over
  if (battle.mode !== BattleModes.Demo) {
    setupAI(battle, options?.byNature === true);
    // Last, so the scan sees a tick's actions already settled
    setupOutcomeMechanics(battle);
  }

  if (options?.realtime === true) {
    setupBattleMechanics(battle);
  }
  return battle;
}
