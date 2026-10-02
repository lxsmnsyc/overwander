import Npc from '../../data/ids/npcs';
import { createNpc } from '../create';

export default createNpc(Npc.Trader, {
  name: 'Trader',
  description: 'Swaps one of six far-off pokemon for one of the same sort.',
  quote:
    'Brought these a long way. Any one of them for one of yours, as long as it is the same sort.',
  spent: 'One trade a stop. I will have new faces with me next time.',
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
