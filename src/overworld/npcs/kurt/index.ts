import Npc from '../../../data/ids/npcs';
import { createNpc } from '../create';

export default createNpc(Npc.Kurt, {
  sprites: ['characters/hgss/kurt'],
  wanders: true,
  interact: async () => import('./interact'),
});
