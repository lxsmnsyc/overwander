import Npc from '../../data/ids/npcs';
import { createNpc } from '../create';

export default createNpc(Npc.Geologist, {
  name: 'Geologist',
  description: 'Sells stones and gems, and buys near anything.',
  quote:
    'Every one of these came out of a hillside with my own pick. Stones, gems, the lot. Take your pick of mine.',
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
