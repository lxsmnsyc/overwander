import Abilities from '../ids/abilities';
import Families from '../ids/families';
import { registerSignature } from './__create';

/**
 * One invented ability per evolution family, themed on what the line
 * is and how it fights. None of them are rolled at birth or bred for:
 * they are granted, so a species' ordinary pool is untouched
 */
export default function registerSignatureAbilities(): void {
  /**
   * The Kanto starters share one signature: each tilts the field toward
   * its own type and away from the one that type beats, both sides
   * included
   */
  registerSignature(Families.Bulbasaur, Abilities.VerdantField, {
    name: 'Verdant Field',
    description:
      'Grass moves hit 1.2x and Water moves 0.8x for everybody on the field while it stands.',
  });

  registerSignature(Families.Charmander, Abilities.EmberField, {
    name: 'Ember Field',
    description:
      'Fire moves hit 1.2x and Grass moves 0.8x for everybody on the field while it stands.',
  });

  registerSignature(Families.Squirtle, Abilities.DelugeField, {
    name: 'Deluge Field',
    description:
      'Water moves hit 1.2x and Fire moves 0.8x for everybody on the field while it stands.',
  });

  registerSignature(Families.Caterpie, Abilities.PowderBurst, {
    name: 'Powder Burst',
    description: 'Its status moves reach every enemy on the field, not only the one it aimed at.',
  });

  registerSignature(Families.Weedle, Abilities.TwinStinger, {
    name: 'Twin Stinger',
    description:
      'Each physical move it uses strikes twice at 60% power, so anything that answers a landed blow answers both.',
  });

  registerSignature(Families.Pidgey, Abilities.Slipstream, {
    name: 'Slipstream',
    description: 'Cast and channel times are 20% shorter for its party while it stands.',
  });

  registerSignature(Families.Rattata, Abilities.Nibble, {
    name: 'Nibble',
    description: "Every move it lands takes another 1/32 of the target's HP, whatever its armour.",
  });

  registerSignature(Families.Spearow, Abilities.Relentless, {
    name: 'Relentless',
    description:
      'Each move it lands on the same target as the last hits 10% harder, up to 1.4x. Aiming at anybody else starts it over.',
  });

  registerSignature(Families.Ekans, Abilities.Squeeze, {
    name: 'Squeeze',
    description:
      'While it casts or channels, the last enemy it touched loses 1/16 of its HP each second.',
  });

  registerSignature(Families.Pikachu, Abilities.ChainLightning, {
    name: 'Chain Lightning',
    description:
      'An Electric move it lands arcs to one other standing enemy for 1/3 of the damage it dealt.',
  });

  registerSignature(Families.Sandshrew, Abilities.CurlUp, {
    name: 'Curl Up',
    description: 'Each hit it takes casts Defense Curl on itself.',
  });

  /**
   * The two Nidoran lines are counterparts, so both are paid in poison:
   * every poisoned enemy lifts the holder, the female on the defending
   * side of a blow and the male on the attacking one
   */

  registerSignature(Families.NidoranF, Abilities.QueensCourt, {
    name: "Queen's Court",
    description:
      'Her Defense and Special Defense are 1.15x for each poisoned enemy on the field, counting up to 3.',
  });

  registerSignature(Families.NidoranM, Abilities.KingsCourt, {
    name: "King's Court",
    description:
      'His Attack and Special Attack are 1.15x for each poisoned enemy on the field, counting up to 3.',
  });

  registerSignature(Families.Clefairy, Abilities.WishingWell, {
    name: 'Wishing Well',
    description: 'Each time it acts, it casts Wish on the teammate lowest on HP.',
  });

  registerSignature(Families.Vulpix, Abilities.NineTails, {
    name: 'Nine Tails',
    description: 'Its Special Attack rises 8% for each hit it has taken, up to 9 hits.',
  });

  registerSignature(Families.Jigglypuff, Abilities.Lullaby, {
    name: 'Lullaby',
    description:
      'Sleep it inflicts lasts 1.5x as long, and its moves hit 1.5x against a sleeping target.',
  });

  registerSignature(Families.Zubat, Abilities.Bloodthirst, {
    name: 'Bloodthirst',
    description:
      'Draining moves and Leech Seed restore 1.5x for it. Every other heal on it is halved.',
  });

  registerSignature(Families.Oddish, Abilities.DeepRoots, {
    name: 'Deep Roots',
    description: 'It casts Ingrain on itself as it arrives on the field.',
  });

  registerSignature(Families.Paras, Abilities.FungalBloom, {
    name: 'Fungal Bloom',
    description:
      'Heals 1/8 of its HP each time it lands poison, sleep, paralysis, a burn or a freeze on an enemy.',
  });

  registerSignature(Families.Venonat, Abilities.DustStorm, {
    name: 'Dust Storm',
    description: 'Its Special Attack rises 12% for every enemy carrying a status, up to 4 of them.',
  });

  registerSignature(Families.Diglett, Abilities.Undermine, {
    name: 'Undermine',
    description:
      'Each move it lands leaves that enemy taking 5% more from everybody, up to 25%, for the rest of the fight.',
  });

  registerSignature(Families.Meowth, Abilities.Cutpurse, {
    name: 'Cutpurse',
    description: 'The first move it lands on each enemy knocks their held item away.',
  });

  registerSignature(Families.Psyduck, Abilities.HeadacheBurst, {
    name: 'Headache Burst',
    description: 'At or below 1/2 HP its Special Attack is 1.5x and its Psychic moves cannot miss.',
  });

  registerSignature(Families.Mankey, Abilities.BlindRage, {
    name: 'Blind Rage',
    description:
      'Its Attack is 1.4x and its moves are 15% less accurate. Nothing can heal it while the rage is on.',
  });

  registerSignature(Families.Growlithe, Abilities.ChaseDown, {
    name: 'Chase Down',
    description:
      'Its moves hit 1.5x against a target at or below 1/3 HP, and such a target cannot flee from it.',
  });

  registerSignature(Families.Poliwag, Abilities.HypnoticSpiral, {
    name: 'Hypnotic Spiral',
    description: 'Whoever lands a contact move on it takes 30% longer over their next cast.',
  });

  registerSignature(Families.Abra, Abilities.TeleportGuard, {
    name: 'Teleport Guard',
    description:
      'It blinks away from the first attack that would land on it, then needs 10 seconds to do it again.',
  });

  registerSignature(Families.Machop, Abilities.OverheadThrow, {
    name: 'Overhead Throw',
    description:
      'Its contact moves hit 1.4x against a target heavier than it, and 1.1x against a lighter one.',
  });

  registerSignature(Families.Bellsprout, Abilities.Digest, {
    name: 'Digest',
    description:
      'Landing a move on a target at or below 1/4 HP heals it 1/4 of its own HP. A finished target counts.',
  });

  registerSignature(Families.Tentacool, Abilities.TentacleGrasp, {
    name: 'Tentacle Grasp',
    description: 'No enemy it has landed a move on may flee while it is still standing.',
  });

  registerSignature(Families.Geodude, Abilities.SolidCore, {
    name: 'Solid Core',
    description: 'Physical moves hit it at 0.7x and special moves at 1.3x.',
  });

  registerSignature(Families.Ponyta, Abilities.Gallop, {
    name: 'Gallop',
    description:
      'Its Speed rises 10% each time it acts, up to 1.5x. Any hit it takes brings it back to a standstill.',
  });

  registerSignature(Families.Slowpoke, Abilities.DelayedReaction, {
    name: 'Delayed Reaction',
    description: 'It only feels half of each hit at once. The other half arrives 4 seconds later.',
  });

  registerSignature(Families.Magnemite, Abilities.RepulsionField, {
    name: 'Repulsion Field',
    description: 'Special moves hit at 0.9x for everybody on the field, its own included.',
  });

  registerSignature(Families.Farfetchd, Abilities.LeekDuelist, {
    name: 'Leek Duelist',
    description:
      'Its critical stage is 2 higher and its criticals hit 1.25x harder. Everything hits it 1.25x in return.',
  });

  registerSignature(Families.Doduo, Abilities.SecondHead, {
    name: 'Second Head',
    description: 'Every third move it lands strikes again at once for 50% power.',
  });

  registerSignature(Families.Seel, Abilities.SleekHide, {
    name: 'Sleek Hide',
    description: 'Contact moves hit it at 0.75x and everything else at 1.1x.',
  });

  registerSignature(Families.Grimer, Abilities.CorrosiveOoze, {
    name: 'Corrosive Ooze',
    description:
      'Whoever lands a contact move on it has their held item destroyed, not knocked loose.',
  });

  registerSignature(Families.Shellder, Abilities.SpikeShell, {
    name: 'Spike Shell',
    description: 'Contact moves hit it at 0.5x, and whoever lands one takes 1/8 of their own HP.',
  });

  registerSignature(Families.Gastly, Abilities.NightTerror, {
    name: 'Night Terror',
    description: 'An enemy it damages cannot be healed for the next 4 seconds.',
  });

  registerSignature(Families.Onix, Abilities.LivingTunnel, {
    name: 'Living Tunnel',
    description:
      'Its teammates take 0.8x from Rock and Ground moves while it stands, and it takes those at 1.2x.',
  });

  registerSignature(Families.Drowzee, Abilities.DreamFeast, {
    name: 'Dream Feast',
    description: 'Landing a move on a sleeping target heals it 1/8 of its HP.',
  });

  registerSignature(Families.Krabby, Abilities.HeavyPincer, {
    name: 'Heavy Pincer',
    description: 'Its contact moves hit 1.45x while it is at or above 1/2 HP.',
  });

  registerSignature(Families.Voltorb, Abilities.Overload, {
    name: 'Overload',
    description: 'Its Speed doubles below 1/2 HP.',
  });

  registerSignature(Families.Exeggcute, Abilities.Psyseed, {
    name: 'Psyseed',
    description: 'An enemy its Psychic moves damage has Leech Seed cast on it.',
  });

  registerSignature(Families.Cubone, Abilities.MourningBone, {
    name: 'Mourning Bone',
    description: 'Its moves hit 1.4x while it is the only one left standing in its party.',
  });

  registerSignature(Families.Tyrogue, Abilities.SecondWind, {
    name: 'Second Wind',
    description: 'The first time it falls below 1/4 HP it heals 1/3 of its HP. Once per battle.',
  });

  registerSignature(Families.Lickitung, Abilities.TasteEverything, {
    name: 'Taste Everything',
    description:
      'A contact move it lands on a berry holder eats that berry, healing or curing it as the berry would.',
  });

  registerSignature(Families.Koffing, Abilities.SmogScreen, {
    name: 'Smog Screen',
    description: 'Enemy moves are 15% less accurate while it stands. Its own side sees fine.',
  });

  registerSignature(Families.Rhyhorn, Abilities.Corkscrew, {
    name: 'Corkscrew',
    description: 'Its contact moves hit 1.15x and ignore any Defense the target has raised.',
  });

  registerSignature(Families.Chansey, Abilities.Cushioned, {
    name: 'Cushioned',
    description: 'No single hit takes more than 1/4 of its HP off it.',
  });

  registerSignature(Families.Tangela, Abilities.VineWeb, {
    name: 'Vine Web',
    description: 'It lays a layer of Spikes on the enemy side each time it arrives on the field.',
  });

  registerSignature(Families.Kangaskhan, Abilities.MothersShield, {
    name: "Mother's Shield",
    description: 'Enemy moves aimed at a teammate below 1/2 HP are aimed at her instead.',
  });

  registerSignature(Families.Horsea, Abilities.WhirlCurrent, {
    name: 'Whirl Current',
    description: 'Enemy cast times are 20% longer while rain is falling.',
  });

  registerSignature(Families.Goldeen, Abilities.Upstream, {
    name: 'Upstream',
    description: 'Its moves hit 1.35x against any target with more HP than its own.',
  });

  registerSignature(Families.Staryu, Abilities.CoreReset, {
    name: 'Core Reset',
    description: 'Each time it acts, one stat drop on it is undone.',
  });

  registerSignature(Families.MrMime, Abilities.MimedBarrier, {
    name: 'Mimed Barrier',
    description:
      'It casts Light Screen over its party as it arrives, and physical moves hit it at 1.15x itself.',
  });

  registerSignature(Families.Scyther, Abilities.CleanCut, {
    name: 'Clean Cut',
    description: "Its critical hits ignore every stage on the target's defending stat.",
  });

  registerSignature(Families.Jynx, Abilities.IcyCharm, {
    name: 'Icy Charm',
    description: 'Its moves hit 1.5x against a target that is infatuated or confused.',
  });

  registerSignature(Families.Electabuzz, Abilities.StaticField, {
    name: 'Static Field',
    description: 'Its Speed rises 15% for each contact hit it has taken, up to 4 of them.',
  });

  registerSignature(Families.Magmar, Abilities.BlastFurnace, {
    name: 'Blast Furnace',
    description: 'Its Fire moves burn the target 30% of the time.',
  });

  registerSignature(Families.Pinsir, Abilities.Snapjaw, {
    name: 'Snapjaw',
    description: 'Its moves hit 1.5x against a target that is casting or channelling.',
  });

  registerSignature(Families.Tauros, Abilities.Bullheaded, {
    name: 'Bullheaded',
    description: 'Its contact moves hit 1.3x, and everything hits it 1.15x in return.',
  });

  registerSignature(Families.Magikarp, Abilities.LateBloomer, {
    name: 'Late Bloomer',
    description:
      'Its moves hit 5% harder for every 10 seconds it has been in the fight, up to 1.5x.',
  });

  registerSignature(Families.Lapras, Abilities.SafePassage, {
    name: 'Safe Passage',
    description:
      'It casts Safeguard over its party as it arrives, and its teammates cannot be stopped from fleeing.',
  });

  registerSignature(Families.Ditto, Abilities.Formless, {
    name: 'Formless',
    description: 'Critical hits land on it as ordinary hits, and its stages cannot be lowered.',
  });

  registerSignature(Families.Eevee, Abilities.LatentPotential, {
    name: 'Latent Potential',
    description: 'Whichever of its five battle stats is lowest counts 1.3x.',
  });

  registerSignature(Families.Porygon, Abilities.Rollback, {
    name: 'Rollback',
    description:
      'The first time it drops below 1/2 HP, its health goes back to what it was 4 seconds earlier.',
  });

  /**
   * The two Kanto fossils are counterparts, and both are written on the
   * defending side of a blow: the shell raises its own defences and the
   * blade cuts into whatever it strikes, so each answers the other
   */

  registerSignature(Families.Omanyte, Abilities.HelixShell, {
    name: 'Helix Shell',
    description: 'Its Defense and Special Defense count as 1.25x against every blow it takes.',
  });

  registerSignature(Families.Kabuto, Abilities.DomeBlade, {
    name: 'Dome Blade',
    description: "Its blows count the target's Defense or Special Defense as 0.75x.",
  });

  registerSignature(Families.Aerodactyl, Abilities.PredatorsDive, {
    name: "Predator's Dive",
    description: 'Its first move against each enemy hits 1.5x.',
  });

  registerSignature(Families.Snorlax, Abilities.FullBelly, {
    name: 'Full Belly',
    description: 'It heals 1/16 of its HP every time it acts, and its cast times are 25% longer.',
  });

  /**
   * The three birds share one signature: the beat of the wings as one
   * takes the field, told in the stat its own weather works on
   */
  registerSignature(Families.Articuno, Abilities.Frostwing, {
    name: 'Frostwing',
    description: 'Every enemy loses a stage of Speed as it arrives on the field.',
  });

  registerSignature(Families.Zapdos, Abilities.Stormwing, {
    name: 'Stormwing',
    description: 'Every enemy loses a stage of Special Defense as it arrives on the field.',
  });

  registerSignature(Families.Moltres, Abilities.Emberwing, {
    name: 'Emberwing',
    description: 'Every enemy loses a stage of Defense as it arrives on the field.',
  });

  registerSignature(Families.Dratini, Abilities.SereneStorm, {
    name: 'Serene Storm',
    description:
      'Weather it calls up never clears on its own, and its party takes no damage from any weather.',
  });

  registerSignature(Families.Mewtwo, Abilities.GeneticApex, {
    name: 'Genetic Apex',
    description: 'Its highest battle stat counts 1.25x and its lowest counts 0.8x.',
  });

  registerSignature(Families.Mew, Abilities.AncestralMemory, {
    name: 'Ancestral Memory',
    description: 'Any type that has already hit it once hits it at 0.85x thereafter.',
  });

  /**
   * The Johto starters share one signature: each leaves its element on
   * whatever it lands a move on, paid as that thing acts
   */
  registerSignature(Families.Chikorita, Abilities.Sapmark, {
    name: 'Sapmark',
    description:
      'Anything it lands a move on loses 1/16 of its HP each time it acts, and Chikorita drinks the same.',
  });

  registerSignature(Families.Cyndaquil, Abilities.Embermark, {
    name: 'Embermark',
    description:
      'Anything it lands a move on loses 1/16 of its HP each time it acts, or 1/8 while it is burned.',
  });

  registerSignature(Families.Totodile, Abilities.Jawmark, {
    name: 'Jawmark',
    description:
      'The one thing it has its jaws in loses 1/8 of its HP each time it acts. Only ever one at a time.',
  });

  registerSignature(Families.Sentret, Abilities.Sentry, {
    name: 'Sentry',
    description: 'Nobody in its party can be hit by a critical hit while it stands.',
  });

  registerSignature(Families.Hoothoot, Abilities.WatchfulRoost, {
    name: 'Watchful Roost',
    description: 'It casts Reflect over its party as it arrives on the field.',
  });

  registerSignature(Families.Ledyba, Abilities.Relay, {
    name: 'Relay',
    description: 'Whenever it is switched out, its stat stages carry to the teammate coming in.',
  });

  registerSignature(Families.Spinarak, Abilities.SilkSnare, {
    name: 'Silk Snare',
    description: 'It casts String Shot at every standing enemy as it arrives on the field.',
  });

  registerSignature(Families.Chinchou, Abilities.LanternLure, {
    name: 'Lantern Lure',
    description: 'It casts Confuse Ray at an enemy as it arrives on the field.',
  });

  registerSignature(Families.Togepi, Abilities.FairShare, {
    name: 'Fair Share',
    description:
      'A move under 100% accuracy that just hit somebody in its party cannot hit that one again next time.',
  });

  registerSignature(Families.Natu, Abilities.Prophecy, {
    name: 'Prophecy',
    description: 'It casts Future Sight at an enemy as it arrives on the field.',
  });

  registerSignature(Families.Mareep, Abilities.LiveWire, {
    name: 'Live Wire',
    description: 'It casts Thunder Wave at an enemy as it arrives on the field.',
  });

  registerSignature(Families.Marill, Abilities.Spillover, {
    name: 'Spillover',
    description: 'Healing past its full HP is thrown at an enemy as damage rather than wasted.',
  });

  registerSignature(Families.Sudowoodo, Abilities.FalseWood, {
    name: 'False Wood',
    description:
      'It counts as a Grass type for working out what hurts it, until the first hit lands on it.',
  });

  registerSignature(Families.Hoppip, Abilities.Updraft, {
    name: 'Updraft',
    description: 'It cannot be trapped, its Speed cannot be lowered, and it always gets away.',
  });

  registerSignature(Families.Aipom, Abilities.Tailthrow, {
    name: 'Tailthrow',
    description: 'It casts Fling as it arrives on the field, throwing its held item at an enemy.',
  });

  registerSignature(Families.Sunkern, Abilities.SunlitCharge, {
    name: 'Sunlit Charge',
    description: 'Its channelled moves hit 1.3x and cannot be interrupted.',
  });

  registerSignature(Families.Yanma, Abilities.Resonance, {
    name: 'Resonance',
    description: 'Its sound moves reach every enemy on the field, not only the one it aimed at.',
  });

  registerSignature(Families.Wooper, Abilities.ContagiousYawn, {
    name: 'Contagious Yawn',
    description: 'It casts Yawn at an enemy as it arrives on the field.',
  });

  registerSignature(Families.Murkrow, Abilities.Magpie, {
    name: 'Magpie',
    description: 'Any held item taken off somebody else on the field goes into its empty hands.',
  });

  registerSignature(Families.Misdreavus, Abilities.SharedMisery, {
    name: 'Shared Misery',
    description:
      'The first time it drops below 1/3 of its HP it casts Pain Split at the healthiest enemy.',
  });

  registerSignature(Families.Unown, Abilities.RuinousScript, {
    name: 'Ruinous Script',
    description: 'Held items do nothing on the enemy side while it stands.',
  });

  registerSignature(Families.Wobbuffet, Abilities.Backlash, {
    name: 'Backlash',
    description:
      'It banks 1/4 of every hit it takes, and pays the bank back to whoever last struck it when it next acts.',
  });

  registerSignature(Families.Girafarig, Abilities.Ambidextrous, {
    name: 'Ambidextrous',
    description:
      'Its moves are worked out from whichever of its Attack and Special Attack is higher.',
  });

  registerSignature(Families.Pineco, Abilities.Shrapnel, {
    name: 'Shrapnel',
    description: 'When it faints, it casts Spikes and Toxic Spikes onto the enemy side.',
  });

  registerSignature(Families.Dunsparce, Abilities.HiddenDen, {
    name: 'Hidden Den',
    description:
      'While anybody else in its party stands, enemies cannot aim a single-target move at it.',
  });

  registerSignature(Families.Gligar, Abilities.SandRider, {
    name: 'Sand Rider',
    description: 'While sand blows, its moves cannot miss and everything hits it at 0.75x.',
  });

  registerSignature(Families.Snubbull, Abilities.Bully, {
    name: 'Bully',
    description: 'Its moves hit 1.3x against a target whose Attack has been lowered.',
  });

  registerSignature(Families.Qwilfish, Abilities.LastBarb, {
    name: 'Last Barb',
    description: 'When it faints, it casts Toxic at whoever finished it.',
  });

  registerSignature(Families.Shuckle, Abilities.Fermenter, {
    name: 'Fermenter',
    description: 'Each time it acts with a free hand, a Berry Juice appears in it.',
  });

  registerSignature(Families.Heracross, Abilities.Heave, {
    name: 'Heave',
    description: 'The first contact move it lands on each enemy casts Whirlwind at them.',
  });

  registerSignature(Families.Sneasel, Abilities.SharpClaw, {
    name: 'Sharp Claw',
    description: "Each contact move it lands drops the target's Defense by a stage.",
  });

  registerSignature(Families.Teddiursa, Abilities.SweetPaw, {
    name: 'Sweet Paw',
    description: 'Its contact moves heal it 1/8 of the damage they deal.',
  });

  registerSignature(Families.Slugma, Abilities.MagmaTrail, {
    name: 'Magma Trail',
    description:
      'An enemy it has landed a move on loses 1/16 of its HP each time it acts, while it stands.',
  });

  registerSignature(Families.Swinub, Abilities.Icebreaker, {
    name: 'Icebreaker',
    description: "A move it lands tears Reflect and Light Screen off the target's side.",
  });

  registerSignature(Families.Corsola, Abilities.CoralBloom, {
    name: 'Coral Bloom',
    description: 'Whenever it is healed, the teammate lowest on HP is healed the same amount.',
  });

  registerSignature(Families.Remoraid, Abilities.Standoff, {
    name: 'Standoff',
    description: 'Nothing it uses counts as contact, so it never sets off what answers a touch.',
  });

  registerSignature(Families.Delibird, Abilities.Delivery, {
    name: 'Delivery',
    description: 'It hands a Berry Juice to the teammate lowest on HP as it arrives on the field.',
  });

  registerSignature(Families.Mantine, Abilities.Escort, {
    name: 'Escort',
    description: "Its teammates' Special Defense counts 1.3x while it stands.",
  });

  registerSignature(Families.Skarmory, Abilities.Steelmolt, {
    name: 'Steelmolt',
    description: 'Each hit it takes lays a layer of Spikes on the enemy side.',
  });

  registerSignature(Families.Houndour, Abilities.PackHowl, {
    name: 'Pack Howl',
    description: 'Every teammate gains a stage of Attack as it arrives on the field.',
  });

  registerSignature(Families.Phanpy, Abilities.Momentum, {
    name: 'Momentum',
    description:
      'Its moves hit 1.1x for each move it has landed since taking the field, up to 1.5x.',
  });

  registerSignature(Families.Stantler, Abilities.MindFog, {
    name: 'Mind Fog',
    description: 'Enemy Special Attack counts 0.85x while it stands.',
  });

  registerSignature(Families.Smeargle, Abilities.Palette, {
    name: 'Palette',
    description: 'Its moves take the type of the last move that hit it.',
  });

  registerSignature(Families.Miltank, Abilities.Cowbell, {
    name: 'Cowbell',
    description: 'It casts Heal Bell over its party as it arrives on the field.',
  });

  /**
   * The three beasts share one signature, told three ways: what Ho-Oh
   * did for them in the burned tower, once per battle
   */
  registerSignature(Families.Raikou, Abilities.RisenThunder, {
    name: 'Risen Thunder',
    description:
      'The first blow that would finish it leaves it on 1 HP, cured, and a stage faster. Once per battle.',
  });

  registerSignature(Families.Entei, Abilities.RisenFlame, {
    name: 'Risen Flame',
    description:
      'The first blow that would finish it leaves it on 1 HP, cured, and a stage stronger. Once per battle.',
  });

  registerSignature(Families.Suicune, Abilities.RisenTide, {
    name: 'Risen Tide',
    description:
      'The first blow that would finish it leaves it on 1 HP, cured, and a stage harder to hurt. Once per battle.',
  });

  registerSignature(Families.Larvitar, Abilities.Tyrant, {
    name: 'Tyrant',
    description: 'Nothing on the enemy side can raise a stat while it stands.',
  });

  /**
   * The tower duo share one signature, told either side of a fall: the
   * guardian keeps its party standing once per battle
   */
  registerSignature(Families.Lugia, Abilities.SilverAegis, {
    name: 'Silver Aegis',
    description:
      'The first blow that would finish a teammate leaves it on 1 HP instead. Once per battle.',
  });

  registerSignature(Families.HoOh, Abilities.RainbowRekindling, {
    name: 'Rainbow Rekindling',
    description: 'The first teammate to fall gets back up on 1/3 of its HP. Once per battle.',
  });

  registerSignature(Families.Celebi, Abilities.TimelineSplit, {
    name: 'Timeline Split',
    description:
      'The first time it drops below 1/2 HP, every stat drop on it is undone and every status cleared.',
  });

  /**
   * The Hoenn starters share one signature: each grows through the
   * fight in the stat its line is built on, up to three stages of its
   * own making
   */
  registerSignature(Families.Treecko, Abilities.SapSurge, {
    name: 'Sap Surge',
    description: 'It gains a stage of Speed each time it acts, up to 3 of its own.',
  });

  registerSignature(Families.Torchic, Abilities.EmberSurge, {
    name: 'Ember Surge',
    description: 'It gains a stage of Attack each time it lands a move, up to 3 of its own.',
  });

  registerSignature(Families.Mudkip, Abilities.SiltSurge, {
    name: 'Silt Surge',
    description:
      'It gains a stage of Special Defense each time it takes a hit, up to 3 of its own.',
  });

  registerSignature(Families.Poochyena, Abilities.PackHunt, {
    name: 'Pack Hunt',
    description: 'Its moves hit 1.2x against anything a teammate has already damaged.',
  });

  registerSignature(Families.Zigzagoon, Abilities.CrookedRun, {
    name: 'Crooked Run',
    description:
      'Each time it acts, moves aimed at it are 0.9x as accurate, stacking 3 times. A landed blow clears it.',
  });

  registerSignature(Families.Wurmple, Abilities.Cocoon, {
    name: 'Cocoon',
    description:
      'The first time it drops below 1/2 HP, it shells over for 4 seconds: it deals and takes 0.5x damage.',
  });

  /**
   * Lotad and Seedot are counterparts, so each calls up its own sky on
   * taking the field and lives off it. Whichever arrived last owns the
   * weather, which is what makes the two cancel
   */

  registerSignature(Families.Lotad, Abilities.WaterBloom, {
    name: 'Water Bloom',
    description:
      'It calls up Rain as it takes the field, and heals 1/16 of its HP each time it acts in Rain.',
  });

  registerSignature(Families.Seedot, Abilities.SunRoot, {
    name: 'Sun Root',
    description: 'It calls up Sun as it takes the field, and its moves deal 1.3x damage in Sun.',
  });

  registerSignature(Families.Taillow, Abilities.MigrantsWind, {
    name: "Migrant's Wind",
    description: 'It casts Tailwind over its party as it arrives on the field.',
  });

  registerSignature(Families.Wingull, Abilities.GullsGreed, {
    name: "Gull's Greed",
    description: 'Every heal an enemy receives is 0.75x, and it takes the quarter for itself.',
  });

  registerSignature(Families.Ralts, Abilities.Empath, {
    name: 'Empath',
    description: 'Its Special Attack counts 1.3x while a teammate is below 1/2 HP.',
  });

  registerSignature(Families.Surskit, Abilities.SurfaceWalk, {
    name: 'Surface Walk',
    description: 'It takes no damage from hazards or from weather.',
  });

  registerSignature(Families.Shroomish, Abilities.Mycelium, {
    name: 'Mycelium',
    description:
      'Anything carrying poison, sleep, paralysis, a burn or a freeze takes 1.2x from every blow while it stands.',
  });

  registerSignature(Families.Slakoth, Abilities.WideSwing, {
    name: 'Wide Swing',
    description: 'Its physical moves reach every enemy on the field, not only the one it aimed at.',
  });

  registerSignature(Families.Nincada, Abilities.VanishingAct, {
    name: 'Vanishing Act',
    description: 'For 1 second after it lands a move, single-target moves aimed at it miss.',
  });

  registerSignature(Families.Whismur, Abilities.EchoChamber, {
    name: 'Echo Chamber',
    description: 'A sound move it lands echoes 2 seconds later for 1/4 of the damage it dealt.',
  });

  registerSignature(Families.Makuhita, Abilities.Shove, {
    name: 'Shove',
    description:
      'A contact move it lands on an enemy winding a move up flinches them, costing them that cast.',
  });

  registerSignature(Families.Nosepass, Abilities.Magnetize, {
    name: 'Magnetize',
    description: 'Enemy moves aimed at one of its teammates are pulled onto it instead.',
  });

  registerSignature(Families.Skitty, Abilities.KittenPace, {
    name: 'Kitten Pace',
    description: 'Its Speed counts 1.3x while it is at full HP.',
  });

  /**
   * Sableye and Mawile are counterparts, and both work on what the far
   * side has built up: Sableye knocks a raised stage off, Mawile takes
   * that stage for itself
   */

  registerSignature(Families.Sableye, Abilities.ShadowTax, {
    name: 'Shadow Tax',
    description: 'A move it lands removes one raised stage from the target.',
  });

  registerSignature(Families.Mawile, Abilities.JawClaim, {
    name: 'Jaw Claim',
    description: 'A move it lands moves one raised stage from the target onto itself.',
  });

  registerSignature(Families.Aron, Abilities.OreHunger, {
    name: 'Ore Hunger',
    description: 'Steel and Rock moves deal it no damage and heal it 1/4 of what they would have.',
  });

  registerSignature(Families.Meditite, Abilities.MindOverBody, {
    name: 'Mind Over Body',
    description: 'It takes 0.5x damage while it is casting or channelling a move.',
  });

  registerSignature(Families.Electrike, Abilities.JoltStart, {
    name: 'Jolt Start',
    description: 'Its first move of a battle goes off a step ahead of everything and hits 1.5x.',
  });

  /**
   * Plusle and Minun are counterparts, and each works one end of the
   * field as it acts: Plusle lifts the teammate that needs it, Minun takes
   * the strongest enemy down a step
   */

  registerSignature(Families.Plusle, Abilities.CheerOn, {
    name: 'Cheer On',
    description:
      'Each time it acts, the teammate lowest on HP gains a stage in its best stat, up to 3 times a battle.',
  });

  registerSignature(Families.Minun, Abilities.JeerAt, {
    name: 'Jeer At',
    description:
      'Each time it acts, the enemy highest on HP loses a stage in its best stat, up to 3 times a battle.',
  });

  /**
   * Volbeat and Illumise are counterparts, and each hangs an aura over
   * the far side for as long as it stands: the light leaves nowhere to
   * hide, the scent leaves nobody quick
   */

  registerSignature(Families.Volbeat, Abilities.TailLight, {
    name: 'Tail Light',
    description: 'Evasion counts for nothing on the enemy side while it stands.',
  });

  registerSignature(Families.Illumise, Abilities.LureScent, {
    name: 'Lure Scent',
    description: 'Enemy Speed counts 0.85x while it stands.',
  });

  registerSignature(Families.Roselia, Abilities.Perennial, {
    name: 'Perennial',
    description:
      'The first time it drops below 1/4 HP it heals 1/3 of its HP and is cured. Once per battle.',
  });

  registerSignature(Families.Gulpin, Abilities.Bottomless, {
    name: 'Bottomless',
    description: 'It heals 1/8 of its HP whenever any held item is consumed on the field.',
  });

  registerSignature(Families.Carvanha, Abilities.FeedingFrenzy, {
    name: 'Feeding Frenzy',
    description: 'It gains a stage of Attack whenever any enemy faints, up to 3 of them.',
  });

  registerSignature(Families.Wailmer, Abilities.Spout, {
    name: 'Spout',
    description: 'Its Water moves reach every enemy on the field, not only the one it aimed at.',
  });

  registerSignature(Families.Numel, Abilities.MagmaVent, {
    name: 'Magma Vent',
    description:
      'The first time it drops below 1/2 HP, every enemy loses 1/8 of their HP. Once per battle.',
  });

  registerSignature(Families.Torkoal, Abilities.BodyHeat, {
    name: 'Body Heat',
    description: 'Its Defense and Special Defense count 1.3x while the Sun is up.',
  });

  registerSignature(Families.Spoink, Abilities.StoredBounce, {
    name: 'Stored Bounce',
    description:
      'Half of each hit it takes is stored, up to 1/2 its HP, and the next move it lands deals the lot on top.',
  });

  registerSignature(Families.Spinda, Abilities.UniqueSpots, {
    name: 'Unique Spots',
    description:
      'It arrives with 2 stages in one random stat and 1 stage off another, rolled fresh each time.',
  });

  registerSignature(Families.Trapinch, Abilities.AntlionPit, {
    name: 'Antlion Pit',
    description: 'Any enemy move that misses it costs that enemy 1/8 of their HP.',
  });

  registerSignature(Families.Cacnea, Abilities.PatientStalk, {
    name: 'Patient Stalk',
    description:
      'Its moves hit 10% harder for each second it has stood idle, up to 50%, spent on the next one it lands.',
  });

  registerSignature(Families.Swablu, Abilities.CloudStep, {
    name: 'Cloud Step',
    description: 'The first move aimed at it each battle deals no damage to it.',
  });

  /**
   * Zangoose and Seviper are counterparts feuding over one thing: the
   * venom. Seviper's every touch poisons, and poison anywhere is what
   * Zangoose hunts, being the one thing venom does nothing to
   */

  registerSignature(Families.Zangoose, Abilities.FeudClaws, {
    name: 'Feud Claws',
    description: 'Its moves hit 1.4x against a poisoned target.',
  });

  registerSignature(Families.Seviper, Abilities.DeepeningVenom, {
    name: 'Deepening Venom',
    description:
      'A move it lands on a poisoned target turns that poison into the badly-poisoned kind.',
  });

  /**
   * Lunatone and Solrock are counterparts, and each hangs an aura over
   * the field that the other's presence blots out: with both standing,
   * neither aura applies
   */

  registerSignature(Families.Lunatone, Abilities.MoonPull, {
    name: 'Moon Pull',
    description:
      'Its party takes 0.85x damage while it stands, unless a Sun Glare holder stands too.',
  });

  registerSignature(Families.Solrock, Abilities.SunGlare, {
    name: 'Sun Glare',
    description: 'Enemies take 1.15x damage while it stands, unless a Moon Pull holder stands too.',
  });

  registerSignature(Families.Barboach, Abilities.SiltBed, {
    name: 'Silt Bed',
    description:
      'Every grounded pokemon on the field, its own side included, has Speed count 0.9x.',
  });

  registerSignature(Families.Corphish, Abilities.DirtyFighter, {
    name: 'Dirty Fighter',
    description: 'Its moves hit 1.3x against a target still at full HP.',
  });

  registerSignature(Families.Baltoy, Abilities.SpinBalance, {
    name: 'Spin Balance',
    description:
      'It cannot be flinched, cannot be forced off the field, and its stages cannot be lowered.',
  });

  /**
   * Lileep and Anorith are Hoenn's two fossils, so they are counterparts:
   * the one that anchors what it touches, and the one that runs down
   * whatever cannot get away
   */

  registerSignature(Families.Lileep, Abilities.RootHold, {
    name: 'Root Hold',
    description:
      'A move it lands stops that target fleeing for 6 seconds and counts their Speed 0.7x meanwhile.',
  });

  registerSignature(Families.Anorith, Abilities.ClawRush, {
    name: 'Claw Rush',
    description: 'Its moves hit 1.3x against any target slower than it.',
  });

  registerSignature(Families.Feebas, Abilities.ScarredBeauty, {
    name: 'Scarred Beauty',
    description:
      'Its Special Attack counts 1.4x while it carries poison, sleep, paralysis, a burn or a freeze.',
  });

  registerSignature(Families.Castform, Abilities.WeatherWorn, {
    name: 'Weather Worn',
    description: 'Under any weather its moves deal 1.3x and everything hits it at 0.85x.',
  });

  registerSignature(Families.Kecleon, Abilities.BlendIn, {
    name: 'Blend In',
    description: 'While it has stood still for 2 seconds, moves aimed at it are half as accurate.',
  });

  registerSignature(Families.Shuppet, Abilities.MalicePool, {
    name: 'Malice Pool',
    description: 'Its moves hit 10% harder for each lowered stage on the target, up to 50%.',
  });

  registerSignature(Families.Duskull, Abilities.SoulHarvest, {
    name: 'Soul Harvest',
    description: 'It heals 1/4 of its HP whenever anything on the field faints, either side.',
  });

  registerSignature(Families.Tropius, Abilities.FruitCrop, {
    name: 'Fruit Crop',
    description: 'Every 8 seconds it grows a Sitrus Berry, if its hands are empty.',
  });

  registerSignature(Families.Chimecho, Abilities.RingingHead, {
    name: 'Ringing Head',
    description: 'Enemy cast and channel times run 25% longer while it stands.',
  });

  registerSignature(Families.Absol, Abilities.DoomMark, {
    name: 'Doom Mark',
    description:
      'A move it lands marks that target: the next blow anybody lands on them within 4 seconds hits 1.3x.',
  });

  registerSignature(Families.Snorunt, Abilities.ColdSnap, {
    name: 'Cold Snap',
    description: 'Whoever lands a contact move on it is frozen 20% of the time.',
  });

  registerSignature(Families.Spheal, Abilities.Applause, {
    name: 'Applause',
    description: 'It heals 1/16 of its HP each time a teammate lands a move.',
  });

  registerSignature(Families.Clamperl, Abilities.PearlGuard, {
    name: 'Pearl Guard',
    description: 'Its Special Attack and Special Defense count 1.5x while it holds an item.',
  });

  registerSignature(Families.Relicanth, Abilities.Unchanged, {
    name: 'Unchanged',
    description: 'Every move hits it for neutral damage: it has no weaknesses and no resistances.',
  });

  registerSignature(Families.Luvdisc, Abilities.SharedHeart, {
    name: 'Shared Heart',
    description: 'Whenever a teammate is healed, it heals half of that amount as well.',
  });

  registerSignature(Families.Bagon, Abilities.SkullCharge, {
    name: 'Skull Charge',
    description: 'Its contact moves deal 1.4x, and it takes 1/8 of the damage they deal back.',
  });

  registerSignature(Families.Beldum, Abilities.HiveMind, {
    name: 'Hive Mind',
    description: 'Its moves hit 10% harder for each teammate standing with it, up to 3 of them.',
  });

  /**
   * The three Regis share the seal they were shut behind: each stands
   * half-strength for its first seconds on the field and then wakes for
   * good, a quarter harder and two stages up in its own stat
   */

  registerSignature(Families.Regirock, Abilities.StoneSeal, {
    name: 'Stone Seal',
    description:
      'For 8 seconds it deals and takes 0.5x. It then deals 1.25x and gains 2 stages of Defense.',
  });

  registerSignature(Families.Regice, Abilities.FrostSeal, {
    name: 'Frost Seal',
    description:
      'For 8 seconds it deals and takes 0.5x. It then deals 1.25x and gains 2 stages of Special Defense.',
  });

  registerSignature(Families.Registeel, Abilities.IronSeal, {
    name: 'Iron Seal',
    description:
      'For 8 seconds it deals and takes 0.5x. It then deals 1.25x and gains 2 stages of Attack.',
  });

  /**
   * Latias and Latios are counterparts: the sister flies over her side
   * and the brother flies through whatever the far side put up
   */

  registerSignature(Families.Latias, Abilities.EonShield, {
    name: 'Eon Shield',
    description: 'Its teammates take 0.8x damage while it stands. It covers everybody but itself.',
  });

  registerSignature(Families.Latios, Abilities.EonLance, {
    name: 'Eon Lance',
    description: 'Its moves deal 1.25x and count Reflect and Light Screen for nothing.',
  });

  /**
   * The three superancient pokemon share the waking: each is holding
   * back until it drops below half, and what comes out then stays out
   */

  registerSignature(Families.Kyogre, Abilities.PrimalSea, {
    name: 'Primal Sea',
    description:
      'Below 1/2 HP it gains 2 stages of Special Attack and its Water moves deal 1.3x, for good.',
  });

  registerSignature(Families.Groudon, Abilities.PrimalLand, {
    name: 'Primal Land',
    description:
      'Below 1/2 HP it gains 2 stages of Attack and its Ground moves deal 1.3x, for good.',
  });

  registerSignature(Families.Rayquaza, Abilities.PrimalSky, {
    name: 'Primal Sky',
    description:
      'Below 1/2 HP it gains 2 stages of Special Attack and its Dragon moves deal 1.3x, for good.',
  });

  registerSignature(Families.Jirachi, Abilities.SevenWishes, {
    name: 'Seven Wishes',
    description:
      'Every 7 times it acts, its whole party heals 1/4 of their HP and it alone is cured.',
  });

  registerSignature(Families.Deoxys, Abilities.FormDrift, {
    name: 'Form Drift',
    description:
      'Every 6 seconds it gains a stage in its highest battle stat and loses one in its lowest.',
  });

  /**
   * The Sinnoh starters share one signature: each is braced for one
   * kind of blow, takes it once a fight for half of what it was worth,
   * and turns it into something that lasts
   */
  registerSignature(Families.Turtwig, Abilities.BarkBrace, {
    name: 'Bark Brace',
    description:
      'The first physical blow it takes each fight lands at 1/2, and it roots: 1/16 of its HP back each time it acts.',
  });

  registerSignature(Families.Chimchar, Abilities.CinderBrace, {
    name: 'Cinder Brace',
    description:
      'The first special blow it takes each fight lands at 1/2, and its next move to land hits 1.5x.',
  });

  registerSignature(Families.Piplup, Abilities.CrestBrace, {
    name: 'Crest Brace',
    description:
      'The first status move aimed at it each fight fails, and it takes a stage of Special Attack from the insult.',
  });

  /**
   * The three that open Sinnoh's routes, each worth more for the
   * company it keeps: a flock, a lodge, a chorus
   */
  registerSignature(Families.Starly, Abilities.Murmuration, {
    name: 'Murmuration',
    description: 'Its attacks hit 1.05x for each teammate still standing, up to 1.25x.',
  });

  registerSignature(Families.Bidoof, Abilities.Lodgework, {
    name: 'Lodgework',
    description: 'Its team takes 25% less indirect damage while it stands.',
  });

  registerSignature(Families.Kricketot, Abilities.Chorus, {
    name: 'Chorus',
    description: 'Sound moves from its team hit 1.2x while it stands, its own included.',
  });

  /**
   * Gleam Eyes: the lion whose eyes are the reason nothing it hunts
   * gets to hide
   */
  registerSignature(Families.Shinx, Abilities.GleamEyes, {
    name: 'Gleam Eyes',
    description:
      "Its attacks ignore the target's raised evasion, and reach one that is in the air or underground.",
  });

  /**
   * Sinnoh's two fossils share cover: the skull ignores it, the
   * face-shield hands it out
   */
  registerSignature(Families.Cranidos, Abilities.Ramrod, {
    name: 'Ramrod',
    description: 'Its attacks strike through Protect, Detect and a Substitute.',
  });

  registerSignature(Families.Shieldon, Abilities.Bulwark, {
    name: 'Bulwark',
    description: 'A guard it puts up covers its whole team for as long as its own holds.',
  });

  /**
   * Sinnoh's next two: one built out of what it is hit with, the
   * other out of the side of the world it came from
   */
  registerSignature(Families.Burmy, Abilities.Patchwork, {
    name: 'Patchwork',
    description:
      'The first hit of each type it takes raises its Defense and Special Defense 1 stage, 3 times a fight.',
  });

  registerSignature(Families.Shellos, Abilities.TwoSeas, {
    name: 'Two Seas',
    description: 'The west shell hits 1.25x with Water moves, the east shell with Ground moves.',
  });

  /**
   * The comb, the sac and the blossom: what one gathers goes to the
   * hive, what one carries holds it off the ground, and what one
   * opens is itself
   */
  registerSignature(Families.Combee, Abilities.PollenDole, {
    name: 'Pollen Dole',
    description: "Each attack it lands puts 1/16 of its worst hurt teammate's HP back for them.",
  });

  registerSignature(Families.Buizel, Abilities.FloatSac, {
    name: 'Float Sac',
    description: 'It floats above Ground moves and hazards until a blow takes it under 1/2 HP.',
  });

  registerSignature(Families.Cherubi, Abilities.SecondBloom, {
    name: 'Second Bloom',
    description:
      'The first time it falls under 1/2 HP each fight it takes 1/4 of its HP back and 1 stage of Special Attack.',
  });

  /**
   * The balloon, the ears and the claws: one drifts off with whatever
   * it lands on, one uncoils as it goes, and one goes for whatever
   * has been making itself comfortable
   */
  registerSignature(Families.Drifloon, Abilities.CarryOff, {
    name: 'Carry Off',
    description: '20% for an attack it lands to blow the target away, as Whirlwind would.',
  });

  registerSignature(Families.Buneary, Abilities.Springheel, {
    name: 'Springheel',
    description: 'Each of the first 3 attacks it lands raises its Speed 1 stage.',
  });

  registerSignature(Families.Glameow, Abilities.VelvetClaws, {
    name: 'Velvet Claws',
    description: 'Its contact moves hit 1.25x against anything that has raised a stat this fight.',
  });

  /**
   * The skunk, the bell and the shark: one fights whatever it has
   * already poisoned, one tolls for everything facing it, and one
   * reaches what thinks it is out of reach
   */
  registerSignature(Families.Stunky, Abilities.RankAir, {
    name: 'Rank Air',
    description: 'Its moves hit 1.25x against a poisoned target.',
  });

  registerSignature(Families.Bronzor, Abilities.DeepToll, {
    name: 'Deep Toll',
    description: 'Every move it reaches for costs each enemy 1/16 of their HP.',
  });

  registerSignature(Families.Gible, Abilities.Skyhunt, {
    name: 'Skyhunt',
    description: 'Its Ground moves reach what is off the ground, and hit it 1.2x.',
  });

  /**
   * The aura, the sand and the sting: one rises to whatever it is
   * facing, one carries its own weather, and one gets a single blow
   * in before it is seen
   */
  registerSignature(Families.Riolu, Abilities.AuraMatch, {
    name: 'Aura Match',
    description: 'Its moves hit 1.25x against a target holding a larger share of its HP.',
  });

  registerSignature(Families.Hippopotas, Abilities.DustBath, {
    name: 'Dust Bath',
    description: 'It heals 1/16 of its HP every time it reaches for a move while sand blows.',
  });

  registerSignature(Families.Skorupi, Abilities.Ambush, {
    name: 'Ambush',
    description: 'The first move it lands on each enemy hits 1.3x.',
  });

  /**
   * The frog, the fish and the tree: one throws the blow that ends
   * it, one takes what was aimed at somebody worse off, and one
   * stands in the winter it brought
   */
  registerSignature(Families.Croagunk, Abilities.Finisher, {
    name: 'Finisher',
    description: 'Its moves wind up 25% faster against a target at or below 1/4 HP.',
  });

  registerSignature(Families.Finneon, Abilities.FalseEyes, {
    name: 'False Eyes',
    description: 'A single-target move aimed at a teammate below 1/2 HP comes to it instead.',
  });

  registerSignature(Families.Snover, Abilities.Evergreen, {
    name: 'Evergreen',
    description: 'Fire moves hit it at 0.5x while hail or snow falls.',
  });

  /**
   * The lake trio: each of them hands its own side the thing it was
   * made to keep, one stage of it, as it arrives. The birds' wingbeat
   * turned around
   */
  registerSignature(Families.Uxie, Abilities.Mindgift, {
    name: 'Mindgift',
    description: 'Its whole team gains 1 stage of accuracy as it takes the field.',
  });

  registerSignature(Families.Mesprit, Abilities.Heartgift, {
    name: 'Heartgift',
    description: 'Its whole team gains 1 stage of Special Attack as it takes the field.',
  });

  registerSignature(Families.Azelf, Abilities.Willgift, {
    name: 'Willgift',
    description: 'Its whole team gains 1 stage of Attack as it takes the field.',
  });
}
