import {
  DEFAULT_ITEM_SLOTS,
  DEFAULT_MOVE_SLOTS,
  Slots,
  mostSlots,
  packSlots,
  withSlots,
} from './slots';

/**
 * What a battle allows a unit to bring, as against what the pokemon
 * itself has room for.
 *
 * The two are different questions. `slots` is a property of the
 * individual — what it was born with and what has been spent on it —
 * and a limit is a property of the fight: a scenario may want every
 * pokemon down to one item however roomy their belts are, and another
 * may want two.
 *
 * They are packed identically, three bits a count, so the effective
 * room is the smaller of the two and nothing has to translate between
 * them. The limit is stored on the battle record for the same reason
 * the seed is: a fight replays as the fight it was, under the rules it
 * was fought under.
 */

/**
 * What a fight between players allows. It is the mainline's own
 * shape — one ability, one held item, four moves — and the number a
 * scenario is most likely to want to change
 */
export const PVP_BATTLE_LIMITS = packSlots(1, DEFAULT_ITEM_SLOTS, DEFAULT_MOVE_SLOTS);

/**
 * What a raid allows, which is everything. A raid is a party against
 * something enormous: whatever a player has managed to give their
 * pokemon is what they brought, and the boss itself carries more
 * abilities than any rule here would let it
 */
export const UNLIMITED_BATTLE_LIMITS = packSlots(
  mostSlots(Slots.Ability),
  mostSlots(Slots.Item),
  mostSlots(Slots.Move),
);

/**
 * And what a fight against the world allows, which is the same
 * everything.
 *
 * A trainer stop, a gym, a league seat and a Frontier house are fights
 * the game staged rather than fights two people agreed to, and both
 * sides are built for them: an expert's six are composed, priced and
 * handed two abilities and two items apiece. Holding that side to the
 * mainline's one of each threw away half of what was built, and it
 * threw away the player's belt with it, so a pokemon carrying a Sacred
 * Ash under a Leftovers walked in with only the Leftovers.
 *
 * Fights between players keep the mainline shape, since there the
 * limit is the fair part rather than the lost part
 */
export const NPC_BATTLE_LIMITS = UNLIMITED_BATTLE_LIMITS;

/**
 * The counts a host may set a fight to, which is the same range a
 * pokemon itself may have room for: `SLOT_LIMITS`. A host asking for
 * the top of every one is asking for a raid's rules in a fight between
 * two people
 */
export function withLimit(limits: number, kind: Slots, count: number): number {
  return withSlots(limits, kind, count);
}
