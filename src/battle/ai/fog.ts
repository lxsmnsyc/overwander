import { AttackPriority, EventPriority } from '../../core/event-emitter';
import Abilities from '../../data/ids/abilities';
import type { Items } from '../../data/ids/items';
import { Moves } from '../../data/ids/moves';
import type Battle from '../core';
import { BattleEvents } from '../events';
import type Unit from '../unit';

/**
 * What a unit has shown the field: abilities and items once they cue,
 * moves once cast. The AI reads a foe through this and nothing else
 */
interface Revealed {
  abilities: Set<Abilities>;
  items: Set<Items>;
  moves: Set<Moves>;
}

/** Abilities nobody has to see cue to know about: a raid boss is plainly one */
const ALWAYS_KNOWN = new Set<Abilities>([Abilities.Boss]);

/** Moves every unit carries, so knowing a foe has them gives nothing away */
const ALWAYS_CARRIED = new Set<Moves>([Moves.Attack, Moves.Struggle]);

const fogs = new WeakMap<Battle, Map<Unit, Revealed>>();

function revealedBy(battle: Battle, unit: Unit): Revealed {
  let shown = fogs.get(battle);

  if (shown == null) {
    shown = new Map();
    fogs.set(battle, shown);
  }

  let revealed = shown.get(unit);

  if (revealed == null) {
    revealed = { abilities: new Set(), items: new Set(), moves: new Set() };
    shown.set(unit, revealed);
  }
  return revealed;
}

/** Whether one unit sees another in full: its own side hides nothing */
export function seesFully(viewer: Unit, unit: Unit): boolean {
  return viewer.team.alliance === unit.team.alliance;
}

export function knowsAbility(viewer: Unit, unit: Unit, ability: Abilities): boolean {
  return (
    seesFully(viewer, unit) ||
    ALWAYS_KNOWN.has(ability) ||
    revealedBy(viewer.battle, unit).abilities.has(ability)
  );
}

export function knowsItem(viewer: Unit, unit: Unit, item: Items): boolean {
  return seesFully(viewer, unit) || revealedBy(viewer.battle, unit).items.has(item);
}

export function knowsMove(viewer: Unit, unit: Unit, move: Moves): boolean {
  return (
    seesFully(viewer, unit) ||
    ALWAYS_CARRIED.has(move) ||
    revealedBy(viewer.battle, unit).moves.has(move)
  );
}

/**
 * Keeps the AI from reading what a foe has not shown. While the AI
 * weighs a move, every hidden ability and item on another side reads as
 * absent, so the damage estimate, the immunity checks and the ratings
 * all see what a player watching the fight could see
 */
export default function setupFog(battle: Battle): void {
  const viewers: Unit[] = [];

  function viewer(): Unit | undefined {
    return viewers.at(-1);
  }

  battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Post, (event) => {
    revealedBy(battle, event.source).abilities.add(event.ability);
  });
  battle.on(BattleEvents.UnitTriggerItem, EventPriority.Post, (event) => {
    revealedBy(battle, event.source).items.add(event.item);
  });
  battle.on(BattleEvents.UnitCast, EventPriority.Post, (event) => {
    revealedBy(battle, event.source).moves.add(event.move);
  });

  for (const asked of [
    BattleEvents.CheckUnitAIMoveUsable,
    BattleEvents.CheckUnitAIMoveScore,
  ] as const) {
    battle.on(asked, AttackPriority.Prepare, (event) => {
      viewers.push(event.source);
    });
    // Cleanup runs even when a listener disables the event, so the
    // window cannot leak
    battle.on(asked, AttackPriority.Cleanup, () => {
      viewers.pop();
    });
  }

  battle.on(BattleEvents.CheckUnitAbility, EventPriority.Post, (event) => {
    const seer = viewer();

    if (event.enabled && seer != null && !knowsAbility(seer, event.source, event.ability)) {
      event.enabled = false;
    }
  });
  battle.on(BattleEvents.CheckUnitItem, EventPriority.Post, (event) => {
    const seer = viewer();

    if (event.enabled && seer != null && !knowsItem(seer, event.source, event.item)) {
      event.enabled = false;
    }
  });
}
