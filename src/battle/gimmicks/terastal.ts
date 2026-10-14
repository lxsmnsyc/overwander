import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import { Types } from '../../data/constants/types';
import { Items } from '../../data/ids/items';
import { MoveCategories, Moves, StatFlags } from '../../data/ids/moves';
import { MULTI_HIT_MOVES } from '../../data/moves/multi-hit';
import { getSpeciesData } from '../../data/species/__create';
import type Battle from '../core';
import { BattleEvents, type UnitAttackEvent } from '../events';
import { maskShapeOf, maskTypeOf, teraShapeOf } from '../items/masks';
import { isMegaHolder } from './mega';
import type Team from '../team';
import type Unit from '../unit';
import { holdsStoneOrCrystal } from './dynamax';

/**
 * Terastallization. A unit holding a Tera Orb takes its Tera type as
 * it takes the field, once a side a fight, with nothing to press. It
 * keeps it for the rest of the fight, through switching out
 * https://bulbapedia.bulbagarden.net/wiki/Terastal_phenomenon
 */

/** What a move of the Tera type alone is worth, and an original type's move */
export const TERA_STAB = 1.5;

/** What a move is worth when the Tera type is one of its own types too */
export const TERA_SAME_TYPE_STAB = 2;

/** The same, with Adaptability */
export const TERA_ADAPTABILITY_STAB = 2.25;

/** What Adaptability makes of a Tera-type move outside its own types */
const ADAPTABILITY_STAB = 2;

/** The power a weaker Tera-type move is raised to */
export const TERA_POWER_FLOOR = 60;

/** The types it had before it Terastallized, which keep their STAB */
const naturalTypes = new WeakMap<Unit, Types[]>();

/** The sides that have Terastallized somebody this fight */
const spent = new WeakSet<Team>();

/** Set while the mechanic retypes a unit, so its own block lets the change through */
let retyping = false;

export function isTerastallized(unit: Unit): boolean {
  return unit.terastallized;
}

/** The types it holds when it is not hit as its Tera type */
export function naturalTypesOf(unit: Unit): Types[] {
  return naturalTypes.get(unit) ?? [...unit.types];
}

/** Whether the orb may Terastallize this unit. Held rather than enabled, the way a stone is */
export function canTerastallize(unit: Unit): boolean {
  return (
    unit.items[Items.TeraOrb] != null &&
    unit.items[Items.DynamaxBand] == null &&
    !isMegaHolder(unit) &&
    !holdsStoneOrCrystal(unit)
  );
}

/**
 * Turn the unit into its Tera type for the rest of the fight, spending
 * its side's. A raid boss is fielded this way
 */
export function terastallize(unit: Unit): void {
  if (unit.terastallized || !unit.alive) {
    return;
  }
  const natural = [...unit.types];
  // Ogerpon's mask decides its Tera type, whatever the catch's own
  const mask = maskShapeOf(unit);
  const masked = mask == null ? undefined : maskTypeOf(mask);

  if (masked != null) {
    unit.teraType = masked;
  } else if (unit.teraType === Types.Unknown) {
    unit.teraType = natural[0] ?? Types.Normal;
  }
  naturalTypes.set(unit, natural);
  spent.add(unit.team);
  unit.terastallized = true;

  retyping = true;
  for (const type of natural) {
    unit.removeType(type);
  }
  unit.addType(unit.teraType);
  retyping = false;

  const shape = mask == null ? undefined : teraShapeOf(mask);

  if (shape != null) {
    unit.setSpecies(shape);
  }
}

/**
 * What Adaptability makes of a STAB the mechanic has already settled.
 * Once Terastallized it only lifts the Tera type's moves
 */
export function adaptedSTAB(unit: Unit, type: Types, value: number): number {
  if (value <= 1) {
    return value;
  }
  if (!unit.terastallized) {
    return ADAPTABILITY_STAB;
  }
  if (type !== unit.teraType) {
    return value;
  }
  return value >= TERA_SAME_TYPE_STAB ? TERA_ADAPTABILITY_STAB : ADAPTABILITY_STAB;
}

/** Whether Tera Blast lands as a physical move in this unit's hands, stages included */
function teraBlastPhysical(unit: Unit): boolean {
  return (
    unit.terastallized &&
    unit.resolveStat(Stats.Attack, StatFlags.Attack) >
      unit.resolveStat(Stats.SpecialAttack, StatFlags.Attack)
  );
}

function chooseTeraBlastCategory(attack: UnitAttackEvent): void {
  if (attack.move === Moves.TeraBlast && teraBlastPhysical(attack.source)) {
    attack.category = MoveCategories.Physical;
  }
}

export default function setupTerastalMechanics(battle: Battle): void {
  battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
    const unit = event.source;

    if (!unit.terastallized && !spent.has(unit.team) && canTerastallize(unit)) {
      terastallize(unit);
    }
  });

  // Nothing changes a Tera's type: Soak, Forest's Curse, Roost and a form change all leave it
  function holdType(event: { source: Unit; disabled: boolean }): void {
    if (event.source.terastallized && !retyping) {
      event.disabled = true;
    }
  }
  battle.on(BattleEvents.UnitAddType, EventPriority.Pre, holdType);
  battle.on(BattleEvents.UnitRemoveType, EventPriority.Pre, holdType);

  // A form change still changes the types its STAB is read from
  battle.on(BattleEvents.UnitSetSpecies, EventPriority.Post, (event) => {
    if (event.source.terastallized) {
      naturalTypes.set(event.source, [...getSpeciesData(event.species).types]);
    }
  });

  // At Post, ahead of Adaptability, which reads what this settles
  battle.on(BattleEvents.UnitAttackResolveSTAB, EventPriority.Post, (event) => {
    const source = event.parent.source;

    if (!source.terastallized) {
      return;
    }
    const type = event.parent.type;
    const own = naturalTypesOf(source).includes(type);

    if (type === source.teraType) {
      event.value = own ? TERA_SAME_TYPE_STAB : TERA_STAB;
    } else {
      event.value = own ? TERA_STAB : 1;
    }
  });

  battle.on(BattleEvents.CheckUnitMoveType, EventPriority.Post, (event) => {
    if (event.move === Moves.TeraBlast && event.source.terastallized) {
      event.type = event.source.teraType;
    }
  });

  battle.on(BattleEvents.UnitAttack, AttackPriority.Pre, (event) => {
    chooseTeraBlastCategory(event);
  });
  // The AI's estimate never fires UnitAttack, only the resolver
  battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Pre, (event) => {
    chooseTeraBlastCategory(event.parent);
  });

  battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
    const unit = event.source;

    if (
      event.power == null ||
      event.power <= 0 ||
      event.power >= TERA_POWER_FLOOR ||
      !unit.terastallized ||
      MULTI_HIT_MOVES[event.move] != null
    ) {
      return;
    }
    if (
      unit.checkMoveType(event.move, event.target) === unit.teraType &&
      unit.checkMovePriority(event.move, event.target) <= 0
    ) {
      event.power = TERA_POWER_FLOOR;
    }
  });
}
