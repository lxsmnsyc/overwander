import type Alliance from '../../../battle/alliance';
import type Battle from '../../../battle/battle';
import { BattleEvents } from '../../../battle/events';
import type Unit from '../../../battle/unit';
import { Stats } from '../../../data/constants/stats';
import type { Types } from '../../../data/constants/types';
import Abilities from '../../../data/ids/abilities';
import type { Species } from '../../../data/ids/species';
import { getSpeciesData } from '../../../data/species';
import { m } from '../../../i18n/paraglide/messages.js';

/**
 * How each side of a fight stands right now, read off the battle for
 * the plates and the raid banner.
 */

/** What moves a side's standing, and so what redraws the plates */
export const STANDING_EVENTS = [
  BattleEvents.UnitSetHealth,
  BattleEvents.UnitSetMaxHealth,
  BattleEvents.UnitFaints,
  BattleEvents.TeamAddUnit,
] as const;

/** How one side of the fight stands */
export interface SideStanding {
  label: string;
  /** Health left across the side, from 0 to 1 */
  health: number;
  standing: number;
  total: number;
  /** The reader's own side, or the first side for a spectator */
  friendly: boolean;
}

/** The boss of a raid, which the banner draws */
export interface BossStanding {
  /** Its name, or its Frenzy for a Noble */
  label: string;
  /** What it is drawn as, for its face */
  appearance: Species;
  shiny: boolean;
  /** Health left on the boss itself, from 0 to 1 */
  health: number;
  teraType: Types;
  terastallized: boolean;
}

export interface Standing {
  boss: BossStanding | null;
  /** The reader's side first, so it is always on the left */
  sides: SideStanding[];
}

function readSide(units: Unit[], label: string, friendly: boolean): SideStanding {
  let health = 0;
  let most = 0;
  let standing = 0;

  for (const unit of units) {
    health += Math.max(0, unit.health);
    most += Math.max(1, unit.checkStat(Stats.HP, 0));
    if (unit.alive) {
      standing += 1;
    }
  }
  return {
    label,
    health: most <= 0 ? 0 : Math.min(1, health / most),
    standing,
    total: units.length,
    friendly,
  };
}

/**
 * The boss alone, not its side: an Alpha's copies and a Totem's ally
 * join the side as they are called, and counting them would push the
 * banner back up each time one arrives
 */
function readBoss(lead: Unit): BossStanding {
  const most = lead.checkStat(Stats.HP, 0);
  const name = getSpeciesData(lead.appearance).name;

  return {
    // A Noble's HP is its Frenzy, which is what the party drains
    label: lead.hasAbility(Abilities.Noble) ? m.battle_frenzy({ name }) : name,
    appearance: lead.appearance,
    shiny: lead.shiny,
    health: most <= 0 ? 0 : Math.max(0, Math.min(1, lead.health / most)),
    teraType: lead.teraType,
    terastallized: lead.terastallized,
  };
}

function collectUnits(alliance: Alliance): Unit[] {
  const units: Unit[] = [];

  for (const team of alliance.teams) {
    for (const unit of team.units) {
      units.push(unit);
    }
  }
  return units;
}

/** How the fight stands for `player`, who is empty for a spectator */
export function readStanding(battle: Battle, player: string): Standing {
  // The reader's own alliance, if they fight in it
  let own: Alliance | undefined;

  for (const alliance of battle.alliances) {
    for (const team of alliance.teams) {
      if (player !== '' && team.player === player) {
        own = alliance;
      }
    }
  }

  // Each side by whose it is; a spectator has no side, so each is numbered
  let boss: BossStanding | null = null;
  const sides: SideStanding[] = [];

  for (const alliance of battle.alliances) {
    const units = collectUnits(alliance);

    if (units.length === 0) {
      continue;
    }
    if (alliance.boss) {
      boss = readBoss(units[0]);
      continue;
    }
    if (own == null) {
      sides.push(readSide(units, m.battle_side({ side: sides.length + 1 }), sides.length === 0));
      continue;
    }
    sides.push(
      readSide(units, alliance === own ? m.battle_you() : m.battle_foe(), alliance === own),
    );
  }

  // Yours first, so it always reads left to right the same way
  sides.sort((one, other) => Number(other.friendly) - Number(one.friendly));
  return { boss, sides };
}
