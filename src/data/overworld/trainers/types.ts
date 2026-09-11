import { Types } from '../../constants/types';
import { TrainerClass } from './classes';

/**
 * What each class fields, as the types that count as theirs.
 *
 * Most bring one, some bring the pair the mainline gives them, and
 * the Aces bring an empty list, which is every type there is: that is
 * what makes them the hard fight of the road. Two trades may want the
 * same type, since what tells a Beauty from a Lass is who they are
 * rather than what they carry
 */
const TRAINER_TYPES: Record<TrainerClass, Types[]> = {
  [TrainerClass.AceTrainer]: [],
  [TrainerClass.Lass]: [Types.Normal],
  [TrainerClass.BlackBelt]: [Types.Fighting],
  [TrainerClass.BirdKeeper]: [Types.Flying],
  [TrainerClass.Biker]: [Types.Poison],
  [TrainerClass.Hiker]: [Types.Ground],
  [TrainerClass.PokeManiac]: [Types.Rock],
  [TrainerClass.BugCatcher]: [Types.Bug],
  [TrainerClass.Channeler]: [Types.Ghost],
  [TrainerClass.Burglar]: [Types.Fire],
  [TrainerClass.Swimmer]: [Types.Water],
  [TrainerClass.Rocker]: [Types.Electric],
  [TrainerClass.Psychic]: [Types.Psychic],
  [TrainerClass.Sage]: [Types.Grass],
  [TrainerClass.Skier]: [Types.Ice],
  [TrainerClass.Scientist]: [Types.Steel],
  // Johto's two answer the types Kanto has nobody for: the Den's
  // maniacs keep dragons, and its burglars work after dark
  [TrainerClass.JohtoPokeManiac]: [Types.Dragon],
  [TrainerClass.JohtoBurglar]: [Types.Dark],
  [TrainerClass.JohtoAceTrainer]: [],
  [TrainerClass.JohtoLass]: [Types.Normal],
  [TrainerClass.JohtoBlackBelt]: [Types.Fighting],
  [TrainerClass.JohtoBirdKeeper]: [Types.Flying],
  [TrainerClass.JohtoBiker]: [Types.Poison],
  [TrainerClass.JohtoBugCatcher]: [Types.Bug],
  [TrainerClass.JohtoSwimmer]: [Types.Water],
  [TrainerClass.Firebreather]: [Types.Fire],
  [TrainerClass.Medium]: [Types.Ghost],
  [TrainerClass.Teacher]: [Types.Psychic],
  [TrainerClass.SchoolKid]: [Types.Electric],
  [TrainerClass.Youngster]: [Types.Ground],
  [TrainerClass.Camper]: [Types.Rock],
  // A type may be fielded by more than one trade: the mainline's
  // classes overlap, and what tells a Beauty from a Lass is who they
  // are rather than what they bring
  [TrainerClass.Beauty]: [Types.Normal, Types.Water],
  [TrainerClass.Fisherman]: [Types.Water],
  [TrainerClass.Sailor]: [Types.Water, Types.Fighting],
  [TrainerClass.Gentleman]: [Types.Fire, Types.Electric],
  [TrainerClass.SuperNerd]: [Types.Poison, Types.Electric],
  [TrainerClass.Juggler]: [Types.Psychic],
  [TrainerClass.Tamer]: [Types.Ground, Types.Poison],
  // Kanto's one steel line, which is a Magneton and nothing else
  [TrainerClass.Engineer]: [Types.Steel, Types.Electric],
  [TrainerClass.Gambler]: [Types.Normal, Types.Fire],
  [TrainerClass.JohtoGentleman]: [Types.Fire, Types.Electric],
  [TrainerClass.JohtoSuperNerd]: [Types.Poison, Types.Electric],
  [TrainerClass.JohtoJuggler]: [Types.Psychic],
  [TrainerClass.Boarder]: [Types.Ice],
  // Hoenn's own three: the ninja keeps what hides, the tuber what
  // the sea keeps cold, and the fan whatever is worth a photograph
  [TrainerClass.NinjaBoy]: [Types.Poison, Types.Ghost],
  [TrainerClass.Tuber]: [Types.Water, Types.Ice],
  [TrainerClass.PokeFan]: [Types.Normal, Types.Electric],
  [TrainerClass.HoennAceTrainer]: [],
  [TrainerClass.HoennLass]: [Types.Normal],
  [TrainerClass.HoennBirdKeeper]: [Types.Flying],
  [TrainerClass.HoennBugCatcher]: [Types.Bug],
  [TrainerClass.HoennSwimmer]: [Types.Water],
  [TrainerClass.HoennYoungster]: [Types.Ground],
  [TrainerClass.HoennSchoolKid]: [Types.Electric],
  [TrainerClass.HoennCamper]: [Types.Rock],
  [TrainerClass.HoennBeauty]: [Types.Normal, Types.Water],
  [TrainerClass.HoennFisherman]: [Types.Water],
  [TrainerClass.HoennSailor]: [Types.Water, Types.Fighting],
  [TrainerClass.HoennGentleman]: [Types.Fire, Types.Electric],
  // Devon's researchers, who are where Hoenn's steel is made
  [TrainerClass.HoennScientist]: [Types.Steel],
  [TrainerClass.Guitarist]: [Types.Electric],
  [TrainerClass.Kindler]: [Types.Fire],
  [TrainerClass.BattleGirl]: [Types.Fighting],
  // Hoenn has nobody who only reads minds, and its old masters
  // field the Medicham that is both
  [TrainerClass.Expert]: [Types.Psychic, Types.Fighting],
  [TrainerClass.RuinManiac]: [Types.Rock, Types.Ground],
  [TrainerClass.StreetThug]: [Types.Dark],
  [TrainerClass.DragonTamer]: [Types.Dragon],
  [TrainerClass.AromaLady]: [Types.Grass],
  // Sinnoh's own fifteen, which are the trades nobody had before it:
  // the ranger who keeps the country, the worker out of the tunnel
  // under the mountain, and the rest of the road it fills
  [TrainerClass.Ranger]: [Types.Grass, Types.Bug],
  [TrainerClass.Worker]: [Types.Rock, Types.Steel],
  [TrainerClass.Rancher]: [Types.Normal, Types.Ground],
  [TrainerClass.Cyclist]: [Types.Electric],
  [TrainerClass.PokeKid]: [Types.Normal],
  [TrainerClass.Collector]: [Types.Rock, Types.Ghost],
  [TrainerClass.Artist]: [Types.Normal],
  [TrainerClass.Reporter]: [Types.Normal, Types.Electric],
  [TrainerClass.RichBoy]: [Types.Normal, Types.Flying],
  [TrainerClass.Waiter]: [Types.Normal, Types.Fire],
  [TrainerClass.ParasolLady]: [Types.Water],
  [TrainerClass.Twins]: [Types.Normal, Types.Psychic],
  [TrainerClass.Policeman]: [Types.Fire, Types.Dark],
  [TrainerClass.Jogger]: [Types.Normal, Types.Fighting],
  [TrainerClass.Breeder]: [Types.Normal, Types.Grass],
  // And its own of the trades already on the road
  [TrainerClass.SinnohAceTrainer]: [],
  [TrainerClass.SinnohLass]: [Types.Normal],
  [TrainerClass.SinnohBugCatcher]: [Types.Bug],
  [TrainerClass.SinnohSwimmer]: [Types.Water],
  [TrainerClass.SinnohYoungster]: [Types.Ground],
  [TrainerClass.SinnohSchoolKid]: [Types.Electric],
  [TrainerClass.SinnohCamper]: [Types.Rock],
  [TrainerClass.SinnohBeauty]: [Types.Normal, Types.Water],
  [TrainerClass.SinnohFisherman]: [Types.Water],
  [TrainerClass.SinnohSailor]: [Types.Water, Types.Fighting],
  [TrainerClass.SinnohGentleman]: [Types.Fire, Types.Electric],
  [TrainerClass.SinnohScientist]: [Types.Steel],
  [TrainerClass.SinnohBirdKeeper]: [Types.Flying],
  [TrainerClass.SinnohHiker]: [Types.Ground],
  [TrainerClass.SinnohPsychic]: [Types.Psychic],
  [TrainerClass.SinnohSkier]: [Types.Ice],
  [TrainerClass.SinnohBlackBelt]: [Types.Fighting],
  [TrainerClass.SinnohDragonTamer]: [Types.Dragon],
  [TrainerClass.SinnohGuitarist]: [Types.Electric],
  [TrainerClass.SinnohAromaLady]: [Types.Grass],
  [TrainerClass.SinnohRuinManiac]: [Types.Rock, Types.Ground],
  [TrainerClass.SinnohNinjaBoy]: [Types.Poison, Types.Ghost],
  [TrainerClass.SinnohTuber]: [Types.Water, Types.Ice],
  [TrainerClass.SinnohPokeFan]: [Types.Normal, Types.Electric],
  [TrainerClass.SinnohRoughneck]: [Types.Poison],
  [TrainerClass.SinnohClown]: [Types.Psychic],
  // The couple field what a pair of them would: Hoenn's Volbeat and
  // Illumise, and the Ralts line both regions grow
  [TrainerClass.Couple]: [Types.Bug, Types.Psychic],
  [TrainerClass.HoennBreeder]: [Types.Normal, Types.Grass],
  [TrainerClass.HoennRanger]: [Types.Grass, Types.Bug],
  [TrainerClass.HoennCollector]: [Types.Rock, Types.Ghost],
  [TrainerClass.HoennReporter]: [Types.Normal, Types.Electric],
  [TrainerClass.HoennRichBoy]: [Types.Normal, Types.Flying],
  [TrainerClass.HoennParasolLady]: [Types.Water],
  [TrainerClass.SinnohCouple]: [Types.Bug, Types.Psychic],
};

export default TRAINER_TYPES;
