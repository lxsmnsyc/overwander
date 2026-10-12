import Npc from '../../../data/ids/npcs';
import { createNpc } from '../create';

/** Met through a challenge rather than a conversation, which says this line too */
export default createNpc(Npc.RocketGrunt, {
  sprites: ['characters/hgss/rocket-f', 'characters/hgss/rocket-m'],
});
