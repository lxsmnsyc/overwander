import Npc from '../../data/ids/npcs';
import { createNpc } from '../create';

export default createNpc(Npc.Vendor, {
  name: 'Vendor',
  description: 'Sells from a market crate and buys near anything.',
  quote:
    'Step up, step up. I sell what is in the crate and buy near anything, long as your purse holds.',
  sprites: ['characters/frlg/shop-keeper'],
  shop: true,
  interact: async () => import('../shop'),
});
