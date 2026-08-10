import setupAbilities from './abilities';
import setupAI from './ai';
import Battle, { type BattleLimits, type BattleModes } from './core';
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
  options?: { limits?: Partial<BattleLimits>; mode?: BattleModes; realtime?: boolean },
): Battle {
  const battle = new Battle(seed, options?.limits, options?.mode);

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
  setupAI(battle);
  // Last, so the scan sees a tick's actions already settled
  setupOutcomeMechanics(battle);

  if (options?.realtime === true) {
    setupBattleMechanics(battle);
  }
  return battle;
}
