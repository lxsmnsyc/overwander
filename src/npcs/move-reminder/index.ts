import Npc from '../../data/ids/npcs';
import { createNpc } from '../create';

export default createNpc(Npc.MoveReminder, {
  name: 'Move Reminder',
  description: 'Brings back a forgotten level-up move, for a Heart Scale.',
  quote: 'Forgotten? Hah. Nothing is ever forgotten. One Heart Scale and I will prove it.',
  sprites: ['characters/frlg/old-man'],
  wanders: true,
  interact: async () => import('./interact'),
});
