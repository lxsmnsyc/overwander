import Abilities from '../ids/abilities';
import { registerAbility } from './__create';

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
  // Bulbasaur
  registerAbility(Abilities.VerdantField, {
    name: 'Verdant Field',
    description:
      'Grass moves hit 1.2x and Water moves 0.8x for everybody on the field while it stands.',
  });

  // Charmander
  registerAbility(Abilities.EmberField, {
    name: 'Ember Field',
    description:
      'Fire moves hit 1.2x and Grass moves 0.8x for everybody on the field while it stands.',
  });

  // Squirtle
  registerAbility(Abilities.DelugeField, {
    name: 'Deluge Field',
    description:
      'Water moves hit 1.2x and Fire moves 0.8x for everybody on the field while it stands.',
  });

  // Caterpie
  registerAbility(Abilities.PowderBurst, {
    name: 'Powder Burst',
    description: 'Its status moves reach every enemy on the field, not only the one it aimed at.',
  });

  // Weedle
  registerAbility(Abilities.TwinStinger, {
    name: 'Twin Stinger',
    description:
      'Each physical move it uses strikes twice at 60% power, so anything that answers a landed blow answers both.',
  });

  // Pidgey
  registerAbility(Abilities.Slipstream, {
    name: 'Slipstream',
    description: 'Cast times are 20% shorter for everybody on the field, enemies included.',
  });

  // Rattata
  registerAbility(Abilities.Nibble, {
    name: 'Nibble',
    description: "Every move it lands takes another 1/32 of the target's HP, whatever its armour.",
  });

  // Spearow
  registerAbility(Abilities.Relentless, {
    name: 'Relentless',
    description:
      'Each move it lands on the same target as the last hits 10% harder, up to 1.4x. Aiming at anybody else starts it over.',
  });

  // Ekans
  registerAbility(Abilities.Squeeze, {
    name: 'Squeeze',
    description:
      'While it casts or channels, the last enemy it touched loses 1/16 of its HP each second.',
  });

  // Pikachu
  registerAbility(Abilities.ChainLightning, {
    name: 'Chain Lightning',
    description:
      'An Electric move it lands arcs to one other standing enemy for 1/3 of the damage it dealt.',
  });

  // Sandshrew
  registerAbility(Abilities.CurlUp, {
    name: 'Curl Up',
    description: 'Each hit it takes casts Defense Curl on itself.',
  });

  /**
   * The two Nidoran lines are counterparts, so both are paid in poison:
   * every poisoned enemy lifts the holder, the female on the defending
   * side of a blow and the male on the attacking one
   */

  // Nidoran (female)
  registerAbility(Abilities.QueensCourt, {
    name: "Queen's Court",
    description:
      'Her Defense and Special Defense are 1.15x for each poisoned enemy on the field, counting up to 3.',
  });

  // Nidoran (male)
  registerAbility(Abilities.KingsCourt, {
    name: "King's Court",
    description:
      'His Attack and Special Attack are 1.15x for each poisoned enemy on the field, counting up to 3.',
  });

  // Clefairy
  registerAbility(Abilities.WishingWell, {
    name: 'Wishing Well',
    description: 'Each time it acts, it casts Wish on the ally lowest on HP.',
  });

  // Vulpix
  registerAbility(Abilities.NineTails, {
    name: 'Nine Tails',
    description: 'Its Special Attack rises 8% for each hit it has taken, up to 9 hits.',
  });

  // Jigglypuff
  registerAbility(Abilities.Lullaby, {
    name: 'Lullaby',
    description:
      'Sleep it inflicts lasts 1.5x as long, and its moves hit 1.5x against a sleeping target.',
  });

  // Zubat
  registerAbility(Abilities.Bloodthirst, {
    name: 'Bloodthirst',
    description:
      'Draining moves and Leech Seed restore 1.5x for it. Every other heal on it is halved.',
  });

  // Oddish
  registerAbility(Abilities.DeepRoots, {
    name: 'Deep Roots',
    description: 'It casts Ingrain on itself as it arrives on the field.',
  });

  // Paras
  registerAbility(Abilities.FungalBloom, {
    name: 'Fungal Bloom',
    description:
      'Heals 1/8 of its HP each time it lands poison, sleep, paralysis, a burn or a freeze on an enemy.',
  });

  // Venonat
  registerAbility(Abilities.DustStorm, {
    name: 'Dust Storm',
    description: 'Its Special Attack rises 12% for every enemy carrying a status, up to 4 of them.',
  });

  // Diglett
  registerAbility(Abilities.Undermine, {
    name: 'Undermine',
    description:
      'Each move it lands leaves that enemy taking 5% more from everybody, up to 25%, for the rest of the fight.',
  });

  // Meowth
  registerAbility(Abilities.Cutpurse, {
    name: 'Cutpurse',
    description: 'The first move it lands on each enemy knocks their held item away.',
  });

  // Psyduck
  registerAbility(Abilities.HeadacheBurst, {
    name: 'Headache Burst',
    description: 'At or below 1/2 HP its Special Attack is 1.5x and its Psychic moves cannot miss.',
  });

  // Mankey
  registerAbility(Abilities.BlindRage, {
    name: 'Blind Rage',
    description:
      'Its Attack is 1.4x and its moves are 15% less accurate. Nothing can heal it while the rage is on.',
  });

  // Growlithe
  registerAbility(Abilities.ChaseDown, {
    name: 'Chase Down',
    description:
      'Its moves hit 1.5x against a target at or below 1/3 HP, and such a target cannot flee from it.',
  });

  // Poliwag
  registerAbility(Abilities.HypnoticSpiral, {
    name: 'Hypnotic Spiral',
    description: 'Whoever lands a contact move on it takes 30% longer over their next cast.',
  });

  // Abra
  registerAbility(Abilities.TeleportGuard, {
    name: 'Teleport Guard',
    description:
      'It blinks away from the first attack that would land on it, then needs 10 seconds to do it again.',
  });

  // Machop
  registerAbility(Abilities.OverheadThrow, {
    name: 'Overhead Throw',
    description:
      'Its contact moves hit 1.4x against a target heavier than it, and 1.1x against a lighter one.',
  });

  // Bellsprout
  registerAbility(Abilities.Digest, {
    name: 'Digest',
    description:
      'Landing a move on a target at or below 1/4 HP heals it 1/4 of its own HP. A finished target counts.',
  });

  // Tentacool
  registerAbility(Abilities.TentacleGrasp, {
    name: 'Tentacle Grasp',
    description: 'No enemy it has landed a move on may flee while it is still standing.',
  });

  // Geodude
  registerAbility(Abilities.SolidCore, {
    name: 'Solid Core',
    description: 'Physical moves hit it at 0.7x and special moves at 1.3x.',
  });

  // Ponyta
  registerAbility(Abilities.Gallop, {
    name: 'Gallop',
    description:
      'Its Speed rises 10% each time it acts, up to 1.5x. Any hit it takes brings it back to a standstill.',
  });

  // Slowpoke
  registerAbility(Abilities.DelayedReaction, {
    name: 'Delayed Reaction',
    description: 'It only feels half of each hit at once. The other half arrives 4 seconds later.',
  });

  // Magnemite
  registerAbility(Abilities.RepulsionField, {
    name: 'Repulsion Field',
    description: 'Special moves hit at 0.9x for everybody on the field, its own included.',
  });

  // Farfetch'd
  registerAbility(Abilities.LeekDuelist, {
    name: 'Leek Duelist',
    description:
      'Its critical stage is 2 higher and its criticals hit 1.25x harder. Everything hits it 1.25x in return.',
  });

  // Doduo
  registerAbility(Abilities.SecondHead, {
    name: 'Second Head',
    description: 'Every third move it lands strikes again at once for 50% power.',
  });

  // Seel
  registerAbility(Abilities.SleekHide, {
    name: 'Sleek Hide',
    description: 'Contact moves hit it at 0.75x and everything else at 1.1x.',
  });

  // Grimer
  registerAbility(Abilities.CorrosiveOoze, {
    name: 'Corrosive Ooze',
    description:
      'Whoever lands a contact move on it has their held item destroyed, not knocked loose.',
  });

  // Shellder
  registerAbility(Abilities.SpikeShell, {
    name: 'Spike Shell',
    description: 'Contact moves hit it at 0.5x, and whoever lands one takes 1/8 of their own HP.',
  });

  // Gastly
  registerAbility(Abilities.NightTerror, {
    name: 'Night Terror',
    description: 'An enemy it damages cannot be healed for the next 4 seconds.',
  });

  // Onix
  registerAbility(Abilities.LivingTunnel, {
    name: 'Living Tunnel',
    description:
      'Its allies take 0.8x from Rock and Ground moves while it stands, and it takes those at 1.2x.',
  });

  // Drowzee
  registerAbility(Abilities.DreamFeast, {
    name: 'Dream Feast',
    description: 'Landing a move on a sleeping target heals it 1/8 of its HP.',
  });

  // Krabby
  registerAbility(Abilities.HeavyPincer, {
    name: 'Heavy Pincer',
    description: 'Its physical moves hit 1.45x while it is at or above 1/2 HP.',
  });

  // Voltorb
  registerAbility(Abilities.Overload, {
    name: 'Overload',
    description: 'Its Speed doubles below 1/2 HP.',
  });

  // Exeggcute
  registerAbility(Abilities.Psyseed, {
    name: 'Psyseed',
    description: 'An enemy its Psychic moves damage has Leech Seed cast on it.',
  });

  // Cubone
  registerAbility(Abilities.MourningBone, {
    name: 'Mourning Bone',
    description: 'Its moves hit 1.4x while it is the only one left standing on its side.',
  });

  // Tyrogue
  registerAbility(Abilities.SecondWind, {
    name: 'Second Wind',
    description: 'The first time it falls below 1/4 HP it heals 1/3 of its HP. Once per battle.',
  });

  // Lickitung
  registerAbility(Abilities.TasteEverything, {
    name: 'Taste Everything',
    description:
      'A contact move it lands on a berry holder eats that berry, healing or curing it as the berry would.',
  });

  // Koffing
  registerAbility(Abilities.SmogScreen, {
    name: 'Smog Screen',
    description: 'Enemy moves are 15% less accurate while it stands. Its own side sees fine.',
  });

  // Rhyhorn
  registerAbility(Abilities.Corkscrew, {
    name: 'Corkscrew',
    description: 'Its contact moves hit 1.15x and ignore any Defense the target has raised.',
  });

  // Chansey
  registerAbility(Abilities.Cushioned, {
    name: 'Cushioned',
    description: 'No single hit takes more than 1/6 of its HP off it.',
  });

  // Tangela
  registerAbility(Abilities.VineWeb, {
    name: 'Vine Web',
    description: 'It lays a layer of Spikes on the enemy side each time it arrives on the field.',
  });

  // Kangaskhan
  registerAbility(Abilities.MothersShield, {
    name: "Mother's Shield",
    description: 'Enemy moves aimed at an ally below 1/2 HP are aimed at her instead.',
  });

  // Horsea
  registerAbility(Abilities.WhirlCurrent, {
    name: 'Whirl Current',
    description: 'Enemy cast times are 20% longer while rain is falling.',
  });

  // Goldeen
  registerAbility(Abilities.Upstream, {
    name: 'Upstream',
    description: 'Its moves hit 1.35x against any target with more HP than its own.',
  });

  // Staryu
  registerAbility(Abilities.CoreReset, {
    name: 'Core Reset',
    description: 'Each time it acts, one stat drop on it is undone.',
  });

  // Mr. Mime
  registerAbility(Abilities.MimedBarrier, {
    name: 'Mimed Barrier',
    description:
      'It casts Light Screen over its side as it arrives, and physical moves hit it at 1.15x itself.',
  });

  // Scyther
  registerAbility(Abilities.CleanCut, {
    name: 'Clean Cut',
    description: "Its critical hits ignore every stage on the target's defending stat.",
  });

  // Jynx
  registerAbility(Abilities.IcyCharm, {
    name: 'Icy Charm',
    description: 'Its moves hit 1.5x against a target that is infatuated or confused.',
  });

  // Electabuzz
  registerAbility(Abilities.StaticField, {
    name: 'Static Field',
    description: 'Its Speed rises 15% for each contact hit it has taken, up to 4 of them.',
  });

  // Magmar
  registerAbility(Abilities.BlastFurnace, {
    name: 'Blast Furnace',
    description: 'Its Fire moves burn the target 30% of the time.',
  });

  // Pinsir
  registerAbility(Abilities.Snapjaw, {
    name: 'Snapjaw',
    description: 'Its moves hit 1.5x against a target that is casting or channelling.',
  });

  // Tauros
  registerAbility(Abilities.Bullheaded, {
    name: 'Bullheaded',
    description: 'Its contact moves hit 1.3x, and everything hits it 1.15x in return.',
  });

  // Magikarp
  registerAbility(Abilities.LateBloomer, {
    name: 'Late Bloomer',
    description:
      'Its moves hit 5% harder for every 10 seconds it has been in the fight, up to 1.5x.',
  });

  // Lapras
  registerAbility(Abilities.SafePassage, {
    name: 'Safe Passage',
    description:
      'It casts Safeguard over its side as it arrives, and its allies cannot be stopped from fleeing.',
  });

  // Ditto
  registerAbility(Abilities.AdaptiveCell, {
    name: 'Adaptive Cell',
    description:
      'It takes 0.5x from the type of the last move that hit it, until a move of another type lands.',
  });

  // Eevee
  registerAbility(Abilities.LatentPotential, {
    name: 'Latent Potential',
    description: 'Whichever of its five battle stats is lowest counts 1.3x.',
  });

  // Porygon
  registerAbility(Abilities.Rollback, {
    name: 'Rollback',
    description:
      'The first time it drops below 1/2 HP, its health goes back to what it was 4 seconds earlier.',
  });

  /**
   * The two Kanto fossils are counterparts, and both are written on the
   * defending side of a blow: the shell raises its own defences and the
   * blade cuts into whatever it strikes, so each answers the other
   */

  // Omanyte
  registerAbility(Abilities.HelixShell, {
    name: 'Helix Shell',
    description: 'Its Defense and Special Defense count as 1.25x against every blow it takes.',
  });

  // Kabuto
  registerAbility(Abilities.DomeBlade, {
    name: 'Dome Blade',
    description: "Its blows count the target's Defense or Special Defense as 0.75x.",
  });

  // Aerodactyl
  registerAbility(Abilities.PredatorsDive, {
    name: "Predator's Dive",
    description: 'Its first move against each enemy hits 1.5x.',
  });

  // Snorlax
  registerAbility(Abilities.FullBelly, {
    name: 'Full Belly',
    description: 'It heals 1/16 of its HP every time it acts, and its cast times are 25% longer.',
  });

  /**
   * The three birds share one signature: the beat of the wings as one
   * takes the field, told in the stat its own weather works on
   */
  // Articuno
  registerAbility(Abilities.Frostwing, {
    name: 'Frostwing',
    description: 'Every enemy loses a stage of Speed as it arrives on the field.',
  });

  // Zapdos
  registerAbility(Abilities.Stormwing, {
    name: 'Stormwing',
    description: 'Every enemy loses a stage of Special Defense as it arrives on the field.',
  });

  // Moltres
  registerAbility(Abilities.Emberwing, {
    name: 'Emberwing',
    description: 'Every enemy loses a stage of Defense as it arrives on the field.',
  });

  // Dratini
  registerAbility(Abilities.SereneStorm, {
    name: 'Serene Storm',
    description:
      'Weather it calls up never clears on its own, and its side takes no damage from any weather.',
  });

  // Mewtwo
  registerAbility(Abilities.GeneticApex, {
    name: 'Genetic Apex',
    description: 'Its highest battle stat counts 1.25x and its lowest counts 0.8x.',
  });

  // Mew
  registerAbility(Abilities.AncestralMemory, {
    name: 'Ancestral Memory',
    description: 'Any type that has already hit it once hits it at 0.85x thereafter.',
  });

  /**
   * The Johto starters share one signature: each leaves its element on
   * whatever it lands a move on, paid as that thing acts
   */
  // Chikorita
  registerAbility(Abilities.Sapmark, {
    name: 'Sapmark',
    description:
      'Anything it lands a move on loses 1/16 of its HP each time it acts, and Chikorita drinks the same.',
  });

  // Cyndaquil
  registerAbility(Abilities.Embermark, {
    name: 'Embermark',
    description:
      'Anything it lands a move on loses 1/16 of its HP each time it acts, or 1/8 while it is burned.',
  });

  // Totodile
  registerAbility(Abilities.Jawmark, {
    name: 'Jawmark',
    description:
      'The one thing it has its jaws in loses 1/8 of its HP each time it acts. Only ever one at a time.',
  });

  // Sentret
  registerAbility(Abilities.Sentry, {
    name: 'Sentry',
    description: 'Nobody on its side can be hit by a critical hit while it stands.',
  });

  // Hoothoot
  registerAbility(Abilities.WatchfulRoost, {
    name: 'Watchful Roost',
    description: 'It casts Reflect over its side as it arrives on the field.',
  });

  // Ledyba
  registerAbility(Abilities.Relay, {
    name: 'Relay',
    description: 'Whenever it is switched out, its stat stages carry to the teammate coming in.',
  });

  // Spinarak
  registerAbility(Abilities.SilkSnare, {
    name: 'Silk Snare',
    description: 'It casts String Shot at every standing enemy as it arrives on the field.',
  });

  // Chinchou
  registerAbility(Abilities.LanternLure, {
    name: 'Lantern Lure',
    description: 'It casts Confuse Ray at an enemy as it arrives on the field.',
  });

  // Togepi
  registerAbility(Abilities.GoodOmen, {
    name: 'Good Omen',
    description: 'No move from its side can miss while it stands.',
  });

  // Natu
  registerAbility(Abilities.Prophecy, {
    name: 'Prophecy',
    description: 'It casts Future Sight at an enemy as it arrives on the field.',
  });

  // Mareep
  registerAbility(Abilities.LiveWire, {
    name: 'Live Wire',
    description: 'It casts Thunder Wave at an enemy as it arrives on the field.',
  });

  // Marill
  registerAbility(Abilities.Spillover, {
    name: 'Spillover',
    description: 'Healing past its full HP is thrown at an enemy as damage rather than wasted.',
  });

  // Sudowoodo
  registerAbility(Abilities.FalseWood, {
    name: 'False Wood',
    description:
      'It counts as a Grass type for working out what hurts it, until the first hit lands on it.',
  });

  // Hoppip
  registerAbility(Abilities.Updraft, {
    name: 'Updraft',
    description: 'It cannot be trapped, its Speed cannot be lowered, and it always gets away.',
  });

  // Aipom
  registerAbility(Abilities.Tailthrow, {
    name: 'Tailthrow',
    description: 'It casts Fling as it arrives on the field, throwing its held item at an enemy.',
  });

  // Sunkern
  registerAbility(Abilities.SunlitCharge, {
    name: 'Sunlit Charge',
    description: 'Its channelled moves hit 1.3x and cannot be interrupted.',
  });

  // Yanma
  registerAbility(Abilities.Resonance, {
    name: 'Resonance',
    description: 'Its sound moves reach every enemy on the field, not only the one it aimed at.',
  });

  // Wooper
  registerAbility(Abilities.ContagiousYawn, {
    name: 'Contagious Yawn',
    description: 'It casts Yawn at an enemy as it arrives on the field.',
  });

  // Murkrow
  registerAbility(Abilities.Magpie, {
    name: 'Magpie',
    description: 'Any held item taken off somebody else on the field goes into its empty hands.',
  });

  // Misdreavus
  registerAbility(Abilities.SharedMisery, {
    name: 'Shared Misery',
    description:
      'The first time it drops below 1/3 of its HP it casts Pain Split at the healthiest enemy.',
  });

  // Unown
  registerAbility(Abilities.RuinousScript, {
    name: 'Ruinous Script',
    description: 'Held items do nothing on the enemy side while it stands.',
  });

  // Wobbuffet
  registerAbility(Abilities.Backlash, {
    name: 'Backlash',
    description:
      'It banks 1/4 of every hit it takes, and pays the bank back to whoever last struck it when it next acts.',
  });

  // Girafarig
  registerAbility(Abilities.Ambidextrous, {
    name: 'Ambidextrous',
    description:
      'Its moves are worked out from whichever of its Attack and Special Attack is higher.',
  });

  // Pineco
  registerAbility(Abilities.Shrapnel, {
    name: 'Shrapnel',
    description: 'When it faints, it casts Spikes and Toxic Spikes onto the enemy side.',
  });

  // Dunsparce
  registerAbility(Abilities.EvenKeel, {
    name: 'Even Keel',
    description: 'Each of its five battle stats counts as the average of all five.',
  });

  // Gligar
  registerAbility(Abilities.SandRider, {
    name: 'Sand Rider',
    description: 'While sand blows, its moves cannot miss and everything hits it at 0.75x.',
  });

  // Snubbull
  registerAbility(Abilities.Bully, {
    name: 'Bully',
    description: 'Its moves hit 1.3x against a target whose Attack has been lowered.',
  });

  // Qwilfish
  registerAbility(Abilities.LastBarb, {
    name: 'Last Barb',
    description: 'When it faints, it casts Toxic at whoever finished it.',
  });

  // Shuckle
  registerAbility(Abilities.Fermenter, {
    name: 'Fermenter',
    description: 'Each time it acts with a free hand, a Berry Juice appears in it.',
  });

  // Heracross
  registerAbility(Abilities.Heave, {
    name: 'Heave',
    description: 'The first contact move it lands on each enemy casts Whirlwind at them.',
  });

  // Sneasel
  registerAbility(Abilities.SharpClaw, {
    name: 'Sharp Claw',
    description: "Each contact move it lands drops the target's Defense by a stage.",
  });

  // Teddiursa
  registerAbility(Abilities.SweetPaw, {
    name: 'Sweet Paw',
    description: 'Its contact moves heal it 1/8 of the damage they deal.',
  });

  // Slugma
  registerAbility(Abilities.MagmaTrail, {
    name: 'Magma Trail',
    description: 'Every standing enemy loses 1/16 of its HP each time it acts while it stands.',
  });

  // Swinub
  registerAbility(Abilities.Icebreaker, {
    name: 'Icebreaker',
    description: "A move it lands tears Reflect and Light Screen off the target's side.",
  });

  // Corsola
  registerAbility(Abilities.CoralBloom, {
    name: 'Coral Bloom',
    description: 'Whenever it is healed, the ally lowest on HP is healed the same amount.',
  });

  // Remoraid
  registerAbility(Abilities.Standoff, {
    name: 'Standoff',
    description: 'Nothing it uses counts as contact, so it never sets off what answers a touch.',
  });

  // Delibird
  registerAbility(Abilities.Delivery, {
    name: 'Delivery',
    description: 'It hands a Berry Juice to the ally lowest on HP as it arrives on the field.',
  });

  // Mantine
  registerAbility(Abilities.Escort, {
    name: 'Escort',
    description: "Its allies' Special Defense counts 1.3x while it stands.",
  });

  // Skarmory
  registerAbility(Abilities.Steelmolt, {
    name: 'Steelmolt',
    description: 'Each hit it takes lays a layer of Spikes on the enemy side.',
  });

  // Houndour
  registerAbility(Abilities.PackHowl, {
    name: 'Pack Howl',
    description: 'Every ally gains a stage of Attack as it arrives on the field.',
  });

  // Phanpy
  registerAbility(Abilities.Momentum, {
    name: 'Momentum',
    description:
      'Its moves hit 1.1x for each move it has landed since taking the field, up to 1.5x.',
  });

  // Stantler
  registerAbility(Abilities.MindFog, {
    name: 'Mind Fog',
    description: 'Enemy Special Attack counts 0.85x while it stands.',
  });

  // Smeargle
  registerAbility(Abilities.Palette, {
    name: 'Palette',
    description: 'Its moves take the type of the last move that hit it.',
  });

  // Miltank
  registerAbility(Abilities.Cowbell, {
    name: 'Cowbell',
    description: 'It casts Heal Bell over its side as it arrives on the field.',
  });

  /**
   * The three beasts share one signature, told three ways: what Ho-Oh
   * did for them in the burned tower, once per battle
   */
  // Raikou
  registerAbility(Abilities.RisenThunder, {
    name: 'Risen Thunder',
    description:
      'The first blow that would finish it leaves it on 1 HP, cured, and a stage faster. Once per battle.',
  });

  // Entei
  registerAbility(Abilities.RisenFlame, {
    name: 'Risen Flame',
    description:
      'The first blow that would finish it leaves it on 1 HP, cured, and a stage stronger. Once per battle.',
  });

  // Suicune
  registerAbility(Abilities.RisenTide, {
    name: 'Risen Tide',
    description:
      'The first blow that would finish it leaves it on 1 HP, cured, and a stage harder to hurt. Once per battle.',
  });

  // Larvitar
  registerAbility(Abilities.Tyrant, {
    name: 'Tyrant',
    description: 'Nothing on the enemy side can raise a stat while it stands.',
  });

  /**
   * The tower duo share one signature, told either side of a fall: the
   * guardian keeps its side standing once per battle
   */
  // Lugia
  registerAbility(Abilities.SilverAegis, {
    name: 'Silver Aegis',
    description:
      'The first blow that would finish an ally leaves it on 1 HP instead. Once per battle.',
  });

  // Ho-Oh
  registerAbility(Abilities.RainbowRekindling, {
    name: 'Rainbow Rekindling',
    description: 'The first ally to fall gets back up on 1/3 of its HP. Once per battle.',
  });

  // Celebi
  registerAbility(Abilities.TimelineSplit, {
    name: 'Timeline Split',
    description:
      'The first time it drops below 1/2 HP, every stat drop on it is undone and every status cleared.',
  });

  /**
   * The Hoenn starters share one signature: each grows through the
   * fight in the stat its line is built on, up to three stages of its
   * own making
   */
  // Treecko
  registerAbility(Abilities.SapSurge, {
    name: 'Sap Surge',
    description: 'It gains a stage of Speed each time it acts, up to 3 of its own.',
  });

  // Torchic
  registerAbility(Abilities.EmberSurge, {
    name: 'Ember Surge',
    description: 'It gains a stage of Attack each time it lands a move, up to 3 of its own.',
  });

  // Mudkip
  registerAbility(Abilities.SiltSurge, {
    name: 'Silt Surge',
    description:
      'It gains a stage of Special Defense each time it takes a hit, up to 3 of its own.',
  });

  // Poochyena
  registerAbility(Abilities.PackHunt, {
    name: 'Pack Hunt',
    description: 'Its moves hit 1.2x against anything an ally has already damaged.',
  });

  // Zigzagoon
  registerAbility(Abilities.CrookedRun, {
    name: 'Crooked Run',
    description:
      'Each time it acts, moves aimed at it are 0.9x as accurate, stacking 3 times. A landed blow clears it.',
  });

  // Wurmple
  registerAbility(Abilities.Cocoon, {
    name: 'Cocoon',
    description:
      'The first time it drops below 1/2 HP, it shells over for 4 seconds: it deals and takes 0.5x damage.',
  });

  /**
   * Lotad and Seedot are counterparts, so each calls up its own sky on
   * taking the field and lives off it. Whichever arrived last owns the
   * weather, which is what makes the two cancel
   */

  // Lotad
  registerAbility(Abilities.WaterBloom, {
    name: 'Water Bloom',
    description:
      'It calls up Rain as it takes the field, and heals 1/16 of its HP each time it acts in Rain.',
  });

  // Seedot
  registerAbility(Abilities.SunRoot, {
    name: 'Sun Root',
    description: 'It calls up Sun as it takes the field, and its moves deal 1.3x damage in Sun.',
  });

  // Taillow
  registerAbility(Abilities.FearlessDive, {
    name: 'Fearless Dive',
    description: 'Its moves hit 1.3x against a target on a higher share of its HP than it has.',
  });

  // Wingull
  registerAbility(Abilities.BillCarry, {
    name: 'Bill Carry',
    description:
      'It arrives carrying a Sitrus Berry, handed to the neediest empty-handed ally or kept if there is none.',
  });

  // Ralts
  registerAbility(Abilities.Empath, {
    name: 'Empath',
    description: 'Its Special Attack counts 1.3x while any ally is below 1/2 HP.',
  });

  // Surskit
  registerAbility(Abilities.SurfaceWalk, {
    name: 'Surface Walk',
    description: 'It takes no damage from hazards or from weather.',
  });

  // Shroomish
  registerAbility(Abilities.Mycelium, {
    name: 'Mycelium',
    description:
      'Anything carrying poison, sleep, paralysis, a burn or a freeze takes 1.2x from every blow while it stands.',
  });

  // Slakoth
  registerAbility(Abilities.WideSwing, {
    name: 'Wide Swing',
    description: 'Its physical moves reach every enemy on the field, not only the one it aimed at.',
  });

  // Nincada
  registerAbility(Abilities.VanishingAct, {
    name: 'Vanishing Act',
    description: 'For 1 second after it lands a move, moves aimed at it miss.',
  });

  // Whismur
  registerAbility(Abilities.EchoChamber, {
    name: 'Echo Chamber',
    description: 'A sound move it lands echoes 2 seconds later for 1/4 of the damage it dealt.',
  });

  // Makuhita
  registerAbility(Abilities.Shove, {
    name: 'Shove',
    description:
      'A contact move it lands on an enemy winding a move up flinches them, costing them that cast.',
  });

  // Nosepass
  registerAbility(Abilities.Magnetize, {
    name: 'Magnetize',
    description: 'Enemy moves aimed at one of its allies are pulled onto it instead.',
  });

  // Skitty
  registerAbility(Abilities.KittenPace, {
    name: 'Kitten Pace',
    description: 'Its Speed counts 1.3x while it is at full HP.',
  });

  /**
   * Sableye and Mawile are counterparts, and both work on what the far
   * side has built up: Sableye knocks a raised stage off, Mawile takes
   * that stage for itself
   */

  // Sableye
  registerAbility(Abilities.ShadowTax, {
    name: 'Shadow Tax',
    description: 'A move it lands removes one raised stage from the target.',
  });

  // Mawile
  registerAbility(Abilities.JawClaim, {
    name: 'Jaw Claim',
    description: 'A move it lands moves one raised stage from the target onto itself.',
  });

  // Aron
  registerAbility(Abilities.OreHunger, {
    name: 'Ore Hunger',
    description:
      'Steel, Rock and Ground moves deal it no damage and heal it 1/4 of what they would have.',
  });

  // Meditite
  registerAbility(Abilities.Chakra, {
    name: 'Chakra',
    description:
      'Every move it uses is worked out from the higher of its Attack and Special Attack.',
  });

  // Electrike
  registerAbility(Abilities.JoltStart, {
    name: 'Jolt Start',
    description: 'Its first move of a battle goes off a step ahead of everything and hits 1.5x.',
  });

  /**
   * Plusle and Minun are counterparts, and each works one end of the
   * field as it acts: Plusle lifts the ally that needs it, Minun takes
   * the strongest enemy down a step
   */

  // Plusle
  registerAbility(Abilities.CheerOn, {
    name: 'Cheer On',
    description:
      'Each time it acts, the ally lowest on HP gains a stage in its best stat, up to 3 times a battle.',
  });

  // Minun
  registerAbility(Abilities.JeerAt, {
    name: 'Jeer At',
    description:
      'Each time it acts, the enemy highest on HP loses a stage in its best stat, up to 3 times a battle.',
  });

  /**
   * Volbeat and Illumise are counterparts, and each hangs an aura over
   * the far side for as long as it stands: the light leaves nowhere to
   * hide, the scent leaves nobody quick
   */

  // Volbeat
  registerAbility(Abilities.TailLight, {
    name: 'Tail Light',
    description: 'Evasion counts for nothing on the enemy side while it stands.',
  });

  // Illumise
  registerAbility(Abilities.LureScent, {
    name: 'Lure Scent',
    description: 'Enemy Speed counts 0.85x while it stands.',
  });

  // Roselia
  registerAbility(Abilities.Perennial, {
    name: 'Perennial',
    description:
      'The first time it drops below 1/4 HP it heals 1/3 of its HP and is cured. Once per battle.',
  });

  // Gulpin
  registerAbility(Abilities.Bottomless, {
    name: 'Bottomless',
    description: 'It heals 1/8 of its HP whenever any held item is consumed on the field.',
  });

  // Carvanha
  registerAbility(Abilities.FeedingFrenzy, {
    name: 'Feeding Frenzy',
    description: 'It gains a stage of Attack whenever any enemy faints, up to 3 of them.',
  });

  // Wailmer
  registerAbility(Abilities.Spout, {
    name: 'Spout',
    description: 'Its Water moves reach every enemy on the field, not only the one it aimed at.',
  });

  // Numel
  registerAbility(Abilities.MagmaVent, {
    name: 'Magma Vent',
    description:
      'The first time it drops below 1/2 HP, every enemy loses 1/8 of their HP. Once per battle.',
  });

  // Torkoal
  registerAbility(Abilities.BodyHeat, {
    name: 'Body Heat',
    description: 'Its Defense and Special Defense count 1.3x while the Sun is up.',
  });

  // Spoink
  registerAbility(Abilities.StoredBounce, {
    name: 'Stored Bounce',
    description:
      'Half of each hit it takes is stored, up to 1/2 its HP, and the next move it lands deals the lot on top.',
  });

  // Spinda
  registerAbility(Abilities.UniqueSpots, {
    name: 'Unique Spots',
    description:
      'It arrives with 2 stages in one random stat and 1 stage off another, rolled fresh each time.',
  });

  // Trapinch
  registerAbility(Abilities.AntlionPit, {
    name: 'Antlion Pit',
    description: 'Any enemy move that misses it costs that enemy 1/8 of their HP.',
  });

  // Cacnea
  registerAbility(Abilities.PatientStalk, {
    name: 'Patient Stalk',
    description:
      'Its moves hit 10% harder for each second it has stood idle, up to 50%, spent on the next one it lands.',
  });

  // Swablu
  registerAbility(Abilities.CloudStep, {
    name: 'Cloud Step',
    description: 'The first move aimed at it each battle deals no damage to it.',
  });

  /**
   * Zangoose and Seviper are counterparts feuding over one thing: the
   * venom. Seviper's every touch poisons, and poison anywhere is what
   * Zangoose hunts, being the one thing venom does nothing to
   */

  // Zangoose
  registerAbility(Abilities.FeudClaws, {
    name: 'Feud Claws',
    description: 'Its moves hit 1.4x against a poisoned target.',
  });

  // Seviper
  registerAbility(Abilities.VenomFang, {
    name: 'Venom Fang',
    description: 'Every contact move it lands leaves the target badly poisoned.',
  });

  /**
   * Lunatone and Solrock are counterparts, and each hangs an aura over
   * the field that the other's presence blots out: with both standing,
   * neither aura applies
   */

  // Lunatone
  registerAbility(Abilities.MoonPull, {
    name: 'Moon Pull',
    description:
      'Its side takes 0.85x damage while it stands, unless a Sun Glare holder stands too.',
  });

  // Solrock
  registerAbility(Abilities.SunGlare, {
    name: 'Sun Glare',
    description: 'Enemies take 1.15x damage while it stands, unless a Moon Pull holder stands too.',
  });

  // Barboach
  registerAbility(Abilities.SiltBed, {
    name: 'Silt Bed',
    description:
      'Every grounded pokemon on the field, its own side included, has Speed count 0.9x.',
  });

  // Corphish
  registerAbility(Abilities.DirtyFighter, {
    name: 'Dirty Fighter',
    description: 'Its moves hit 1.3x against a target still at full HP.',
  });

  // Baltoy
  registerAbility(Abilities.SpinBalance, {
    name: 'Spin Balance',
    description:
      'It cannot be flinched, cannot be forced off the field, and its stages cannot be lowered.',
  });

  /**
   * Lileep and Anorith are Hoenn's two fossils, so they are counterparts:
   * the one that anchors what it touches, and the one that runs down
   * whatever cannot get away
   */

  // Lileep
  registerAbility(Abilities.RootHold, {
    name: 'Root Hold',
    description:
      'A move it lands stops that target fleeing for 6 seconds and counts their Speed 0.7x meanwhile.',
  });

  // Anorith
  registerAbility(Abilities.ClawRush, {
    name: 'Claw Rush',
    description: 'Its moves hit 1.3x against any target slower than it.',
  });
}
