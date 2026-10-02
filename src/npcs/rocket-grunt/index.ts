import Npc from '../../data/ids/npcs';
import { createNpc } from '../create';

/** Met through a challenge rather than a conversation, which says this line too */
export default createNpc(Npc.RocketGrunt, {
  name: 'Team Rocket Grunt',
  description: 'Bars the way with shadows, and pays out when beaten.',
  quote: 'Wrong path, kid. Three of mine say so.',
  sprites: ['characters/hgss/rocket-f', 'characters/hgss/rocket-m'],
});
