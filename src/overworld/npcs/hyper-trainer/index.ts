import Npc from '../../../data/ids/npcs';
import { createNpc } from '../create';

export default createNpc(Npc.HyperTrainer, {
  name: 'Hyper Trainer',
  description: 'Trains one of a pokemon’s values to the top, for gold by the point.',
  quote:
    'Good is not the same as the best. Show me one and pick the stat, and I will take it all the way. It will cost you.',
  spent: 'One a visit. Bring me the next one when I am back.',
  sprites: ['characters/b2w2/veteran', 'characters/dppt/expert', 'characters/oras/expert'],
  visit: 'hyper',
  wanders: true,
  interact: async () => import('./interact'),
});
