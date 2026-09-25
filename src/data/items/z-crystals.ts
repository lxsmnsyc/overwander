import { TYPE_NAMES, Types } from '../constants/types';
import { ItemFlags, ItemTypes, Items } from '../ids/items';
import { Moves } from '../ids/moves';
import { Species } from '../ids/species';
import { PLATE_RESALE } from './plates';
import { registerItem } from './__create';

/**
 * The Z-Crystals. Held, and never spent: the crystal turns one of the
 * holder's moves into its Z-Move as it is thrown, once a side a fight.
 * The battle side is in `src/battle/moves/z-moves.ts`
 */

/** The crystals of one type, each turning any damaging move of it */
export const TYPE_CRYSTALS = new Map<Items, TypeCrystal>([
  [Items.NormaliumZ, { type: Types.Normal, name: 'Normalium Z', zMoveName: 'Breakneck Blitz' }],
  [
    Items.FightiniumZ,
    { type: Types.Fighting, name: 'Fightinium Z', zMoveName: 'All-Out Pummeling' },
  ],
  [Items.FlyiniumZ, { type: Types.Flying, name: 'Flyinium Z', zMoveName: 'Supersonic Skystrike' }],
  [Items.PoisoniumZ, { type: Types.Poison, name: 'Poisonium Z', zMoveName: 'Acid Downpour' }],
  [Items.GroundiumZ, { type: Types.Ground, name: 'Groundium Z', zMoveName: 'Tectonic Rage' }],
  [Items.RockiumZ, { type: Types.Rock, name: 'Rockium Z', zMoveName: 'Continental Crush' }],
  [Items.BuginiumZ, { type: Types.Bug, name: 'Buginium Z', zMoveName: 'Savage Spin-Out' }],
  [Items.GhostiumZ, { type: Types.Ghost, name: 'Ghostium Z', zMoveName: 'Never-Ending Nightmare' }],
  [Items.SteeliumZ, { type: Types.Steel, name: 'Steelium Z', zMoveName: 'Corkscrew Crash' }],
  [Items.FiriumZ, { type: Types.Fire, name: 'Firium Z', zMoveName: 'Inferno Overdrive' }],
  [Items.WateriumZ, { type: Types.Water, name: 'Waterium Z', zMoveName: 'Hydro Vortex' }],
  [Items.GrassiumZ, { type: Types.Grass, name: 'Grassium Z', zMoveName: 'Bloom Doom' }],
  [Items.ElectriumZ, { type: Types.Electric, name: 'Electrium Z', zMoveName: 'Gigavolt Havoc' }],
  [Items.PsychiumZ, { type: Types.Psychic, name: 'Psychium Z', zMoveName: 'Shattered Psyche' }],
  [Items.IciumZ, { type: Types.Ice, name: 'Icium Z', zMoveName: 'Subzero Slammer' }],
  [Items.DragoniumZ, { type: Types.Dragon, name: 'Dragonium Z', zMoveName: 'Devastating Drake' }],
  [Items.DarkiniumZ, { type: Types.Dark, name: 'Darkinium Z', zMoveName: 'Black Hole Eclipse' }],
  [Items.FairiumZ, { type: Types.Fairy, name: 'Fairium Z', zMoveName: 'Twinkle Tackle' }],
]);

/** A crystal that turns any damaging move of one type */
export interface TypeCrystal {
  type: Types;
  name: string;
  /** Written out since items register apart from moves */
  zMoveName: string;
}

/** A crystal that turns one move of one line into that line's own Z-Move */
export interface SignatureCrystal {
  /** Who may use it, every form included */
  holders: Species[];
  /** Who that is, written out since items register apart from species */
  holder: string;
  move: Moves;
  zMove: Moves;
  name: string;
  /** The move and the Z-Move, written out since items register apart from moves */
  moveName: string;
  zMoveName: string;
}

