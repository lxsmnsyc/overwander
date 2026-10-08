import Npc from '../../../data/ids/npcs';
import { createNpc } from '../create';

export default createNpc(Npc.DaycareLady, {
  sprites: ['characters/frlg/woman'],
  visit: 'daycare',
  wanders: true,
  interact: async () => import('./interact'),
});
