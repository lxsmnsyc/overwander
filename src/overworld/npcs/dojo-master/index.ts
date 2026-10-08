import Npc from '../../../data/ids/npcs';
import { createNpc } from '../create';

export default createNpc(Npc.DojoMaster, {
  sprites: [
    'characters/lgpe/black-belt',
    'characters/hgss/black-belt',
    'characters/dppt/black-belt',
    'characters/b2w2/black-belt',
  ],
  wanders: true,
  interact: async () => import('./interact'),
});
