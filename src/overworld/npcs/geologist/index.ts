import Npc from '../../../data/ids/npcs';
import { createNpc } from '../create';

export default createNpc(Npc.Geologist, {
  sprites: [
    'characters/frlg/hiker',
    'characters/lgpe/hiker',
    'characters/dppt/hiker',
    'characters/b2w2/hiker',
  ],
  wanders: true,
  shop: true,
  interact: async () => import('../shop'),
});
