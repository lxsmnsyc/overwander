import { EventPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import { Types } from '../../data/constants/types';
import { Moves } from '../../data/ids/moves';
import { NON_VOLATILE_STATUSES, Statuses, Terrains } from '../../data/ids/status';
import type Battle from '../core';
import { BattleModes } from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';
import type Unit from '../unit';
import { onUnitActs } from '../utils';

/**
 * The terrains: what the field is laid with. They reach the way a
 * weather does, across the whole field in a fight between players and
 * over the layer's own team in a raid, but only **grounded** units
 * feel one. That is folded into `CheckUnitTerrain`, so everything that
 * reads a terrain asks the unit and gets None for anything in the air.
 *
 * The numbers are the modern ones: a terrain's own type hits 1.3x
 * rather than the 1.5x it started at
 * https://bulbapedia.bulbagarden.net/wiki/Terrain
 */
export const TERRAIN_BOOST = 1.3;

/** What a terrain takes off the moves it blunts */
export const TERRAIN_BLUNTING = 0.5;

/** What Grassy Terrain heals each time a grounded unit acts */
export const GRASSY_HEAL_SHARE = 1 / 16;

/** The type each terrain strengthens for whoever throws it from the ground */
const BOOSTED: { [key in Terrains]?: Types } = {
  [Terrains.Electric]: Types.Electric,
  [Terrains.Grassy]: Types.Grass,
  [Terrains.Psychic]: Types.Psychic,
};

/** The quakes a lawn takes the force out of */
const QUAKES = new Set<Moves>([Moves.Earthquake, Moves.Bulldoze, Moves.Magnitude]);

/** What each terrain will not let settle on a grounded unit */
const REFUSED: { [key in Terrains]?: Set<Statuses> } = {
  [Terrains.Electric]: new Set([Statuses.Sleeping, Statuses.Drowsy]),
  [Terrains.Misty]: new Set([...NON_VOLATILE_STATUSES, Statuses.Confused, Statuses.Drowsy]),
};

export default function setupTerrainMechanics(battle: Battle): void {
  battle.on(BattleEvents.SetTerrain, EventPriority.Exact, (event) => {
    battle.terrain.current = event.terrain;
  });

  battle.on(BattleEvents.TeamSetTerrain, EventPriority.Exact, (event) => {
    event.team.terrain.current = event.terrain;
  });

  // Routed by battle mode the way a weather is: see UnitSetWeather
  battle.on(BattleEvents.UnitSetTerrain, EventPriority.Exact, (event) => {
    if (event.global || battle.mode === BattleModes.PvP || battle.mode === BattleModes.Npc) {
      battle.setTerrain(event.terrain, event.duration);
    } else {
      event.source.team.setTerrain(event.terrain, event.duration);
    }
  });

  battle.on(BattleEvents.CheckUnitTerrain, EventPriority.Exact, (event) => {
    const unit = event.source;

    if (unit.checkGrounded()) {
      event.terrain =
        battle.terrain.current === Terrains.None
          ? unit.team.terrain.current
          : battle.terrain.current;
    } else {
      event.terrain = Terrains.None;
    }
  });

  battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
    if (event.power == null) {
      return;
    }

    const boosted = BOOSTED[event.source.checkTerrain()];

    if (boosted != null && event.source.checkMoveType(event.move, event.target) === boosted) {
      event.power *= TERRAIN_BOOST;
    }

    if (event.target.type !== MoveTargetType.Unit) {
      return;
    }

    const under = event.target.unit.checkTerrain();

    if (
      (under === Terrains.Grassy && QUAKES.has(event.move)) ||
      (under === Terrains.Misty &&
        event.source.checkMoveType(event.move, event.target) === Types.Dragon)
    ) {
      event.power *= TERRAIN_BLUNTING;
    }
  });

  battle.on(BattleEvents.CheckUnitStatusImmunity, EventPriority.Post, (event) => {
    if (!event.immune && REFUSED[event.source.checkTerrain()]?.has(event.status) === true) {
      event.immune = true;
    }
  });

  // Psychic Terrain turns away what winds up faster than an ordinary
  // move, from the other side, before it reaches a grounded unit
  battle.on(BattleEvents.CheckUnitMoveImmunity, EventPriority.Post, (event) => {
    if (event.immune || event.target.type !== MoveTargetType.Unit) {
      return;
    }

    const target = event.target.unit;

    if (
      target.team.alliance !== event.source.team.alliance &&
      target.checkTerrain() === Terrains.Psychic &&
      event.source.checkMovePriority(event.move, event.target) > 0
    ) {
      event.immune = true;
    }
  });

  onUnitActs(battle, (unit: Unit) => {
    const max = unit.checkStat(Stats.HP, 0);

    if (unit.alive && unit.health < max && unit.checkTerrain() === Terrains.Grassy) {
      unit.heal({ type: EffectType.None }, unit, max * GRASSY_HEAL_SHARE, 0);
    }
  });
}
