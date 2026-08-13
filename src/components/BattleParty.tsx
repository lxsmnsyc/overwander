import {
  type Accessor,
  For,
  type JSX,
  type Setter,
  batch,
  createSignal,
  onCleanup,
  onMount,
} from 'solid-js';
import type Battle from '../battle/core';
import { BattleEvents } from '../battle/events';
import Unit from '../battle/unit';
import { type BaseEvent, EventPriority } from '../core/event-emitter';
import UnitCard from './UnitCard';

/**
 * The player's own pokemon, as a row of cards over the field.
 *
 * Their **own**, and nobody else's. A raid puts thirty pokemon on the
 * player's side of the field and a card for each is a wall of them —
 * and twenty-nine of those cards are about somebody else's cooldowns,
 * which the player can do nothing with. A spectator, who owns none of
 * it, gets no cards at all.
 *
 * Nothing here is a control. A real-time battle is fought by the
 * engine's own AI; what a player needs from the bottom of the screen
 * is to know how their own side is doing, not a menu.
 */

/**
 * Everything that changes what one card shows: health, statuses, and
 * the cooldowns the move boxes are drawn from. It is deliberately
 * shorter than the list a full readout needs — a card says nothing
 * about stages, abilities or held items, so it does not redraw for
 * them
 */
const CARD_EVENTS = [
  BattleEvents.UnitSetHealth,
  BattleEvents.UnitSetMaxHealth,
  BattleEvents.UnitSetStat,
  BattleEvents.UnitDamage,
  BattleEvents.UnitHeal,
  BattleEvents.UnitCure,
  BattleEvents.UnitFaints,
  BattleEvents.UnitAddStatus,
  BattleEvents.UnitRemoveStatus,
  BattleEvents.UnitUpdateStatusTimer,
  BattleEvents.UnitAddMove,
  BattleEvents.UnitRemoveMove,
  BattleEvents.UnitEnableMove,
  BattleEvents.UnitDisableMove,
  BattleEvents.UnitStartCooldown,
  BattleEvents.UnitUpdateCooldown,
  BattleEvents.UnitFinishCooldown,
  // What it is winding up, and how far along it is. These tick as
  // often as the cooldowns do, and without them the bar for the move
  // being cast would appear, sit still and vanish
  BattleEvents.UnitCast,
  BattleEvents.UnitUpdateCast,
  BattleEvents.UnitFinishCast,
  BattleEvents.UnitStopCast,
  BattleEvents.UnitChannel,
  BattleEvents.UnitUpdateChannel,
  BattleEvents.UnitFinishChannel,
  BattleEvents.UnitStopChannel,
  BattleEvents.UnitSetLevel,
  BattleEvents.UnitSetSpecies,
  BattleEvents.UnitSetAppearance,
] as const;

/**
 * Everything that changes **who** is on the card row
 */
const ROSTER_EVENTS = [
  BattleEvents.UnitCreated,
  BattleEvents.UnitEntersField,
  BattleEvents.UnitLeavesField,
  BattleEvents.UnitSwitch,
  BattleEvents.TeamAddUnit,
  BattleEvents.TeamRemoveUnit,
  BattleEvents.AllianceAddTeam,
  BattleEvents.AllianceRemoveTeam,
  BattleEvents.AddAlliance,
  BattleEvents.RemoveAlliance,
] as const;

/**
 * The units an event concerns: the one that acted, and the one it
 * landed on when there is one
 */
function unitsOf(event: BaseEvent): Unit[] {
  const units: Unit[] = [];

  if ('source' in event && event.source instanceof Unit) {
    units.push(event.source);
  }
  if ('target' in event && event.target instanceof Unit) {
    units.push(event.target);
  }
  return units;
}

