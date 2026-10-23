import Npc from '../../../data/ids/npcs';
import { createNpc } from '../create';

export default createNpc(Npc.NurseJoy, {
  sprites: ['characters/extra/nurse', 'characters/dppt/nurse', 'characters/b2w2/nurse'],
  interact: async () => import('./interact'),
});
