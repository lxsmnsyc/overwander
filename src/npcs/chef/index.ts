import Npc from '../../data/ids/npcs';
import { createNpc } from '../create';

export default createNpc(Npc.Chef, {
  name: 'Chef',
  description: 'Sells drinks and treats, and buys near anything.',
  quote: 'Fresh off the stove and out of the icebox. Your pokemon carries it, it eats well.',
  sprites: ['characters/frlg/chef'],
  wanders: true,
  shop: true,
  interact: async () => import('../shop'),
});
