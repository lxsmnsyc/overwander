import Npc from '../../../data/ids/npcs';
import { createNpc } from '../create';

export default createNpc(Npc.MoveTutor, {
  sprites: ['characters/frlg/gentleman', 'characters/lgpe/gentleman'],
  wanders: true,
  interact: async () => import('./interact'),
});
