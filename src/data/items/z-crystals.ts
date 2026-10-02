import { TYPE_NAMES, Types } from '../constants/types';
import { Items } from '../ids/items';
import { Moves } from '../ids/moves';
import { Species } from '../ids/species';
import { itemText } from './__create';

/**
 * The Z-Crystals. Held, and never spent: the crystal turns one of the
 * holder's moves into its Z-Move as it is thrown, once a side a fight.
 * The battle side is in `src/battle/moves/z-moves.ts`
 */

/** The crystals of one type, each turning any damaging move of it */
export const TYPE_CRYSTALS = new Map<Items, TypeCrystal>([
  [Items.NormaliumZ, { type: Types.Normal, zMoveName: 'Breakneck Blitz' }],
  [Items.FightiniumZ, { type: Types.Fighting, zMoveName: 'All-Out Pummeling' }],
  [Items.FlyiniumZ, { type: Types.Flying, zMoveName: 'Supersonic Skystrike' }],
  [Items.PoisoniumZ, { type: Types.Poison, zMoveName: 'Acid Downpour' }],
  [Items.GroundiumZ, { type: Types.Ground, zMoveName: 'Tectonic Rage' }],
  [Items.RockiumZ, { type: Types.Rock, zMoveName: 'Continental Crush' }],
  [Items.BuginiumZ, { type: Types.Bug, zMoveName: 'Savage Spin-Out' }],
  [Items.GhostiumZ, { type: Types.Ghost, zMoveName: 'Never-Ending Nightmare' }],
  [Items.SteeliumZ, { type: Types.Steel, zMoveName: 'Corkscrew Crash' }],
  [Items.FiriumZ, { type: Types.Fire, zMoveName: 'Inferno Overdrive' }],
  [Items.WateriumZ, { type: Types.Water, zMoveName: 'Hydro Vortex' }],
  [Items.GrassiumZ, { type: Types.Grass, zMoveName: 'Bloom Doom' }],
  [Items.ElectriumZ, { type: Types.Electric, zMoveName: 'Gigavolt Havoc' }],
  [Items.PsychiumZ, { type: Types.Psychic, zMoveName: 'Shattered Psyche' }],
  [Items.IciumZ, { type: Types.Ice, zMoveName: 'Subzero Slammer' }],
  [Items.DragoniumZ, { type: Types.Dragon, zMoveName: 'Devastating Drake' }],
  [Items.DarkiniumZ, { type: Types.Dark, zMoveName: 'Black Hole Eclipse' }],
  [Items.FairiumZ, { type: Types.Fairy, zMoveName: 'Twinkle Tackle' }],
]);

/** A crystal that turns any damaging move of one type */
export interface TypeCrystal {
  type: Types;
  /** Written out since items register apart from moves */
  zMoveName: string;
}

/** A crystal that turns one move of one line into that line's own Z-Move */
export interface SignatureCrystal {
  /** Who may use it, every form included */
  holders: Species[];
  move: Moves;
  zMove: Moves;
}

export const SIGNATURE_CRYSTALS = new Map<Items, SignatureCrystal>([
  [
    Items.PikaniumZ,
    {
      holders: [Species.Pikachu],
      move: Moves.VoltTackle,
      zMove: Moves.Catastropika,
    },
  ],
  // Only a Pikachu in one of Ash's caps, and none of those is in the dex yet
  [
    Items.PikashuniumZ,
    {
      holders: [],
      move: Moves.Thunderbolt,
      zMove: Moves.TenMillionVoltThunderbolt,
    },
  ],
  [
    Items.AloraichiumZ,
    {
      holders: [Species.RaichuAlola],
      move: Moves.Thunderbolt,
      zMove: Moves.StokedSparksurfer,
    },
  ],
  [
    Items.EeviumZ,
    {
      holders: [Species.Eevee],
      move: Moves.LastResort,
      zMove: Moves.ExtremeEvoboost,
    },
  ],
  [
    Items.SnorliumZ,
    {
      holders: [Species.Snorlax],
      move: Moves.GigaImpact,
      zMove: Moves.PulverizingPancake,
    },
  ],
  [
    Items.MewniumZ,
    {
      holders: [Species.Mew],
      move: Moves.Psychic,
      zMove: Moves.GenesisSupernova,
    },
  ],
  [
    Items.DecidiumZ,
    {
      holders: [Species.Decidueye],
      move: Moves.SpiritShackle,
      zMove: Moves.SinisterArrowRaid,
    },
  ],
  [
    Items.InciniumZ,
    {
      holders: [Species.Incineroar],
      move: Moves.DarkestLariat,
      zMove: Moves.MaliciousMoonsault,
    },
  ],
  [
    Items.PrimariumZ,
    {
      holders: [Species.Primarina],
      move: Moves.SparklingAria,
      zMove: Moves.OceanicOperetta,
    },
  ],
  [
    Items.LycaniumZ,
    {
      holders: [Species.Lycanroc, Species.LycanrocMidnight, Species.LycanrocDusk],
      move: Moves.StoneEdge,
      zMove: Moves.SplinteredStormshards,
    },
  ],
  [
    Items.MimikiumZ,
    {
      holders: [Species.Mimikyu, Species.MimikyuBusted],
      move: Moves.PlayRough,
      zMove: Moves.LetsSnuggleForever,
    },
  ],
  [
    Items.KommoniumZ,
    {
      holders: [Species.KommoO],
      move: Moves.ClangingScales,
      zMove: Moves.ClangorousSoulblaze,
    },
  ],
  [
    Items.TapuniumZ,
    {
      holders: [Species.TapuKoko, Species.TapuLele, Species.TapuBulu, Species.TapuFini],
      move: Moves.NaturesMadness,
      zMove: Moves.GuardianOfAlola,
    },
  ],
  [
    Items.SolganiumZ,
    {
      holders: [Species.Solgaleo, Species.NecrozmaDuskMane],
      move: Moves.SunsteelStrike,
      zMove: Moves.SearingSunrazeSmash,
    },
  ],
  [
    Items.LunaliumZ,
    {
      holders: [Species.Lunala, Species.NecrozmaDawnWings],
      move: Moves.MoongeistBeam,
      zMove: Moves.MenacingMoonrazeMaelstrom,
    },
  ],
  [
    Items.UltranecroziumZ,
    {
      holders: [Species.NecrozmaDuskMane, Species.NecrozmaDawnWings, Species.NecrozmaUltra],
      move: Moves.PhotonGeyser,
      zMove: Moves.LightThatBurnsTheSky,
    },
  ],
  [
    Items.MarshadiumZ,
    {
      holders: [Species.Marshadow],
      move: Moves.SpectralThief,
      zMove: Moves.SoulStealing7StarStrike,
    },
  ],
]);

export function describeZCrystal(item: Items): string {
  const crystal = TYPE_CRYSTALS.get(item);

  if (crystal == null) {
    throw new Error(`Item #${item} is not a type crystal`);
  }
  return itemText('z-crystals', 'type', {
    type: TYPE_NAMES[crystal.type],
    zMove: crystal.zMoveName,
  });
}
