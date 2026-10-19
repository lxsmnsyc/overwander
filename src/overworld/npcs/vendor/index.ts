import Npc from '../../../data/ids/npcs';
import { createNpc } from '../create';

export default createNpc(Npc.Vendor, {
  sprites: ['characters/frlg/shop-keeper'],
  shop: true,
  interact: async () => import('../shop'),
});
