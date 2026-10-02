import Npc from '../../data/ids/npcs';
import { createNpc } from '../create';

export default createNpc(Npc.DaycareLady, {
  name: 'Daycare Lady',
  description: 'Warms an egg along, halving the steps it has left, for a fee.',
  quote: 'Leave the egg with me a while, dear. Half of what it has left, gone like that.',
  spent: 'I have warmed one for you already, dear. Come back when I am next here.',
  sprites: ['characters/frlg/woman'],
  visit: 'daycare',
  wanders: true,
  interact: async () => import('./interact'),
});
