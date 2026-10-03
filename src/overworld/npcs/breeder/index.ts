import Npc from '../../../data/ids/npcs';
import { createNpc } from '../create';

export default createNpc(Npc.Breeder, {
  name: 'Breeder',
  description: 'Breeds two compatible pokemon into an egg, for a fee.',
  quote: 'Two that get along, that is all I ask. I do the matching, you do the walking.',
  spent: 'That pair has done its part. Bring me another when I am next through.',
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
