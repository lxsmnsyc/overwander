import Abilities from '../ids/abilities';
import { registerAbility } from './__create';

/**
 * Every ability the Gen 1 species can carry, grouped by the line
 * that introduces it — the same grouping the Abilities enum keeps,
 * so the two stay easy to read side by side. The name and the line
 * that describes it live here; what an ability actually does is
 * wired in the battle engine, and which species can roll it lives in
 * the species data.
 */
export default function registerGen1Abilities(): void {
  // Bulbasaur
  registerAbility(Abilities.Overgrow, {
    name: 'Overgrow',
    description: '1.5x Grass moves at a third of its pool or less.',
  });
  registerAbility(Abilities.Chlorophyll, {
    name: 'Chlorophyll',
    description: 'Doubles Speed in sunlight.',
  });
  registerAbility(Abilities.ThickFat, {
    name: 'Thick Fat',
    description: 'Halves the Attack behind Fire and Ice moves aimed at it.',
  });

  // Charmander
  registerAbility(Abilities.Blaze, {
    name: 'Blaze',
    description: '1.5x Fire moves at a third of its pool or less.',
  });
  registerAbility(Abilities.SolarPower, {
    name: 'Solar Power',
    description:
      'Doubles Special Attack in sunlight, and costs an eighth of its pool each time it acts.',
  });
  registerAbility(Abilities.ToughClaws, {
    name: 'Tough Claws',
    description: '1.3x power on contact moves.',
  });
  registerAbility(Abilities.Drought, {
    name: 'Drought',
    description: 'Calls out the sun as it enters the field.',
  });

  // Squirtle
  registerAbility(Abilities.Torrent, {
    name: 'Torrent',
    description: '1.5x Water moves at a third of its pool or less.',
  });
  registerAbility(Abilities.RainDish, {
    name: 'Rain Dish',
    description: 'Restores a sixteenth of its pool each time it acts in rain.',
  });

  // Caterpie
  registerAbility(Abilities.ShieldDust, {
    name: 'Shield Dust',
    description: 'Added effects of moves that hit it never land.',
  });
  registerAbility(Abilities.RunAway, {
    name: 'Run Away',
    description: 'Always escapes a wild encounter.',
  });

  // Metapod
  registerAbility(Abilities.ShedSkin, {
    name: 'Shed Skin',
    description: '30% chance to shed a status each time it acts.',
  });

  // Butterfree
  registerAbility(Abilities.CompoundEyes, {
    name: 'Compound Eyes',
    description: '1.3x accuracy.',
  });
  registerAbility(Abilities.TintedLens, {
    name: 'Tinted Lens',
    description: 'Doubles its own not-very-effective blows.',
  });

  // Beedrill
  registerAbility(Abilities.Swarm, {
    name: 'Swarm',
    description: '1.5x Bug moves at a third of its pool or less.',
  });
  registerAbility(Abilities.Sniper, {
    name: 'Sniper',
    description: '1.5x on critical hits.',
  });

  // Pidgey
  registerAbility(Abilities.KeenEye, {
    name: 'Keen Eye',
    description: 'Refuses accuracy drops from anybody else.',
  });
  registerAbility(Abilities.TangledFeet, {
    name: 'Tangled Feet',
    description: 'Doubles evasion while confused.',
  });
  registerAbility(Abilities.BigPecks, {
    name: 'Big Pecks',
    description: 'Refuses Defense drops from anybody else.',
  });

  // Rattata
  registerAbility(Abilities.Guts, {
    name: 'Guts',
    description: '1.5x Attack while statused, and a burn no longer halves its damage.',
  });
  registerAbility(Abilities.Hustle, {
    name: 'Hustle',
    description: '1.5x Attack, but physical moves are 20% less accurate.',
  });

  // Ekans
  registerAbility(Abilities.Intimidate, {
    name: 'Intimidate',
    description: '-1 Attack to every enemy as it enters the field.',
  });
  registerAbility(Abilities.Unnerve, {
    name: 'Unnerve',
    description: 'Enemies cannot eat berries while it is up.',
  });

  // Pikachu
  registerAbility(Abilities.Static, {
    name: 'Static',
    description: '30% to paralyse anything that touches it.',
  });
  registerAbility(Abilities.LightningRod, {
    name: 'Lightning Rod',
    description:
      'Draws Electric moves to itself, takes nothing from them, and gains +1 Special Attack.',
  });

  // Sandshrew
  registerAbility(Abilities.SandVeil, {
    name: 'Sand Veil',
    description: 'Moves are 20% less accurate against it in a sandstorm, which never chips it.',
  });
  registerAbility(Abilities.SandRush, {
    name: 'Sand Rush',
    description: 'Doubles Speed in a sandstorm, which never chips it.',
  });

  // Nidoran
  registerAbility(Abilities.PoisonPoint, {
    name: 'Poison Point',
    description: '30% to poison anything that touches it.',
  });
  registerAbility(Abilities.Rivalry, {
    name: 'Rivalry',
    description: '1.25x against its own gender, 0.75x against the other.',
  });
  registerAbility(Abilities.SheerForce, {
    name: 'Sheer Force',
    description: '1.3x on moves with an added effect, which never lands.',
  });

  // Clefairy
  registerAbility(Abilities.CuteCharm, {
    name: 'Cute Charm',
    description: '30% to infatuate anything that touches it.',
  });
  registerAbility(Abilities.MagicGuard, {
    name: 'Magic Guard',
    description: 'Takes no indirect damage at all.',
  });
  registerAbility(Abilities.FriendGuard, {
    name: 'Friend Guard',
    description: 'Allies take a quarter less damage.',
  });
  registerAbility(Abilities.Unaware, {
    name: 'Unaware',
    description: 'Ignores stat stages on both sides of any blow it is in.',
  });

  // Vulpix
  registerAbility(Abilities.FlashFire, {
    name: 'Flash Fire',
    description: 'Immune to Fire, and 1.5x its own Fire moves once one has been thrown at it.',
  });

  // Jigglypuff
  registerAbility(Abilities.Competitive, {
    name: 'Competitive',
    description: '+2 Special Attack whenever an enemy knocks a stat down.',
  });
  registerAbility(Abilities.Frisk, {
    name: 'Frisk',
    description: 'Reveals what the enemy is holding as it enters the field.',
  });

  // Zubat
  registerAbility(Abilities.InnerFocus, {
    name: 'Inner Focus',
    description: 'Never flinches, and shrugs off an Intimidate.',
  });
  registerAbility(Abilities.Infiltrator, {
    name: 'Infiltrator',
    description: 'Ignores screens and substitutes.',
  });

  // Oddish
  registerAbility(Abilities.Stench, {
    name: 'Stench',
    description: '10% to leave whatever it hits flinching.',
  });
  registerAbility(Abilities.EffectSpore, {
    name: 'Effect Spore',
    description: '30% to poison, paralyse or put to sleep anything that touches it.',
  });

  // Paras
  registerAbility(Abilities.DrySkin, {
    name: 'Dry Skin',
    description:
      'Immune to Water and healed a quarter by it. Rain feeds it, sun burns it, and Fire hits 1.25x.',
  });
  registerAbility(Abilities.Damp, {
    name: 'Damp',
    description: 'Nothing on the field can blow itself up.',
  });

  // Venonat
  registerAbility(Abilities.WonderSkin, {
    name: 'Wonder Skin',
    description: 'Status moves aimed at it are never more than 50% accurate.',
  });

  // Diglett
  registerAbility(Abilities.ArenaTrap, {
    name: 'Arena Trap',
    description: 'Grounded enemies cannot flee.',
  });
  registerAbility(Abilities.SandForce, {
    name: 'Sand Force',
    description: '1.3x Ground, Rock and Steel moves in a sandstorm, which never chips it.',
  });

  // Meowth
  registerAbility(Abilities.Pickup, {
    name: 'Pickup',
    description: 'Picks up an item somebody else used, if it has room for one.',
  });
  registerAbility(Abilities.Technician, {
    name: 'Technician',
    description: '1.5x on moves of 60 power or less.',
  });
  registerAbility(Abilities.Limber, {
    name: 'Limber',
    description: 'Cannot be paralysed.',
  });

  // Psyduck
  registerAbility(Abilities.CloudNine, {
    name: 'Cloud Nine',
    description: 'Weather does nothing to anybody while it is up.',
  });
  registerAbility(Abilities.SwiftSwim, {
    name: 'Swift Swim',
    description: 'Doubles Speed in rain.',
  });

  // Mankey
  registerAbility(Abilities.VitalSpirit, {
    name: 'Vital Spirit',
    description: 'Cannot fall asleep.',
  });
  registerAbility(Abilities.AngerPoint, {
    name: 'Anger Point',
    description: 'Maxes its Attack when a critical hits it.',
  });
  registerAbility(Abilities.Defiant, {
    name: 'Defiant',
    description: '+2 Attack whenever an enemy knocks a stat down.',
  });

  // Growlithe
  registerAbility(Abilities.Justified, {
    name: 'Justified',
    description: '+1 Attack when a Dark move hits it.',
  });

  // Poliwag
  registerAbility(Abilities.WaterAbsorb, {
    name: 'Water Absorb',
    description: 'Immune to Water, and healed a quarter of its pool by it.',
  });

  // Abra
  registerAbility(Abilities.Synchronize, {
    name: 'Synchronize',
    description: 'Passes poison, burn and paralysis back to whoever caused it.',
  });

  // Machop
  registerAbility(Abilities.NoGuard, {
    name: 'No Guard',
    description: 'Nothing misses, in either direction.',
  });
  registerAbility(Abilities.Steadfast, {
    name: 'Steadfast',
    description: '+1 Speed whenever it flinches.',
  });

  // Bellsprout
  registerAbility(Abilities.Gluttony, {
    name: 'Gluttony',
    description: 'Eats its pinch items at twice the usual threshold.',
  });

  // Tentacool
  registerAbility(Abilities.ClearBody, {
    name: 'Clear Body',
    description: 'Refuses every stat drop from anybody else.',
  });
  registerAbility(Abilities.LiquidOoze, {
    name: 'Liquid Ooze',
    description: 'Draining it hurts the drainer instead.',
  });

  // Geodude
  registerAbility(Abilities.RockHead, {
    name: 'Rock Head',
    description: 'Takes no recoil.',
  });
  registerAbility(Abilities.Sturdy, {
    name: 'Sturdy',
    description:
      'Survives any one blow from full health on 1 HP, and one-hit KOs never work on it.',
  });

  // Ponyta
  registerAbility(Abilities.FlameBody, {
    name: 'Flame Body',
    description: '30% to burn anything that touches it.',
  });

  // Slowpoke
  registerAbility(Abilities.Oblivious, {
    name: 'Oblivious',
    description: 'Cannot be infatuated, and shrugs off an Intimidate.',
  });
  registerAbility(Abilities.OwnTempo, {
    name: 'Own Tempo',
    description: 'Cannot be confused, and shrugs off an Intimidate.',
  });
  registerAbility(Abilities.Regenerator, {
    name: 'Regenerator',
    description: 'Heals a third of its pool when it leaves the field alive.',
  });

  // Magnemite
  registerAbility(Abilities.MagnetPull, {
    name: 'Magnet Pull',
    description: 'Steel enemies cannot flee.',
  });
  registerAbility(Abilities.Analytic, {
    name: 'Analytic',
    description: '1.3x against a target already casting or channelling.',
  });

  // Doduo
  registerAbility(Abilities.EarlyBird, {
    name: 'Early Bird',
    description: 'Sleeps half as long.',
  });

  // Seel
  registerAbility(Abilities.Hydration, {
    name: 'Hydration',
    description: 'No status lands on it in rain.',
  });
  registerAbility(Abilities.IceBody, {
    name: 'Ice Body',
    description:
      'Restores a sixteenth of its pool each time it acts in hail, which never chips it.',
  });

  // Grimer
  registerAbility(Abilities.StickyHold, {
    name: 'Sticky Hold',
    description: 'Nobody else can take its item.',
  });
  registerAbility(Abilities.PoisonTouch, {
    name: 'Poison Touch',
    description: '30% to poison whatever it touches.',
  });

  // Shellder
  registerAbility(Abilities.ShellArmor, {
    name: 'Shell Armor',
    description: 'Cannot be hit by a critical.',
  });
  registerAbility(Abilities.SkillLink, {
    name: 'Skill Link',
    description: 'Multi-hit moves always land every hit.',
  });
  registerAbility(Abilities.Overcoat, {
    name: 'Overcoat',
    description: 'Sandstorm and hail never chip it, and powder moves do nothing.',
  });

  // Gastly
  registerAbility(Abilities.Levitate, {
    name: 'Levitate',
    description: 'Floats, so Ground moves miss unless something pins it down.',
  });

  // Onix
  registerAbility(Abilities.WeakArmor, {
    name: 'Weak Armor',
    description: 'A physical blow cracks it: -1 Defense, +2 Speed.',
  });

  // Drowzee
  registerAbility(Abilities.Insomnia, {
    name: 'Insomnia',
    description: 'Cannot fall asleep.',
  });
  registerAbility(Abilities.Forewarn, {
    name: 'Forewarn',
    description: 'Reads what the enemy is carrying as it enters the field.',
  });

  // Krabby
  registerAbility(Abilities.HyperCutter, {
    name: 'Hyper Cutter',
    description: 'Refuses Attack drops from anybody else.',
  });

  // Voltorb
  registerAbility(Abilities.Soundproof, {
    name: 'Soundproof',
    description: 'Sound moves cannot touch it.',
  });
  registerAbility(Abilities.Aftermath, {
    name: 'Aftermath',
    description: 'Whoever lands the killing touch pays a quarter of its own pool.',
  });

  // Exeggcute
  registerAbility(Abilities.Harvest, {
    name: 'Harvest',
    description: 'Regrows the berry it ate — always in sun, half the time otherwise.',
  });

  // Cubone
  registerAbility(Abilities.BattleArmor, {
    name: 'Battle Armor',
    description: 'Cannot be hit by a critical.',
  });

  // Tyrogue (Hitmonlee/Hitmonchan)
  registerAbility(Abilities.Reckless, {
    name: 'Reckless',
    description: '1.2x on recoil and crash moves.',
  });
  registerAbility(Abilities.Unburden, {
    name: 'Unburden',
    description: 'Doubles Speed while its item is gone.',
  });
  registerAbility(Abilities.IronFist, {
    name: 'Iron Fist',
    description: '1.2x on punching moves.',
  });

  // Koffing
  registerAbility(Abilities.NeutralizingGas, {
    name: 'Neutralizing Gas',
    description: 'Every other ability on the field reads as absent.',
  });

  // Chansey
  registerAbility(Abilities.NaturalCure, {
    name: 'Natural Cure',
    description: 'Cures itself when it leaves the field.',
  });
  registerAbility(Abilities.SereneGrace, {
    name: 'Serene Grace',
    description: "Doubles the odds of a move's added effect.",
  });
  registerAbility(Abilities.Healer, {
    name: 'Healer',
    description: "30% to cure an ally's status each time it acts.",
  });

  // Tangela
  registerAbility(Abilities.LeafGuard, {
    name: 'Leaf Guard',
    description: 'No status lands on it in sunlight.',
  });

  // Kangaskhan
  registerAbility(Abilities.Scrappy, {
    name: 'Scrappy',
    description: 'Normal and Fighting moves reach Ghosts, and shrugs off an Intimidate.',
  });

  // Goldeen
  registerAbility(Abilities.WaterVeil, {
    name: 'Water Veil',
    description: 'Cannot be burned.',
  });

  // Staryu
  registerAbility(Abilities.Illuminate, {
    name: 'Illuminate',
    description: 'Refuses accuracy drops from anybody else.',
  });

  // MrMime
  registerAbility(Abilities.Filter, {
    name: 'Filter',
    description: 'Super-effective blows on it hit a quarter softer.',
  });

  // Pinsir
  registerAbility(Abilities.Moxie, {
    name: 'Moxie',
    description: '+1 Attack whenever it knocks something out.',
  });
  registerAbility(Abilities.MoldBreaker, {
    name: 'Mold Breaker',
    description: "The target's abilities cannot hinder its moves.",
  });

  // Magikarp
  registerAbility(Abilities.Rattled, {
    name: 'Rattled',
    description: '+1 Speed when a Bug, Dark or Ghost move hits it, or an Intimidate does.',
  });

  // Ditto
  registerAbility(Abilities.Imposter, {
    name: 'Imposter',
    description: 'Transforms into the strongest enemy as it enters the field.',
  });

  // Eevee
  registerAbility(Abilities.Adaptability, {
    name: 'Adaptability',
    description: 'Same-type moves hit 2x rather than 1.5x.',
  });
  registerAbility(Abilities.Anticipation, {
    name: 'Anticipation',
    description: 'Shudders at a move that would hurt as it enters the field.',
  });

  // Jolteon
  registerAbility(Abilities.VoltAbsorb, {
    name: 'Volt Absorb',
    description: 'Immune to Electric, and healed a quarter of its pool by it.',
  });
  registerAbility(Abilities.QuickFeet, {
    name: 'Quick Feet',
    description: '1.5x Speed while statused.',
  });

  // Porygon
  registerAbility(Abilities.Trace, {
    name: 'Trace',
    description: "Copies the strongest enemy's ability as it enters the field.",
  });
  registerAbility(Abilities.Download, {
    name: 'Download',
    description: '+1 Attack or Special Attack, whichever side the enemy is softer on.',
  });

  // Aerodactyl
  registerAbility(Abilities.Pressure, {
    name: 'Pressure',
    description: 'Moves aimed at it cost twice the cooldown.',
  });

  // Snorlax
  registerAbility(Abilities.Immunity, {
    name: 'Immunity',
    description: 'Cannot be poisoned.',
  });

  // Articuno
  registerAbility(Abilities.SnowCloak, {
    name: 'Snow Cloak',
    description: 'Moves are 20% less accurate against it in hail, which never chips it.',
  });

  // Dratini
  registerAbility(Abilities.MarvelScale, {
    name: 'Marvel Scale',
    description: '1.5x Defense while statused.',
  });

  // Dragonite
  registerAbility(Abilities.Multiscale, {
    name: 'Multiscale',
    description: 'Halves any blow that lands on it at full health.',
  });

  // Special (non-standard abilities outside the regular pool)
  registerAbility(Abilities.Boss, {
    name: 'Boss',
    description:
      "A raid pool of 5,000 plus ten times the species' own, every other stat doubled, and no status that would take its turn away.",
  });
  registerAbility(Abilities.Shadow, {
    name: 'Shadow',
    description: '1.2x damage dealt, and 1.2x damage taken.',
  });
  registerAbility(Abilities.Purified, {
    name: 'Purified',
    description: 'The mark of a shadow put right. Does nothing in a fight.',
  });
}
