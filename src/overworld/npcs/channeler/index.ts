import Npc from '../../../data/ids/npcs';
import { createNpc } from '../create';

export default createNpc(Npc.Channeler, {
  sprites: ['characters/lgpe/channeler'],
  visit: 'channel',
  wanders: true,
  interact: async () => import('./interact'),
});
