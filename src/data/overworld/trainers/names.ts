import { REGION_NAMES } from '../../species/regions';
import { TRAINER_CLASSES, TRAINER_REGIONS, TrainerClass } from './classes';

/**
 * What the mainline calls each of them. Two regions' worth of the
 * same trade share a name here; `TRAINER_NAMES` is what tells them
 * apart on a screen
 */
export const TRAINER_BASE_NAMES: Record<TrainerClass, string> = {
  [TrainerClass.AceTrainer]: 'Ace Trainer',
  [TrainerClass.Lass]: 'Lass',
  [TrainerClass.BlackBelt]: 'Black Belt',
  [TrainerClass.BirdKeeper]: 'Bird Keeper',
  [TrainerClass.Biker]: 'Biker',
  [TrainerClass.Hiker]: 'Hiker',
  [TrainerClass.PokeManiac]: 'Poké Maniac',
  [TrainerClass.BugCatcher]: 'Bug Catcher',
  [TrainerClass.Channeler]: 'Channeler',
  [TrainerClass.Burglar]: 'Burglar',
  [TrainerClass.Swimmer]: 'Swimmer',
  [TrainerClass.Rocker]: 'Rocker',
  [TrainerClass.Psychic]: 'Psychic',
  [TrainerClass.Sage]: 'Sage',
  [TrainerClass.Skier]: 'Skier',
  [TrainerClass.Scientist]: 'Scientist',
  [TrainerClass.JohtoPokeManiac]: 'Poké Maniac',
  [TrainerClass.JohtoBurglar]: 'Burglar',
  [TrainerClass.JohtoAceTrainer]: 'Ace Trainer',
  [TrainerClass.JohtoLass]: 'Lass',
  [TrainerClass.JohtoBlackBelt]: 'Black Belt',
  [TrainerClass.JohtoBirdKeeper]: 'Bird Keeper',
  [TrainerClass.JohtoBiker]: 'Biker',
  [TrainerClass.JohtoBugCatcher]: 'Bug Catcher',
  [TrainerClass.JohtoSwimmer]: 'Swimmer',
  [TrainerClass.Firebreather]: 'Firebreather',
  [TrainerClass.Medium]: 'Medium',
  [TrainerClass.Teacher]: 'Teacher',
  [TrainerClass.SchoolKid]: 'School Kid',
  [TrainerClass.Youngster]: 'Youngster',
  [TrainerClass.Camper]: 'Camper',
  [TrainerClass.Beauty]: 'Beauty',
  [TrainerClass.Fisherman]: 'Fisherman',
  [TrainerClass.Sailor]: 'Sailor',
  [TrainerClass.Gentleman]: 'Gentleman',
  [TrainerClass.SuperNerd]: 'Super Nerd',
  [TrainerClass.Juggler]: 'Juggler',
  [TrainerClass.Tamer]: 'Tamer',
  [TrainerClass.Engineer]: 'Engineer',
  [TrainerClass.Gambler]: 'Gambler',
  [TrainerClass.JohtoGentleman]: 'Gentleman',
  [TrainerClass.JohtoSuperNerd]: 'Super Nerd',
  [TrainerClass.JohtoJuggler]: 'Juggler',
  [TrainerClass.Boarder]: 'Boarder',
  [TrainerClass.NinjaBoy]: 'Ninja Boy',
  [TrainerClass.Tuber]: 'Tuber',
  [TrainerClass.PokeFan]: 'Poké Fan',
  [TrainerClass.HoennAceTrainer]: 'Ace Trainer',
  [TrainerClass.HoennLass]: 'Lass',
  [TrainerClass.HoennBirdKeeper]: 'Bird Keeper',
  [TrainerClass.HoennBugCatcher]: 'Bug Catcher',
  [TrainerClass.HoennSwimmer]: 'Swimmer',
  [TrainerClass.HoennYoungster]: 'Youngster',
  [TrainerClass.HoennSchoolKid]: 'School Kid',
  [TrainerClass.HoennCamper]: 'Camper',
  [TrainerClass.HoennBeauty]: 'Beauty',
  [TrainerClass.HoennFisherman]: 'Fisherman',
  [TrainerClass.HoennSailor]: 'Sailor',
  [TrainerClass.HoennGentleman]: 'Gentleman',
  [TrainerClass.HoennScientist]: 'Scientist',
  [TrainerClass.Guitarist]: 'Guitarist',
  [TrainerClass.Kindler]: 'Kindler',
  [TrainerClass.BattleGirl]: 'Battle Girl',
  [TrainerClass.Expert]: 'Expert',
  [TrainerClass.RuinManiac]: 'Ruin Maniac',
  [TrainerClass.StreetThug]: 'Street Thug',
  [TrainerClass.DragonTamer]: 'Dragon Tamer',
  [TrainerClass.AromaLady]: 'Aroma Lady',
  [TrainerClass.Ranger]: 'Pokémon Ranger',
  [TrainerClass.Worker]: 'Worker',
  [TrainerClass.Rancher]: 'Rancher',
  [TrainerClass.Cyclist]: 'Cyclist',
  [TrainerClass.PokeKid]: 'Poké Kid',
  [TrainerClass.Collector]: 'Collector',
  [TrainerClass.Artist]: 'Artist',
  [TrainerClass.Reporter]: 'Reporter',
  [TrainerClass.RichBoy]: 'Rich Boy',
  [TrainerClass.Waiter]: 'Waiter',
  [TrainerClass.ParasolLady]: 'Parasol Lady',
  [TrainerClass.Twins]: 'Twins',
  [TrainerClass.Policeman]: 'Policeman',
  [TrainerClass.Jogger]: 'Jogger',
  [TrainerClass.Breeder]: 'Pokémon Breeder',
  [TrainerClass.SinnohAceTrainer]: 'Ace Trainer',
  [TrainerClass.SinnohLass]: 'Lass',
  [TrainerClass.SinnohBugCatcher]: 'Bug Catcher',
  [TrainerClass.SinnohSwimmer]: 'Swimmer',
  [TrainerClass.SinnohYoungster]: 'Youngster',
  [TrainerClass.SinnohSchoolKid]: 'School Kid',
  [TrainerClass.SinnohCamper]: 'Camper',
  [TrainerClass.SinnohBeauty]: 'Beauty',
  [TrainerClass.SinnohFisherman]: 'Fisherman',
  [TrainerClass.SinnohSailor]: 'Sailor',
  [TrainerClass.SinnohGentleman]: 'Gentleman',
  [TrainerClass.SinnohScientist]: 'Scientist',
  [TrainerClass.SinnohBirdKeeper]: 'Bird Keeper',
  [TrainerClass.SinnohHiker]: 'Hiker',
  [TrainerClass.SinnohPsychic]: 'Psychic',
  [TrainerClass.SinnohSkier]: 'Skier',
  [TrainerClass.SinnohBlackBelt]: 'Black Belt',
  [TrainerClass.SinnohDragonTamer]: 'Dragon Tamer',
  [TrainerClass.SinnohGuitarist]: 'Guitarist',
  [TrainerClass.SinnohAromaLady]: 'Aroma Lady',
  [TrainerClass.SinnohRuinManiac]: 'Ruin Maniac',
  [TrainerClass.SinnohNinjaBoy]: 'Ninja Boy',
  [TrainerClass.SinnohTuber]: 'Tuber',
  [TrainerClass.SinnohPokeFan]: 'Poké Fan',
  [TrainerClass.SinnohRoughneck]: 'Roughneck',
  [TrainerClass.SinnohClown]: 'Clown',
  [TrainerClass.Couple]: 'Young Couple',
  [TrainerClass.HoennBreeder]: 'Pokémon Breeder',
  [TrainerClass.HoennRanger]: 'Pokémon Ranger',
  [TrainerClass.HoennCollector]: 'Collector',
  [TrainerClass.HoennReporter]: 'Reporter',
  [TrainerClass.HoennRichBoy]: 'Rich Boy',
  [TrainerClass.HoennParasolLady]: 'Parasol Lady',
  [TrainerClass.SinnohCouple]: 'Young Couple',
};

/**
 * What a screen calls each class: the mainline name, with the region
 * after it only where more than one region puts that name on the
 * road. A name nobody shares is the mainline's own
 */
export const TRAINER_NAMES: Record<TrainerClass, string> = buildTrainerNames();

function buildTrainerNames(): Record<TrainerClass, string> {
  const seen = new Set<string>();
  const shared = new Set<string>();

  for (const trainer of TRAINER_CLASSES) {
    const name = TRAINER_BASE_NAMES[trainer];

    if (seen.has(name)) {
      shared.add(name);
    }
    seen.add(name);
  }

  const named: Record<TrainerClass, string> = { ...TRAINER_BASE_NAMES };

  for (const trainer of TRAINER_CLASSES) {
    const name = TRAINER_BASE_NAMES[trainer];
    const region = REGION_NAMES[TRAINER_REGIONS[trainer]];

    if (shared.has(name)) {
      named[trainer] = `${name} (${region.slice(0, 1).toUpperCase()}${region.slice(1)})`;
    }
  }
  return named;
}
