import Npc from '../../data/ids/npcs';
import { createNpc } from '../create';

export default createNpc(Npc.FossilScientist, {
  name: 'Fossil Scientist',
  description: 'Revives fossils into pokemon, free of charge.',
  quote: 'A fossil? Marvelous! Hand it over. It has waited in there long enough.',
  sprites: ['characters/lgpe/scientist', 'characters/frlg/staff-member'],
  wanders: true,
  interact: async () => import('./interact'),
});
