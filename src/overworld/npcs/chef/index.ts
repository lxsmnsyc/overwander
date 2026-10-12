import Npc from '../../../data/ids/npcs';
import { createNpc } from '../create';

export default createNpc(Npc.Chef, {
  sprites: ['characters/frlg/chef'],
  wanders: true,
  shop: true,
  interact: async () => import('../shop'),
});