export const SIGNATURE_CRYSTALS = new Map<Items, SignatureCrystal>([
  [
    Items.PikaniumZ,
    {
      holders: [Species.Pikachu],
      holder: 'Pikachu',
      move: Moves.VoltTackle,
      zMove: Moves.Catastropika,
      name: 'Pikanium Z',
      moveName: 'Volt Tackle',
      zMoveName: 'Catastropika',
    },
  ],
  // Only a Pikachu in one of Ash's caps, and none of those is in the dex yet
  [
    Items.PikashuniumZ,
    {
      holders: [],
      holder: "Pikachu in Ash's cap",
      move: Moves.Thunderbolt,
      zMove: Moves.TenMillionVoltThunderbolt,
      name: 'Pikashunium Z',
      moveName: 'Thunderbolt',
      zMoveName: '10,000,000 Volt Thunderbolt',
    },
  ],
  [
    Items.AloraichiumZ,
    {
      holders: [Species.RaichuAlola],
      holder: 'Alolan Raichu',
      move: Moves.Thunderbolt,
      zMove: Moves.StokedSparksurfer,
      name: 'Aloraichium Z',
      moveName: 'Thunderbolt',
      zMoveName: 'Stoked Sparksurfer',
    },
  ],
  [
    Items.EeviumZ,
    {
      holders: [Species.Eevee],
      holder: 'Eevee',
      move: Moves.LastResort,
      zMove: Moves.ExtremeEvoboost,
      name: 'Eevium Z',
      moveName: 'Last Resort',
      zMoveName: 'Extreme Evoboost',
    },
  ],
  [
    Items.SnorliumZ,
    {
      holders: [Species.Snorlax],
      holder: 'Snorlax',
      move: Moves.GigaImpact,
      zMove: Moves.PulverizingPancake,
      name: 'Snorlium Z',
      moveName: 'Giga Impact',
      zMoveName: 'Pulverizing Pancake',
    },
  ],
  [
    Items.MewniumZ,
    {
      holders: [Species.Mew],
      holder: 'Mew',
      move: Moves.Psychic,
      zMove: Moves.GenesisSupernova,
      name: 'Mewnium Z',
      moveName: 'Psychic',
      zMoveName: 'Genesis Supernova',
    },
  ],
  [
    Items.DecidiumZ,
    {
      holders: [Species.Decidueye],
      holder: 'Decidueye',
      move: Moves.SpiritShackle,
      zMove: Moves.SinisterArrowRaid,
      name: 'Decidium Z',
      moveName: 'Spirit Shackle',
      zMoveName: 'Sinister Arrow Raid',
    },
  ],
  [
    Items.InciniumZ,
    {
      holders: [Species.Incineroar],
      holder: 'Incineroar',
      move: Moves.DarkestLariat,
      zMove: Moves.MaliciousMoonsault,
      name: 'Incinium Z',
      moveName: 'Darkest Lariat',
      zMoveName: 'Malicious Moonsault',
    },
  ],
  [
    Items.PrimariumZ,
    {
      holders: [Species.Primarina],
      holder: 'Primarina',
      move: Moves.SparklingAria,
      zMove: Moves.OceanicOperetta,
      name: 'Primarium Z',
      moveName: 'Sparkling Aria',
      zMoveName: 'Oceanic Operetta',
    },
  ],
  [
    Items.LycaniumZ,
    {
      holders: [Species.Lycanroc, Species.LycanrocMidnight, Species.LycanrocDusk],
      holder: 'Lycanroc',
      move: Moves.StoneEdge,
      zMove: Moves.SplinteredStormshards,
      name: 'Lycanium Z',
      moveName: 'Stone Edge',
      zMoveName: 'Splintered Stormshards',
    },
  ],
  [
    Items.MimikiumZ,
    {
      holders: [Species.Mimikyu, Species.MimikyuBusted],
      holder: 'Mimikyu',
      move: Moves.PlayRough,
      zMove: Moves.LetsSnuggleForever,
      name: 'Mimikium Z',
      moveName: 'Play Rough',
      zMoveName: "Let's Snuggle Forever",
    },
  ],
  [
    Items.KommoniumZ,
    {
      holders: [Species.KommoO],
      holder: 'Kommo-o',
      move: Moves.ClangingScales,
      zMove: Moves.ClangorousSoulblaze,
      name: 'Kommonium Z',
      moveName: 'Clanging Scales',
      zMoveName: 'Clangorous Soulblaze',
    },
  ],
  [
    Items.TapuniumZ,
    {
      holders: [Species.TapuKoko, Species.TapuLele, Species.TapuBulu, Species.TapuFini],
      holder: 'Tapu',
      move: Moves.NaturesMadness,
      zMove: Moves.GuardianOfAlola,
      name: 'Tapunium Z',
      moveName: "Nature's Madness",
      zMoveName: 'Guardian of Alola',
    },
  ],
  [
    Items.SolganiumZ,
    {
      holders: [Species.Solgaleo, Species.NecrozmaDuskMane],
      holder: 'Solgaleo or Dusk Mane Necrozma',
      move: Moves.SunsteelStrike,
      zMove: Moves.SearingSunrazeSmash,
      name: 'Solganium Z',
      moveName: 'Sunsteel Strike',
      zMoveName: 'Searing Sunraze Smash',
    },
  ],
  [
    Items.LunaliumZ,
    {
      holders: [Species.Lunala, Species.NecrozmaDawnWings],
      holder: 'Lunala or Dawn Wings Necrozma',
      move: Moves.MoongeistBeam,
      zMove: Moves.MenacingMoonrazeMaelstrom,
      name: 'Lunalium Z',
      moveName: 'Moongeist Beam',
      zMoveName: 'Menacing Moonraze Maelstrom',
    },
  ],
  [
    Items.UltranecroziumZ,
    {
      holders: [Species.NecrozmaDuskMane, Species.NecrozmaDawnWings, Species.NecrozmaUltra],
      holder: 'Necrozma fused with the sun or the moon',
      move: Moves.PhotonGeyser,
      zMove: Moves.LightThatBurnsTheSky,
      name: 'Ultranecrozium Z',
      moveName: 'Photon Geyser',
      zMoveName: 'Light That Burns the Sky',
    },
  ],
  [
    Items.MarshadiumZ,
    {
      holders: [Species.Marshadow],
      holder: 'Marshadow',
      move: Moves.SpectralThief,
      zMove: Moves.SoulStealing7StarStrike,
      name: 'Marshadium Z',
      moveName: 'Spectral Thief',
      zMoveName: 'Soul-Stealing 7-Star Strike',
    },
  ],
]);

