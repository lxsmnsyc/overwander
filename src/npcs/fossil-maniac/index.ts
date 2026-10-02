import Npc from '../../data/ids/npcs';
import { createNpc } from '../create';

export default createNpc(Npc.FossilManiac, {
  name: 'Fossil Maniac',
  description: 'Sells one of the two fossils he carries.',
  quote: 'Dug these up myself! Two beauties, and I will part with one. Just one, mind.',
  spent: 'That was my one to spare. I will have dug up more next time.',
  sprites: ['characters/frlg/ruin-maniac', 'characters/lgpe/poke-maniac'],
  visit: 'fossil',
  wanders: true,
  interact: async () => import('./interact'),
});
