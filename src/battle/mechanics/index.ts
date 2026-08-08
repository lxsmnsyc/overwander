import type Battle from '../core';
import setupAbilityMechanics from './ability';
import setupAllianceMechanics from './alliance';
import setupBattleMechanics from './battle';
import setupItemMechanics from './item';
import {
  setupAttackMechanics,
  setupCastingMechanics,
  setupChannelingMechanics,
  setupCooldownMechanics,
  setupMoveMechanics,
  setupTriggerMoveMechanics,
} from './move';
import setupTeamMechanics from './team';
import setupUnitMechanics from './unit';
import setupWeatherMechanics from './weather';

export default function setupBaseMechanics(battle: Battle): void {
  setupAbilityMechanics(battle);
  setupAllianceMechanics(battle);
  setupBattleMechanics(battle);
  setupItemMechanics(battle);

  setupMoveMechanics(battle);
  setupCastingMechanics(battle);
  setupChannelingMechanics(battle);
  setupCooldownMechanics(battle);
  setupTriggerMoveMechanics(battle);
  setupAttackMechanics(battle);

  setupTeamMechanics(battle);
  setupUnitMechanics(battle);
  setupWeatherMechanics(battle);
}
