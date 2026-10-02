import Npc from '../../data/ids/npcs';
import { createNpc } from '../create';

export default createNpc(Npc.Channeler, {
  name: 'Channeler',
  description: 'Calls up one more ability in a pokemon, for a Heart Scale.',
  quote:
    'There is more in it than it knows. One Heart Scale and I will call it up. What answers is not mine to choose.',
  spent: 'I called up what I could. The rest will keep until I pass this way again.',
  sprites: ['characters/lgpe/channeler'],
  visit: 'channel',
  wanders: true,
  interact: async () => import('./interact'),
});
