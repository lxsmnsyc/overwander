import Npc from '../../../data/ids/npcs';
import { createNpc } from '../create';

export default createNpc(Npc.FossilManiac, {
  sprites: ['characters/frlg/ruin-maniac', 'characters/lgpe/poke-maniac'],
  visit: 'fossil',
  wanders: true,
  interact: async () => import('./interact'),
});
