import Npc from '../../../data/ids/npcs';
import { createNpc } from '../create';

export default createNpc(Npc.MoveReminder, {
  sprites: ['characters/frlg/old-man', 'characters/oras/man', 'characters/oras/man-2'],
  wanders: true,
  interact: async () => import('./interact'),
});
