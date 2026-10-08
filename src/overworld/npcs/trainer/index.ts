import Npc from '../../../data/ids/npcs';
import { createNpc } from '../create';

/** Met through a challenge rather than a conversation, which says this line too */
export default createNpc(Npc.Trainer, {
  sprites: [
    'characters/frlg/ace-trainer-f',
    'characters/frlg/ace-trainer-m',
    'characters/lgpe/ace-trainer',
  ],
});
