import Npc from '../../../data/ids/npcs';
import { createNpc } from '../create';

export default createNpc(Npc.Kurt, {
  name: 'Kurt',
  description: 'Carves apricorns into balls, free of charge.',
  quote:
    'Apricorns, is it? Hand them over. One ball for each, and the colour decides which. No charge, you did the picking.',
  sprites: ['characters/hgss/kurt'],
  wanders: true,
  interact: async () => import('./interact'),
});
