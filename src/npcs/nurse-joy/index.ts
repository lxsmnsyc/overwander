import Npc from '../../data/ids/npcs';
import { createNpc } from '../create';

export default createNpc(Npc.NurseJoy, {
  name: 'Nurse Joy',
  description: 'Heals a party for free, as often as asked.',
  quote: 'Oh, hand them over, all of them. No charge. The counter is always open.',
  sprites: ['characters/extra/nurse'],
  interact: async () => import('./interact'),
});
