import Npc from '../../../data/ids/npcs';
import { createNpc } from '../create';

export default createNpc(Npc.Breeder, {
  sprites: [
    'characters/frlg/camper-f',
    'characters/lgpe/picnicker',
    'characters/dppt/breeder-f',
    'characters/dppt/breeder-m',
    'characters/oras/breeder-f',
    'characters/oras/breeder-m',
    'characters/b2w2/breeder-f',
    'characters/b2w2/breeder-m',
  ],
  visit: 'breed',
  wanders: true,
  interact: async () => import('./interact'),
});
