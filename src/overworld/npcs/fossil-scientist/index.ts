import Npc from '../../../data/ids/npcs';
import { createNpc } from '../create';

export default createNpc(Npc.FossilScientist, {
  sprites: ['characters/lgpe/scientist', 'characters/frlg/staff-member'],
  wanders: true,
  interact: async () => import('./interact'),
});
