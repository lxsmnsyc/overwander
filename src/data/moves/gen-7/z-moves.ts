import { Types } from '../../constants/types';
import { MoveAffects, MoveCategories, MoveFlags, MoveTargets, Moves } from '../../ids/moves';
import { SpriteAnim } from '../../ids/sprite-anims';
import { registerMove } from '../__create';

/**
 * The Z-Moves, which nobody learns: a held Z-Crystal turns a move into
 * one as it is thrown. The type ones take their power and whether they
 * are physical or special from the move they replace; see
 * `src/data/moves/z-moves.ts`
 */
export default function registerZMoves(): void {
  registerMove(Moves.BreakneckBlitz, {
    name: 'Breakneck Blitz',
    description:
      "A Normal crystal's Z-Move. Its power and whether it is physical or special come from the move it replaces.",
    type: Types.Normal,
    category: MoveCategories.Physical,
    pp: 1,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Rotate, SpriteAnim.Charge],
  });
  registerMove(Moves.AllOutPummeling, {
    name: 'All-Out Pummeling',
    description:
      "A Fighting crystal's Z-Move. Its power and whether it is physical or special come from the move it replaces.",
    type: Types.Fighting,
    category: MoveCategories.Physical,
    pp: 1,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Punch, SpriteAnim.Charge],
  });
  registerMove(Moves.SupersonicSkystrike, {
    name: 'Supersonic Skystrike',
    description:
      "A Flying crystal's Z-Move. Its power and whether it is physical or special come from the move it replaces.",
    type: Types.Flying,
    category: MoveCategories.Physical,
    pp: 1,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Hop, SpriteAnim.Charge],
  });
  registerMove(Moves.AcidDownpour, {
    name: 'Acid Downpour',
    description:
      "A Poison crystal's Z-Move. Its power and whether it is physical or special come from the move it replaces.",
    type: Types.Poison,
    category: MoveCategories.Physical,
    pp: 1,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.TectonicRage, {
    name: 'Tectonic Rage',
    description:
      "A Ground crystal's Z-Move. Its power and whether it is physical or special come from the move it replaces.",
    type: Types.Ground,
    category: MoveCategories.Physical,
    pp: 1,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Rumble, SpriteAnim.Charge],
  });
  registerMove(Moves.ContinentalCrush, {
    name: 'Continental Crush',
    description:
      "A Rock crystal's Z-Move. Its power and whether it is physical or special come from the move it replaces.",
    type: Types.Rock,
    category: MoveCategories.Physical,
    pp: 1,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Slam, SpriteAnim.Charge],
  });
  registerMove(Moves.SavageSpinOut, {
    name: 'Savage Spin-Out',
    description:
      "A Bug crystal's Z-Move. Its power and whether it is physical or special come from the move it replaces.",
    type: Types.Bug,
    category: MoveCategories.Physical,
    pp: 1,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Rotate, SpriteAnim.Charge],
  });
  registerMove(Moves.NeverEndingNightmare, {
    name: 'Never-Ending Nightmare',
    description:
      "A Ghost crystal's Z-Move. Its power and whether it is physical or special come from the move it replaces.",
    type: Types.Ghost,
    category: MoveCategories.Physical,
    pp: 1,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.CorkscrewCrash, {
    name: 'Corkscrew Crash',
    description:
      "A Steel crystal's Z-Move. Its power and whether it is physical or special come from the move it replaces.",
    type: Types.Steel,
    category: MoveCategories.Physical,
    pp: 1,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Rotate, SpriteAnim.Charge],
  });
  registerMove(Moves.InfernoOverdrive, {
    name: 'Inferno Overdrive',
    description:
      "A Fire crystal's Z-Move. Its power and whether it is physical or special come from the move it replaces.",
    type: Types.Fire,
    category: MoveCategories.Physical,
    pp: 1,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.HydroVortex, {
    name: 'Hydro Vortex',
    description:
      "A Water crystal's Z-Move. Its power and whether it is physical or special come from the move it replaces.",
    type: Types.Water,
    category: MoveCategories.Physical,
    pp: 1,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.BloomDoom, {
    name: 'Bloom Doom',
    description:
      "A Grass crystal's Z-Move. Its power and whether it is physical or special come from the move it replaces.",
    type: Types.Grass,
    category: MoveCategories.Physical,
    pp: 1,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.GigavoltHavoc, {
    name: 'Gigavolt Havoc',
    description:
      "A Electric crystal's Z-Move. Its power and whether it is physical or special come from the move it replaces.",
    type: Types.Electric,
    category: MoveCategories.Physical,
    pp: 1,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Shock, SpriteAnim.Charge],
  });
  registerMove(Moves.ShatteredPsyche, {
    name: 'Shattered Psyche',
    description:
      "A Psychic crystal's Z-Move. Its power and whether it is physical or special come from the move it replaces.",
    type: Types.Psychic,
    category: MoveCategories.Physical,
    pp: 1,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.SubzeroSlammer, {
    name: 'Subzero Slammer',
    description:
      "A Ice crystal's Z-Move. Its power and whether it is physical or special come from the move it replaces.",
    type: Types.Ice,
    category: MoveCategories.Physical,
    pp: 1,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Slam, SpriteAnim.Charge],
  });
  registerMove(Moves.DevastatingDrake, {
    name: 'Devastating Drake',
    description:
      "A Dragon crystal's Z-Move. Its power and whether it is physical or special come from the move it replaces.",
    type: Types.Dragon,
    category: MoveCategories.Physical,
    pp: 1,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.RearUp, SpriteAnim.Charge],
  });
  registerMove(Moves.BlackHoleEclipse, {
    name: 'Black Hole Eclipse',
    description:
      "A Dark crystal's Z-Move. Its power and whether it is physical or special come from the move it replaces.",
    type: Types.Dark,
    category: MoveCategories.Physical,
    pp: 1,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.TwinkleTackle, {
    name: 'Twinkle Tackle',
    description:
      "A Fairy crystal's Z-Move. Its power and whether it is physical or special come from the move it replaces.",
    type: Types.Fairy,
    category: MoveCategories.Physical,
    pp: 1,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Slam, SpriteAnim.Charge],
  });
  registerMove(Moves.Catastropika, {
    name: 'Catastropika',
    description: "A Pikachu's own Z-Move.",
    type: Types.Electric,
    category: MoveCategories.Physical,
    power: 210,
    pp: 1,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Slam, SpriteAnim.Shock, SpriteAnim.Attack],
  });
  registerMove(Moves.SinisterArrowRaid, {
    name: 'Sinister Arrow Raid',
    description: "A Decidueye's own Z-Move.",
    type: Types.Ghost,
    category: MoveCategories.Physical,
    power: 180,
    pp: 1,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Shoot, SpriteAnim.Attack],
  });
  registerMove(Moves.MaliciousMoonsault, {
    name: 'Malicious Moonsault',
    description: "An Incineroar's own Z-Move.",
    type: Types.Dark,
    category: MoveCategories.Physical,
    power: 180,
    pp: 1,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Hop, SpriteAnim.Slam, SpriteAnim.Attack],
  });
  registerMove(Moves.OceanicOperetta, {
    name: 'Oceanic Operetta',
    description: "A Primarina's own Z-Move.",
    type: Types.Water,
    category: MoveCategories.Special,
    power: 195,
    pp: 1,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Sing, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.GuardianOfAlola, {
    name: 'Guardian of Alola',
    description: "Takes 3/4 of whatever health the target has left. A Tapu's own Z-Move.",
    type: Types.Fairy,
    category: MoveCategories.Special,
    pp: 1,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.SpAttack, SpriteAnim.Charge],
  });
  registerMove(Moves.SoulStealing7StarStrike, {
    name: 'Soul-Stealing 7-Star Strike',
    description: "A Marshadow's own Z-Move.",
    type: Types.Ghost,
    category: MoveCategories.Physical,
    power: 195,
    pp: 1,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.MultiStrike, SpriteAnim.Punch, SpriteAnim.Attack],
  });
  registerMove(Moves.StokedSparksurfer, {
    name: 'Stoked Sparksurfer',
    description: "Always paralyses. An Alolan Raichu's own Z-Move.",
    type: Types.Electric,
    category: MoveCategories.Special,
    power: 175,
    pp: 1,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Shock, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.PulverizingPancake, {
    name: 'Pulverizing Pancake',
    description: "A Snorlax's own Z-Move.",
    type: Types.Normal,
    category: MoveCategories.Physical,
    power: 210,
    pp: 1,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Hop, SpriteAnim.Slam, SpriteAnim.Attack],
  });
  registerMove(Moves.ExtremeEvoboost, {
    name: 'Extreme Evoboost',
    description: "Raises every one of the user's stats 2 stages. An Eevee's own Z-Move.",
    type: Types.Normal,
    category: MoveCategories.Status,
    pp: 1,
    target: MoveTargets.None,
    flags: 0,
    cast: [SpriteAnim.Appeal, SpriteAnim.Charge],
  });
  registerMove(Moves.GenesisSupernova, {
    name: 'Genesis Supernova',
    description: "Lays Psychic Terrain behind it. A Mew's own Z-Move.",
    type: Types.Psychic,
    category: MoveCategories.Special,
    power: 185,
    pp: 1,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.SpAttack, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.TenMillionVoltThunderbolt, {
    name: '10,000,000 Volt Thunderbolt',
    description: "More likely to land a critical hit. The Z-Move of a Pikachu in Ash's cap.",
    type: Types.Electric,
    category: MoveCategories.Special,
    power: 195,
    pp: 1,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Shock, SpriteAnim.SpAttack, SpriteAnim.Charge],
  });
  registerMove(Moves.LightThatBurnsTheSky, {
    name: 'Light That Burns the Sky',
    description:
      "Physical when the user's Attack is higher. Ignores the target's abilities. A fused Necrozma's own Z-Move.",
    type: Types.Psychic,
    category: MoveCategories.Special,
    power: 200,
    pp: 1,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.SpAttack, SpriteAnim.Shoot, SpriteAnim.Charge],
  });
  registerMove(Moves.SearingSunrazeSmash, {
    name: 'Searing Sunraze Smash',
    description: "Ignores the target's abilities. A Solgaleo's own Z-Move.",
    type: Types.Steel,
    category: MoveCategories.Physical,
    power: 200,
    pp: 1,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Slam, SpriteAnim.RearUp, SpriteAnim.Attack],
  });
  registerMove(Moves.MenacingMoonrazeMaelstrom, {
    name: 'Menacing Moonraze Maelstrom',
    description: "Ignores the target's abilities. A Lunala's own Z-Move.",
    type: Types.Ghost,
    category: MoveCategories.Special,
    power: 200,
    pp: 1,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.SpAttack, SpriteAnim.Shoot, SpriteAnim.Charge],
  });
  registerMove(Moves.LetsSnuggleForever, {
    name: "Let's Snuggle Forever",
    description: "A Mimikyu's own Z-Move.",
    type: Types.Fairy,
    category: MoveCategories.Physical,
    power: 190,
    pp: 1,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Slam, SpriteAnim.Strike, SpriteAnim.Attack],
  });
  registerMove(Moves.SplinteredStormshards, {
    name: 'Splintered Stormshards',
    description: "Clears the terrain away. A Lycanroc's own Z-Move.",
    type: Types.Rock,
    category: MoveCategories.Physical,
    power: 190,
    pp: 1,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Stomp, SpriteAnim.Slam, SpriteAnim.Attack],
  });
  registerMove(Moves.ClangorousSoulblaze, {
    name: 'Clangorous Soulblaze',
    description:
      "Hits everything opposite, then raises every one of the user's stats a stage. A Kommo-o's own Z-Move. It is a sound.",
    type: Types.Dragon,
    category: MoveCategories.Special,
    power: 185,
    pp: 1,
    target: MoveTargets.None,
    affects: MoveAffects.Unit | MoveAffects.Enemy,
    flags: MoveFlags.Sound,
    cast: [SpriteAnim.Shake, SpriteAnim.Sound, SpriteAnim.Charge],
  });
}
