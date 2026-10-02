import Npc from '../../data/ids/npcs';
import { createNpc } from '../create';

/** Met through a challenge rather than a conversation, which says this line too */
export default createNpc(Npc.Trainer, {
  name: 'Trainer',
  description: 'Offers a fair duel, with a purse to the winner.',
  quote: 'You look strong. Prove it. Three of the local best, purse to the winner.',
  sprites: [
    'characters/frlg/ace-trainer-f',
    'characters/frlg/ace-trainer-m',
    'characters/lgpe/ace-trainer',
  ],
});
