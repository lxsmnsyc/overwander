import Abilities from '../ids/abilities';
import { registerAbility } from './__create';

/**
 * One invented ability per evolution family, themed on what the line
 * is and how it fights. None of them are rolled at birth or bred for:
 * they are granted, so a species' ordinary pool is untouched
 */
export default function registerSignatureAbilities(): void {
  // Bulbasaur
  registerAbility(Abilities.SeedCache, {
    name: 'Seed Cache',
    description:
      'Banks 1/4 of every hit it takes, up to 1/2 of its HP. The next Grass move it lands spends the bank as extra damage.',
  });

  // Charmander
  registerAbility(Abilities.Afterburn, {
    name: 'Afterburn',
    description:
      'Each Fire move it lands cuts 15% off its cast and channel times, up to 45%, and nothing takes the heat back.',
  });

  // Squirtle
  registerAbility(Abilities.Overpressure, {
    name: 'Overpressure',
    description:
      'Water moves hit 1.3x, but each one it lands adds 20% to its own cooldowns, up to 60%. A move of another type clears the fouling.',
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

  // Nidoran (female)
  registerAbility(Abilities.RegalHide, {
    name: 'Regal Hide',
    description:
      'Physical moves hit her at 0.7x while she is at or above 1/2 HP. Below it, everything hits her at 1.15x.',
  });

  // Nidoran (male)
  registerAbility(Abilities.RegalVenom, {
    name: 'Regal Venom',
    description:
      'Poison it inflicts is always the badly-poisoned kind, and its moves hit 1.3x against a poisoned target.',
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

  // Omanyte
  registerAbility(Abilities.SpiralShell, {
    name: 'Spiral Shell',
    description: 'Each blow from the same attacker lands 10% weaker than their last, down to 0.6x.',
  });

  // Kabuto
  registerAbility(Abilities.SerratedEdge, {
    name: 'Serrated Edge',
    description:
      'A contact move it lands leaves a cut: that enemy loses 1/16 of its HP each time it acts for 6 seconds.',
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

  // Articuno
  registerAbility(Abilities.AbsoluteCalm, {
    name: 'Absolute Calm',
    description:
      'It cannot be made to flinch, confused or infatuated, and statuses on it run out in half the time.',
  });

  // Zapdos
  registerAbility(Abilities.LightningReflexes, {
    name: 'Lightning Reflexes',
    description: 'Its cast times are 25% shorter, and it cannot be paralysed or made to flinch.',
  });

  // Moltres
  registerAbility(Abilities.Ashfall, {
    name: 'Ashfall',
    description: 'When it faints, it casts Will-O-Wisp at every standing enemy.',
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

  // Chikorita
  registerAbility(Abilities.PetalBed, {
    name: 'Petal Bed',
    description:
      'Its allies heal 1/16 of their HP each time they act. It never heals itself this way.',
  });

  // Cyndaquil
  registerAbility(Abilities.Ignition, {
    name: 'Ignition',
    description: 'It casts Will-O-Wisp at an enemy as it arrives on the field.',
  });

  // Totodile
  registerAbility(Abilities.GatorGrip, {
    name: 'Gator Grip',
    description: 'A contact move it lands casts Bind on that target.',
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
}
