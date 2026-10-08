import Npc from '../../../data/ids/npcs';
import { createNpc } from '../create';

export default createNpc(Npc.HyperTrainer, {
  sprites: ['characters/b2w2/veteran', 'characters/dppt/expert', 'characters/oras/expert'],
  visit: 'hyper',
  wanders: true,
  interact: async () => import('./interact'),
});
