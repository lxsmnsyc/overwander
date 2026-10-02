import Npc from '../../data/ids/npcs';
import { createNpc } from '../create';

export default createNpc(Npc.MoveTutor, {
  name: 'Move Tutor',
  description: 'Teaches a move a pokemon never grows into, for a Heart Scale.',
  quote: 'Some moves are taught, never grown into. One Heart Scale buys the lesson.',
  sprites: ['characters/frlg/gentleman', 'characters/lgpe/gentleman'],
  wanders: true,
  interact: async () => import('./interact'),
});
