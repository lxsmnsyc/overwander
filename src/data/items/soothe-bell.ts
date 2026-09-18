import { ItemFlags, ItemTypes, Items } from '../ids/items';
import { registerItem } from './__create';

/**
 * The Soothe Bell: a pokemon that carries it warms to its trainer
 * twice as fast.
 *
 * Friendship is gained by levelling, by walking and by being fed a
 * berry, and a Luxury Ball already doubles all three for the pokemon
 * caught in one. The bell is the same bargain made after the catch,
 * for a pokemon caught in anything: it is what a player reaches for
 * when the evolution they want asks for a friendship they did not
 * start building at the ball.
 *
 * The two stack, which is the point of carrying one on a pokemon that
 * was already comfortable. The gains themselves are worked out in
 * [`src/data/constants/friendship.ts`](../constants/friendship.ts)
 */
export const SOOTHE_BELL_FACTOR = 2;

const SOOTHE_BELL_RESALE = 1000;

export default function registerSootheBell(): void {
  registerItem(Items.SootheBell, {
    name: 'Soothe Bell',
    description: 'Its holder warms to its trainer 2x as fast.',
    type: ItemTypes.Held,
    icon: 'other/soothe-bell',
    flags: ItemFlags.Holdable,
    buy: 0,
    sell: SOOTHE_BELL_RESALE,
  });
}
