import { BattleModes } from '../../../battle/core';
import type Team from '../../../battle/team';
import type { RaidBattle } from '../../../overworld/raid-battle';
import type { Species } from '../../../data/ids/species';
import { getSpeciesData } from '../../../data/species';

/**
 * What a settled fight is read down to for its summary: who dealt
 * what. Nothing here looks at the record, only at the battle that was
 * fought.
 */

/**
 * One line of the summary: who, and how much of the other side's
 * health they took
 */
export interface Contribution {
  label: string;
  player: string;
  dealt: number;
}

/**
 * One side of a player or trainer fight: whose it was, what the whole
 * team took off the other side, and each pokemon's own share
 */
export interface SideSummary {
  player: string;
  lead: Species;
  dealt: number;
  units: { species: Species; dealt: number }[];
}

/**
 * The fight's contributions, largest first. A raid ranks whole teams
 * — the boss included, since how hard it hit back is part of the
 * story; player and npc fights are small enough to rank every unit on
 * its own
 */
export function readContributions(built: RaidBattle): Contribution[] {
  const rows: Contribution[] = [];

  if (built.battle.mode === BattleModes.Raid) {
    const teams = new Map<Team, number>();

    for (const fielded of built.units.values()) {
      for (const unit of fielded) {
        teams.set(unit.team, (teams.get(unit.team) ?? 0) + unit.dealt);
      }
    }
    for (const [team, dealt] of teams) {
      const lead = [...team.units].at(0);

      rows.push({
        // A side no player owns is named for what led it out
        label: team.player === '' && lead != null ? getSpeciesData(lead.species).name : '',
        player: team.player,
        dealt,
      });
    }
  } else {
    for (const fielded of built.units.values()) {
      for (const unit of fielded) {
        rows.push({
          label: getSpeciesData(unit.species).name,
          player: unit.team.player,
          dealt: unit.dealt,
        });
      }
    }
  }
  return rows.sort((one, other) => other.dealt - one.dealt);
}

/**
 * The fight by sides, for the summary of a player or trainer battle:
 * each team under its owner, largest total first, each pokemon under
 * its team, largest share first
 */
export function readSides(built: RaidBattle): SideSummary[] {
  const teams = new Map<Team, SideSummary>();

  for (const fielded of built.units.values()) {
    for (const unit of fielded) {
      let side = teams.get(unit.team);

      if (side == null) {
        side = { player: unit.team.player, lead: unit.species, dealt: 0, units: [] };
        teams.set(unit.team, side);
      }
      side.dealt += unit.dealt;
      side.units.push({ species: unit.species, dealt: unit.dealt });
    }
  }
  return [...teams.values()]
    .map((side) => ({
      ...side,
      units: side.units.sort((one, other) => other.dealt - one.dealt),
    }))
    .sort((one, other) => other.dealt - one.dealt);
}
