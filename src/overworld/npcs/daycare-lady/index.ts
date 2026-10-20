import Npc from '../../../data/ids/npcs';
import { createNpc } from '../create';

export default createNpc(Npc.DaycareLady, {
  sprites: ['characters/frlg/woman', 'characters/oras/mom', 'characters/b2w2/mom'],
  visit: 'daycare',
  wanders: true,
  interact: async () => import('./interact'),
});
