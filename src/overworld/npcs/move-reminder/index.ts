import Npc from '../../../data/ids/npcs';
import { createNpc } from '../create';

export default createNpc(Npc.MoveReminder, {
  sprites: ['characters/frlg/old-man'],
  wanders: true,
  interact: async () => import('./interact'),
});
