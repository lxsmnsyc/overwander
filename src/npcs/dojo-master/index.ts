import Npc from '../../data/ids/npcs';
import { createNpc } from '../create';

export default createNpc(Npc.DojoMaster, {
  name: 'Dojo Master',
  description: 'Trains a pokemon to hold one more move, for a Heart Scale.',
  quote:
    'A pokemon can carry more than it thinks. One Heart Scale and I will make room for another move.',
  sprites: [
    'characters/lgpe/black-belt',
    'characters/hgss/black-belt',
    'characters/dppt/black-belt',
    'characters/b2w2/black-belt',
  ],
  wanders: true,
  interact: async () => import('./interact'),
});