export interface BattlePartyProps {
  battle: Battle;
  /**
   * Whose pokemon to show. A spectator owns nothing on the field and
   * is shown nothing: they are watching somebody else's fight, and
   * somebody else's cooldowns are not information
   */
  player: string;
  /**
   * Show the **other** side instead. It is for a fight between two
   * players, where what the opponent is holding and how close their
   * moves are to coming back is half of what there is to read — and
   * for nothing else: a raid boss has no cards worth showing, and
   * thirty strangers' parties are not information
   */
  theirs?: boolean;
}

/**
 * The units the row is about: this player's own, or — asked the other
 * way round — everybody else's.
 *
 * The order is the roster's, which is the order the canvas lays the
 * row out in, so a card sits under the pokemon it belongs to. A
 * switch rewrites the roster and the row is read again, so the cards
 * move with the sprites rather than staying where they started
 */
function readParty(battle: Battle, player: string, theirs: boolean): Unit[] {
  if (player === '') {
    return [];
  }

  const units: Unit[] = [];

  for (const alliance of battle.alliances) {
    for (const team of alliance.teams) {
      if ((team.player === player) !== theirs) {
        units.push(...team.units);
      }
    }
  }
  return units;
}

export default function BattleParty(props: BattlePartyProps): JSX.Element {
  const [party, setParty] = createSignal<Unit[]>(
    readParty(props.battle, props.player, props.theirs === true),
  );

  /**
   * One revision per unit, so a hit on one pokemon redraws one card.
   * Cards register their own signal the first time they read it
   */
  const revisions = new Map<Unit, [Accessor<number>, Setter<number>]>();

  const revisionOf = (unit: Unit): Accessor<number> => {
    let entry = revisions.get(unit);

    if (entry == null) {
      entry = createSignal(0);
      revisions.set(unit, entry);
    }
    return entry[0];
  };

  onMount(() => {
    /**
     * The battle this row hung its listeners on, held rather than
     * re-read.
     *
     * Cleanup must not touch props. This one did, and it is what made
     * leaving a battle look like a button that did nothing: the view
     * above passes `instance().battle`, leaving clears `instance`, and
     * the disposal that follows read the prop again and found null.
     * The `TypeError` was thrown **inside** Solid's `cleanNode`, so the
     * teardown stopped half-done and the battle stayed on screen —
     * which is exactly the shape of "Leave does nothing".
     *
     * A component being disposed is being disposed whatever its props
     * say by then. What it has to undo is what it actually did, so
     * that is what is kept
     */
    const battle = props.battle;

    const onCardEvent = (event: BaseEvent): void => {
      batch(() => {
        for (const unit of unitsOf(event)) {
          revisions.get(unit)?.[1]((value) => value + 1);
        }
      });
    };

    const onRosterEvent = (): void => {
      setParty(readParty(battle, props.player, props.theirs === true));
    };

    for (const event of CARD_EVENTS) {
      battle.on(event, EventPriority.Post, onCardEvent);
    }
    for (const event of ROSTER_EVENTS) {
      battle.on(event, EventPriority.Post, onRosterEvent);
    }

    onCleanup(() => {
      for (const event of CARD_EVENTS) {
        battle.off(event, EventPriority.Post, onCardEvent);
      }
      for (const event of ROSTER_EVENTS) {
        battle.off(event, EventPriority.Post, onRosterEvent);
      }
    });
  });

  return (
    // `flex-row` said out loud: the stylesheet lays every list out as
    // a column, so a row of cards that only asks for `flex` gets a
    // column of them stacked down the right-hand edge
    <ul
      // Named, because there are two of these rows in a fight between
      // two trainers and they are otherwise the same list twice
      aria-label={props.theirs === true ? 'The other side' : 'Your party'}
      // `items-stretch` rather than `items-end`: a card carries a row
      // of status squares only while it has a status, so a party
      // where one pokemon is poisoned drew one tall card and five
      // short ones. Stretched, every card in the row is as tall as
      // the tallest and the moves line up across the party
      class="m-0 flex list-none flex-row flex-wrap items-stretch justify-center gap-2 p-0"
    >
      <For each={party()}>{(unit) => <UnitCard unit={unit} revision={revisionOf(unit)} />}</For>
    </ul>
  );
}
