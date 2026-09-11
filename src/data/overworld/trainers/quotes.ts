import { TrainerClass } from './classes';

/** What each says as the duel is put to the player */
const TRAINER_QUOTES: Record<TrainerClass, string> = {
  [TrainerClass.AceTrainer]: 'I only travel with the best. Let us see what you travel with.',
  [TrainerClass.Lass]: 'Hi! Do you want to battle? I have been practising.',
  [TrainerClass.BlackBelt]: 'My pokemon train as hard as I do. Try them.',
  [TrainerClass.BirdKeeper]: 'My birds have been circling you since you came into view.',
  [TrainerClass.Biker]: 'Nice road. It is ours. Fight us for it.',
  [TrainerClass.Hiker]: 'I walked up here. You can walk through me.',
  [TrainerClass.PokeManiac]: 'You have not seen a rock type until you have seen mine!',
  [TrainerClass.BugCatcher]: 'I caught every one of these myself. Every single one!',
  [TrainerClass.Channeler]: 'Something is standing behind you. It is mine.',
  [TrainerClass.Burglar]: 'I take what I want. Today I want your win streak.',
  [TrainerClass.Swimmer]: 'I swam here. Fighting you is the easy part.',
  [TrainerClass.Rocker]: 'Turn it up! My pokemon like it loud and shocking.',
  [TrainerClass.Psychic]: 'You will decide to battle me. I have already seen it.',
  [TrainerClass.Sage]: 'The tower teaches patience. My pokemon have more of it than you.',
  [TrainerClass.Skier]: 'I came down this slope faster than you can think. Keep up.',
  [TrainerClass.Scientist]: 'My pokemon are steel. Yours are, at best, interesting data.',
  [TrainerClass.JohtoPokeManiac]:
    'I have raised dragons since I could walk. Show me what you raised.',
  [TrainerClass.JohtoBurglar]: 'Nothing good happens on this road after dark. I am the reason.',
  [TrainerClass.JohtoAceTrainer]: 'I have walked both regions. You have walked into me.',
  [TrainerClass.JohtoLass]: 'Everyone back home says I am the best. Let us find out!',
  [TrainerClass.JohtoBlackBelt]: 'I train at the falls under Chuck. You will feel it.',
  [TrainerClass.JohtoBirdKeeper]: 'My birds fly the whole coast. Yours have seen one road.',
  [TrainerClass.JohtoBiker]: 'We ride these roads at night. Move or fight.',
  [TrainerClass.JohtoBugCatcher]:
    'The contest is over but I never stopped catching. Look at these!',
  [TrainerClass.JohtoSwimmer]: 'The water is colder here. It has not slowed me down.',
  [TrainerClass.Firebreather]: 'I breathe fire for a living. My pokemon do it better.',
  [TrainerClass.Medium]: 'The dead are chatty tonight. They are all saying your name.',
  [TrainerClass.Teacher]: 'Class is in session. Today’s lesson is losing gracefully.',
  [TrainerClass.SchoolKid]: 'I did the maths on this battle. You will not like the answer.',
  [TrainerClass.Youngster]: 'I have been digging in the dirt since sunrise. Look what came up!',
  [TrainerClass.Camper]: 'Been up this mountain three days. Found rocks. Found these.',
  [TrainerClass.Beauty]: 'You are staring. Battle me instead, it is less rude.',
  [TrainerClass.Fisherman]: 'I have been sat here since dawn. Something finally bit.',
  [TrainerClass.Sailor]: 'I have hauled rope in worse weather than you have walked in.',
  [TrainerClass.Gentleman]: 'A wager, then? No? A battle will do just as well.',
  [TrainerClass.SuperNerd]: 'I have read every paper on this. You have read none of them.',
  [TrainerClass.Juggler]: 'Keep your eyes on the balls. That was the trick, and you looked away.',
  [TrainerClass.Tamer]: 'Mine do as they are told. Let us see about yours.',
  [TrainerClass.Engineer]: 'I built half the machines on this road. Meet the rest.',
  [TrainerClass.Gambler]: 'Double or nothing on this one. You do not get a say.',
  [TrainerClass.JohtoGentleman]: 'I keep a house in Goldenrod and a temper on the road.',
  [TrainerClass.JohtoSuperNerd]: 'My notes say you lose in four minutes. Let us test that.',
  [TrainerClass.JohtoJuggler]: 'Six in the air, and not one of them dropped. Watch this.',
  [TrainerClass.Boarder]: 'I came down that face sideways. Standing still is the hard part.',
  [TrainerClass.NinjaBoy]: 'You walked past me twice. My pokemon did not move either time.',
  [TrainerClass.Tuber]: 'I am not getting out of the water. Battle me from the shore!',
  [TrainerClass.PokeFan]: 'I have a photograph of every one of these. Would you like to be in one?',
  [TrainerClass.HoennAceTrainer]:
    'I have crossed this region on foot. Nothing on the road has surprised me yet.',
  [TrainerClass.HoennLass]:
    'Mum said not to talk to strangers. She said nothing about battling them.',
  [TrainerClass.HoennBirdKeeper]:
    'Mine ride the sea wind. Yours have only felt the one off the road.',
  [TrainerClass.HoennBugCatcher]: 'The woods here are thick with them. I took the best three.',
  [TrainerClass.HoennSwimmer]: 'The current out here does half the work. The rest of it is mine.',
  [TrainerClass.HoennYoungster]:
    'I dug this one out from under the ash. I bet you have never seen one.',
  [TrainerClass.HoennSchoolKid]: 'We are testing conductivity today. You are the experiment.',
  [TrainerClass.HoennCamper]:
    'Three nights on this rock and the only thing I have missed is a battle.',
  [TrainerClass.HoennBeauty]: 'The sea air keeps them glossy. Do not let that fool you.',
  [TrainerClass.HoennFisherman]: 'Cast since dawn and caught nothing. You will do.',
  [TrainerClass.HoennSailor]: 'I have crossed to Slateport in worse weather than this. Try me.',
  [TrainerClass.HoennGentleman]: 'I keep a house on the coast and a temper on the road.',
  [TrainerClass.HoennScientist]: 'Devon pays for this field work. Consider yourself data.',
  [TrainerClass.Guitarist]: 'Plug in and stand back. This one gets loud.',
  [TrainerClass.Kindler]: 'The mountain is hot enough already. My pokemon make it worse.',
  [TrainerClass.BattleGirl]: 'I train under the falls at Dewford. You are about to feel it.',
  [TrainerClass.Expert]: 'I saw how this ends before you spoke. Come on anyway.',
  [TrainerClass.RuinManiac]: 'I dug these tunnels myself. Look what was sleeping in one.',
  [TrainerClass.StreetThug]: 'This road is ours after dark. You are paying the toll in wins.',
  [TrainerClass.DragonTamer]:
    'Raised from an egg out in the sand. It listens to me and nobody else.',
  [TrainerClass.AromaLady]: 'Breathe in. My pokemon grew up in this, and they are stronger for it.',
  [TrainerClass.Ranger]:
    'I look after this stretch of country. That includes deciding who crosses it.',
  [TrainerClass.Worker]:
    'We dug this tunnel through the mountain. You are the easy part of my day.',
  [TrainerClass.Rancher]: 'I raised every one of these from the herd. They do as they are told.',
  [TrainerClass.Cyclist]: 'I came down that hill at speed. Keeping up is your problem.',
  [TrainerClass.PokeKid]: 'Mine are cuter than yours. They also hit harder. Want to see?',
  [TrainerClass.Collector]:
    'I have one of everything odd in this country. Beating you would round it off.',
  [TrainerClass.Artist]: 'Hold still. I want to paint the moment you realise.',
  [TrainerClass.Reporter]: 'Local trainer loses on camera. I have the headline, I just need you.',
  [TrainerClass.RichBoy]: 'Money cannot buy a good pokemon. It can buy a great deal of training.',
  [TrainerClass.Waiter]: 'The kitchen runs hot and so do my pokemon. Order something.',
  [TrainerClass.ParasolLady]: 'Rain does not touch me. Neither will anything you send out.',
  [TrainerClass.Twins]: 'We think the same thing at the same time. You are outnumbered twice.',
  [TrainerClass.Policeman]: 'I keep this road quiet. Battling you counts as keeping it quiet.',
  [TrainerClass.Jogger]: 'Twelve miles before breakfast. A battle is my cooldown.',
  [TrainerClass.Breeder]:
    'Every one of these hatched in my hands. They fight for me because of it.',
  [TrainerClass.SinnohAceTrainer]:
    'I have walked every road north of here. None of them stopped me either.',
  [TrainerClass.SinnohLass]: 'It is freezing out here and I am still winning. Your turn.',
  [TrainerClass.SinnohBugCatcher]: 'The forest here is full of them, and I got up earliest.',
  [TrainerClass.SinnohSwimmer]: 'This lake is snowmelt. I swam it anyway. You warm up first.',
  [TrainerClass.SinnohYoungster]: 'I dug through half a mountain to find this one. Look at it!',
  [TrainerClass.SinnohSchoolKid]:
    'We are graphing battle outcomes this term. You are one data point.',
  [TrainerClass.SinnohCamper]: 'Slept on a slab of rock last night. Found this under it.',
  [TrainerClass.SinnohBeauty]: 'I do contests as well as battles. You only have to lose the one.',
  [TrainerClass.SinnohFisherman]:
    'Cut a hole in the ice and waited four hours. You are the better catch.',
  [TrainerClass.SinnohSailor]: 'I run the boat across the bay. The crossing is rougher than I am.',
  [TrainerClass.SinnohGentleman]: 'A little sport before dinner. Do try to make it interesting.',
  [TrainerClass.SinnohScientist]:
    'We study the pokemon that come out of the mountain. Yours will do as a control.',
  [TrainerClass.SinnohBirdKeeper]: 'Mine fly over the whole range. Nothing down here worries them.',
  [TrainerClass.SinnohHiker]:
    'Up the pass and back before noon. You are in the way of the descent.',
  [TrainerClass.SinnohPsychic]:
    'The lake spirits leave a sort of hum behind. I have been listening for years.',
  [TrainerClass.SinnohSkier]: 'The powder up here is the best there is. So is my team.',
  [TrainerClass.SinnohBlackBelt]:
    'The dojo in Veilstone turns nobody away. It also lets nobody off.',
  [TrainerClass.SinnohDragonTamer]:
    'Found the egg in a cave under the peak. Raised what came out of it.',
  [TrainerClass.SinnohGuitarist]:
    'Sunyshore runs on solar power. So does this amplifier. Stand back.',
  [TrainerClass.SinnohAromaLady]: 'Everything here grows slowly and holds on hard. Mine included.',
  [TrainerClass.SinnohRuinManiac]:
    'There are chambers under this country older than the league. I dig them out.',
  [TrainerClass.SinnohNinjaBoy]:
    'You walked straight past me twice. The third time costs you a battle.',
  [TrainerClass.SinnohTuber]: 'The water is cold and I am not getting out. Battle me from there.',
  [TrainerClass.SinnohPokeFan]:
    'I have photographs of every one of these. Now I want one of you losing.',
  [TrainerClass.SinnohRoughneck]: 'We hold this stretch of road. Toll is one battle, win or lose.',
  [TrainerClass.SinnohClown]: 'Watch the hands. No, the other hands. Too late.',
  [TrainerClass.Couple]: 'We battle together or not at all. You are welcome to try the pair of us.',
  [TrainerClass.HoennBreeder]:
    'The eggs hatch faster on the cycling road. These three were this morning.',
  [TrainerClass.HoennRanger]: 'This route is mine to keep. Nothing crosses it without meeting me.',
  [TrainerClass.HoennCollector]:
    'I have dug up every oddity on this coast. You would round out the shelf.',
  [TrainerClass.HoennReporter]:
    'We are filming a piece on roadside battles. Say something for the camera.',
  [TrainerClass.HoennRichBoy]: 'Father keeps a yacht at Lilycove. I keep a team worth rather more.',
  [TrainerClass.HoennParasolLady]: 'It rains here six days in seven. I have never once been wet.',
  [TrainerClass.SinnohCouple]:
    'We walked the whole route together. We will take you together as well.',
};

export default TRAINER_QUOTES;
