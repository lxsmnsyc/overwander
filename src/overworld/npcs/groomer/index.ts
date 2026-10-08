import Npc from '../../../data/ids/npcs';
import { createNpc } from '../create';

export default createNpc(Npc.Groomer, {
  sprites: ['characters/frlg/daisy-oak', 'characters/lgpe/daisy-oak'],
  visit: 'groom',
  wanders: true,
  interact: async () => import('./interact'),
});
