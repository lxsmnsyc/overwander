import { DEFAULT_ITEM_SLOTS, DEFAULT_MOVE_SLOTS, MAX_SLOTS, packSlots } from './slots';

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
export const UNLIMITED_BATTLE_LIMITS = packSlots(MAX_SLOTS, MAX_SLOTS, MAX_SLOTS);
