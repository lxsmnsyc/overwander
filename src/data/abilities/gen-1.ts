import Abilities from '../ids/abilities';
import { registerAbility } from './__create';

/**
 * Every ability the Gen 1 species can carry, grouped by the line
 * that introduces it — the same grouping the Abilities enum keeps,
 * so the two stay easy to read side by side. Only the display name
 * lives here; what an ability actually does is wired in the battle
 * engine, and which species can roll it lives in the species data.
 */
export default function registerGen1Abilities(): void {
  // Bulbasaur
  registerAbility(Abilities.Overgrow, { name: 'Overgrow' });
  registerAbility(Abilities.Chlorophyll, { name: 'Chlorophyll' });
  registerAbility(Abilities.ThickFat, { name: 'Thick Fat' });

  // Charmander
  registerAbility(Abilities.Blaze, { name: 'Blaze' });
  registerAbility(Abilities.SolarPower, { name: 'Solar Power' });
  registerAbility(Abilities.ToughClaws, { name: 'Tough Claws' });
  registerAbility(Abilities.Drought, { name: 'Drought' });

  // Squirtle
  registerAbility(Abilities.Torrent, { name: 'Torrent' });
  registerAbility(Abilities.RainDish, { name: 'Rain Dish' });

  // Caterpie
  registerAbility(Abilities.ShieldDust, { name: 'Shield Dust' });
  registerAbility(Abilities.RunAway, { name: 'Run Away' });

  // Metapod
  registerAbility(Abilities.ShedSkin, { name: 'Shed Skin' });

  // Butterfree
  registerAbility(Abilities.CompoundEyes, { name: 'Compound Eyes' });
  registerAbility(Abilities.TintedLens, { name: 'Tinted Lens' });

  // Beedrill
  registerAbility(Abilities.Swarm, { name: 'Swarm' });
  registerAbility(Abilities.Sniper, { name: 'Sniper' });

  // Pidgey
  registerAbility(Abilities.KeenEye, { name: 'Keen Eye' });
  registerAbility(Abilities.TangledFeet, { name: 'Tangled Feet' });
  registerAbility(Abilities.BigPecks, { name: 'Big Pecks' });

  // Rattata
  registerAbility(Abilities.Guts, { name: 'Guts' });
  registerAbility(Abilities.Hustle, { name: 'Hustle' });

  // Ekans
  registerAbility(Abilities.Intimidate, { name: 'Intimidate' });
  registerAbility(Abilities.Unnerve, { name: 'Unnerve' });

  // Pikachu
  registerAbility(Abilities.Static, { name: 'Static' });
  registerAbility(Abilities.LightningRod, { name: 'Lightning Rod' });

  // Sandshrew
  registerAbility(Abilities.SandVeil, { name: 'Sand Veil' });
  registerAbility(Abilities.SandRush, { name: 'Sand Rush' });

  // Nidoran
  registerAbility(Abilities.PoisonPoint, { name: 'Poison Point' });
  registerAbility(Abilities.Rivalry, { name: 'Rivalry' });
  registerAbility(Abilities.SheerForce, { name: 'Sheer Force' });

  // Clefairy
  registerAbility(Abilities.CuteCharm, { name: 'Cute Charm' });
  registerAbility(Abilities.MagicGuard, { name: 'Magic Guard' });
  registerAbility(Abilities.FriendGuard, { name: 'Friend Guard' });
  registerAbility(Abilities.Unaware, { name: 'Unaware' });

  // Vulpix
  registerAbility(Abilities.FlashFire, { name: 'Flash Fire' });

  // Jigglypuff
  registerAbility(Abilities.Competitive, { name: 'Competitive' });
  registerAbility(Abilities.Frisk, { name: 'Frisk' });

  // Zubat
  registerAbility(Abilities.InnerFocus, { name: 'Inner Focus' });
  registerAbility(Abilities.Infiltrator, { name: 'Infiltrator' });

  // Oddish
  registerAbility(Abilities.Stench, { name: 'Stench' });
  registerAbility(Abilities.EffectSpore, { name: 'Effect Spore' });

  // Paras
  registerAbility(Abilities.DrySkin, { name: 'Dry Skin' });
  registerAbility(Abilities.Damp, { name: 'Damp' });

  // Venonat
  registerAbility(Abilities.WonderSkin, { name: 'Wonder Skin' });

  // Diglett
  registerAbility(Abilities.ArenaTrap, { name: 'Arena Trap' });
  registerAbility(Abilities.SandForce, { name: 'Sand Force' });

  // Meowth
  registerAbility(Abilities.Pickup, { name: 'Pickup' });
  registerAbility(Abilities.Technician, { name: 'Technician' });
  registerAbility(Abilities.Limber, { name: 'Limber' });

  // Psyduck
  registerAbility(Abilities.CloudNine, { name: 'Cloud Nine' });
  registerAbility(Abilities.SwiftSwim, { name: 'Swift Swim' });

  // Mankey
  registerAbility(Abilities.VitalSpirit, { name: 'Vital Spirit' });
  registerAbility(Abilities.AngerPoint, { name: 'Anger Point' });
  registerAbility(Abilities.Defiant, { name: 'Defiant' });

  // Growlithe
  registerAbility(Abilities.Justified, { name: 'Justified' });

  // Poliwag
  registerAbility(Abilities.WaterAbsorb, { name: 'Water Absorb' });

  // Abra
  registerAbility(Abilities.Synchronize, { name: 'Synchronize' });

  // Machop
  registerAbility(Abilities.NoGuard, { name: 'No Guard' });
  registerAbility(Abilities.Steadfast, { name: 'Steadfast' });

  // Bellsprout
  registerAbility(Abilities.Gluttony, { name: 'Gluttony' });

  // Tentacool
  registerAbility(Abilities.ClearBody, { name: 'Clear Body' });
  registerAbility(Abilities.LiquidOoze, { name: 'Liquid Ooze' });

  // Geodude
  registerAbility(Abilities.RockHead, { name: 'Rock Head' });
  registerAbility(Abilities.Sturdy, { name: 'Sturdy' });

  // Ponyta
  registerAbility(Abilities.FlameBody, { name: 'Flame Body' });

  // Slowpoke
  registerAbility(Abilities.Oblivious, { name: 'Oblivious' });
  registerAbility(Abilities.OwnTempo, { name: 'Own Tempo' });
  registerAbility(Abilities.Regenerator, { name: 'Regenerator' });

  // Magnemite
  registerAbility(Abilities.MagnetPull, { name: 'Magnet Pull' });
  registerAbility(Abilities.Analytic, { name: 'Analytic' });

  // Doduo
  registerAbility(Abilities.EarlyBird, { name: 'Early Bird' });

  // Seel
  registerAbility(Abilities.Hydration, { name: 'Hydration' });
  registerAbility(Abilities.IceBody, { name: 'Ice Body' });

  // Grimer
  registerAbility(Abilities.StickyHold, { name: 'Sticky Hold' });
  registerAbility(Abilities.PoisonTouch, { name: 'Poison Touch' });

  // Shellder
  registerAbility(Abilities.ShellArmor, { name: 'Shell Armor' });
  registerAbility(Abilities.SkillLink, { name: 'Skill Link' });
  registerAbility(Abilities.Overcoat, { name: 'Overcoat' });

  // Gastly
  registerAbility(Abilities.Levitate, { name: 'Levitate' });

  // Onix
  registerAbility(Abilities.WeakArmor, { name: 'Weak Armor' });

  // Drowzee
  registerAbility(Abilities.Insomnia, { name: 'Insomnia' });
  registerAbility(Abilities.Forewarn, { name: 'Forewarn' });

  // Krabby
  registerAbility(Abilities.HyperCutter, { name: 'Hyper Cutter' });

  // Voltorb
  registerAbility(Abilities.Soundproof, { name: 'Soundproof' });
  registerAbility(Abilities.Aftermath, { name: 'Aftermath' });

  // Exeggcute
  registerAbility(Abilities.Harvest, { name: 'Harvest' });

  // Cubone
  registerAbility(Abilities.BattleArmor, { name: 'Battle Armor' });

  // Tyrogue (Hitmonlee/Hitmonchan)
  registerAbility(Abilities.Reckless, { name: 'Reckless' });
  registerAbility(Abilities.Unburden, { name: 'Unburden' });
  registerAbility(Abilities.IronFist, { name: 'Iron Fist' });

  // Koffing
  registerAbility(Abilities.NeutralizingGas, { name: 'Neutralizing Gas' });

  // Chansey
  registerAbility(Abilities.NaturalCure, { name: 'Natural Cure' });
  registerAbility(Abilities.SereneGrace, { name: 'Serene Grace' });
  registerAbility(Abilities.Healer, { name: 'Healer' });

  // Tangela
  registerAbility(Abilities.LeafGuard, { name: 'Leaf Guard' });

  // Kangaskhan
  registerAbility(Abilities.Scrappy, { name: 'Scrappy' });

  // Goldeen
  registerAbility(Abilities.WaterVeil, { name: 'Water Veil' });

  // Staryu
  registerAbility(Abilities.Illuminate, { name: 'Illuminate' });

  // MrMime
  registerAbility(Abilities.Filter, { name: 'Filter' });

  // Pinsir
  registerAbility(Abilities.Moxie, { name: 'Moxie' });
  registerAbility(Abilities.MoldBreaker, { name: 'Mold Breaker' });

  // Magikarp
  registerAbility(Abilities.Rattled, { name: 'Rattled' });

  // Ditto
  registerAbility(Abilities.Imposter, { name: 'Imposter' });

  // Eevee
  registerAbility(Abilities.Adaptability, { name: 'Adaptability' });
  registerAbility(Abilities.Anticipation, { name: 'Anticipation' });

  // Jolteon
  registerAbility(Abilities.VoltAbsorb, { name: 'Volt Absorb' });
  registerAbility(Abilities.QuickFeet, { name: 'Quick Feet' });

  // Porygon
  registerAbility(Abilities.Trace, { name: 'Trace' });
  registerAbility(Abilities.Download, { name: 'Download' });

  // Aerodactyl
  registerAbility(Abilities.Pressure, { name: 'Pressure' });

  // Snorlax
  registerAbility(Abilities.Immunity, { name: 'Immunity' });

  // Articuno
  registerAbility(Abilities.SnowCloak, { name: 'Snow Cloak' });

  // Dratini
  registerAbility(Abilities.MarvelScale, { name: 'Marvel Scale' });

  // Dragonite
  registerAbility(Abilities.Multiscale, { name: 'Multiscale' });

  // Special (non-standard abilities outside the regular pool)
  registerAbility(Abilities.Boss, { name: 'Boss' });
  registerAbility(Abilities.Shadow, { name: 'Shadow' });
  registerAbility(Abilities.Purified, { name: 'Purified' });
}
