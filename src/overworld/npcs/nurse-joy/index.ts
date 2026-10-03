import Npc from '../../../data/ids/npcs';
import { createNpc } from '../create';

export default createNpc(Npc.NurseJoy, {
  sprites: ['characters/extra/nurse'],
  interact: async () => import('./interact'),
});
