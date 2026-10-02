import Npc from '../../data/ids/npcs';
import { createNpc } from '../create';

export default createNpc(Npc.Groomer, {
  name: 'Groomer',
  description: 'Grooms a pokemon so it thinks more of its trainer, for a fee.',
  quote: 'One good brushing and it will think the world of you. Shadows? Out of my hands.',
  spent: 'One brushing a visit, that is my rule. Catch me next time.',
  sprites: ['characters/frlg/daisy-oak', 'characters/lgpe/daisy-oak'],
  visit: 'groom',
  wanders: true,
  interact: async () => import('./interact'),
});