/** What a crystal fetches from a shop that will never stock one */
export const Z_CRYSTAL_RESALE = PLATE_RESALE;

const LIMIT = 'Once a side a fight.';

/** Its picture on the `z-crystals` sheet: the crystal's name, lowercased */
function iconOf(name: string): string {
  return `z-crystals/${name.toLowerCase().replaceAll(' ', '-')}`;
}

/** Held, never spent, and never listed, the way a Mega Stone is */
export default function registerZCrystals(): void {
  for (const [item, crystal] of TYPE_CRYSTALS) {
    registerItem(item, {
      name: crystal.name,
      description: `Turns a damaging ${TYPE_NAMES[crystal.type]} move into ${crystal.zMoveName} as it is thrown. ${LIMIT}`,
      type: ItemTypes.Held,
      icon: iconOf(crystal.name),
      flags: ItemFlags.Holdable,
      buy: 0,
      sell: Z_CRYSTAL_RESALE,
    });
  }
  for (const [item, crystal] of SIGNATURE_CRYSTALS) {
    registerItem(item, {
      name: crystal.name,
      description: `Turns a ${crystal.holder}'s ${crystal.moveName} into ${crystal.zMoveName} as it is thrown. ${LIMIT}`,
      type: ItemTypes.Held,
      icon: iconOf(crystal.name),
      flags: ItemFlags.Holdable,
      buy: 0,
      sell: Z_CRYSTAL_RESALE,
    });
  }
}
