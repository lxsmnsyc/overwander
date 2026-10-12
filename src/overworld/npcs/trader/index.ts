import Npc from '../../../data/ids/npcs';
import { createNpc } from '../create';

export default createNpc(Npc.Trader, {
  sprites: [
    'characters/b2w2/backpacker-m',
    'characters/b2w2/backpacker-f',
    'characters/dppt/collector',
    'characters/oras/collector',
  ],
  visit: 'swap',
  wanders: true,
  interact: async () => import('./interact'),
});
