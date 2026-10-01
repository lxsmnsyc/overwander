import { Stats } from '../constants/stats';
import { Types } from '../constants/types';
import Abilities from '../ids/abilities';
import { Items } from '../ids/items';
import { Species } from '../ids/species';
import { getSpeciesData, registerSpecies } from './__create';

/**
 * The Zeniths: this engine's own answer to a Mega, for a pokemon that
 * has none. A final stage holding its Zenith Shard fights at its peak,
 * 100 points above its own base stat total, wearing an ability it
 * cannot otherwise reach and sometimes a type it does not have.
 *
 * A pokemon with a Mega, or with a shape some other held item puts it
 * in, has no Zenith: one held transformation per pokemon. Like a Mega,
 * each is worn rather than met, and everything it does not change is
 * read off the pokemon it is a Zenith of, so these register after
 * every generation. The battle side is `src/battle/items/zeniths.ts`.
 */

export interface ZenithShape {
  zenith: Species;
  base: Species;
  /** Who it is for, written out since items register apart from species */
  holder: string;
  /** HP, Attack, Defense, Special Attack, Special Defense, Speed */
  stats: [number, number, number, number, number, number];
  types: Types[];
  /** Worn on top of the catch's own, and never one the line can be born with */
  ability: Abilities;
  /** The shard held to reach it */
  shard: Items;
}

export const ZENITH_SHAPES: ZenithShape[] = [
  {
    // The Legendary Pokemon of old scrolls, at last living up to it:
    // the speed of its legend, and the jaws of a guardian lion
    zenith: Species.ArcanineZenith,
    base: Species.Arcanine,
    holder: 'Arcanine',
    stats: [90, 130, 90, 110, 100, 135],
    types: [Types.Fire, Types.Dragon],
    ability: Abilities.StrongJaw,
    shard: Items.ArcanineZenithShard,
  },
];

/**
 * The pokemon Legends: Z-A and its Mega Dimension gave a Mega that is
 * not registered here yet. Each is spoken for by that Mega, so none of
 * them gets a Zenith; a Mega registered later leaves this list
 */
export const RESERVED_FOR_MEGAS = new Set<Species>([
  Species.Raichu,
  Species.Clefable,
  Species.Victreebel,
  Species.Starmie,
  Species.Dragonite,
  Species.Meganium,
  Species.Feraligatr,
  Species.Skarmory,
  Species.Chimecho,
  Species.Staraptor,
  Species.Froslass,
  Species.Heatran,
  Species.Darkrai,
  Species.Emboar,
  Species.Excadrill,
  Species.Scolipede,
  Species.Scrafty,
  Species.Eelektross,
  Species.Chandelure,
  Species.Golurk,
  Species.Chesnaught,
  Species.Delphox,
  Species.Greninja,
  Species.Pyroar,
  Species.Meowstic,
  Species.Malamar,
  Species.Barbaracle,
  Species.Dragalge,
  Species.Hawlucha,
  Species.Zygarde,
]);

/** What a Zenith adds to the base stat total of the pokemon it is a Zenith of */
export const ZENITH_BONUS = 100;

const ZENITH_BASES = new Map<Species, Species>();
const ZENITH_OF = new Map<Species, ZenithShape>();

for (const shape of ZENITH_SHAPES) {
  ZENITH_BASES.set(shape.zenith, shape.base);
  ZENITH_OF.set(shape.base, shape);
}

/** Whether this is a Zenith rather than an ordinary pokemon */
export function isZenithSpecies(species: Species): boolean {
  return ZENITH_BASES.has(species);
}

/** The pokemon this Zenith is a Zenith of, or null for everything else */
export function getZenithBase(species: Species): Species | null {
  return ZENITH_BASES.get(species) ?? null;
}

/** The Zenith this pokemon reaches, or null for one that has none */
export function getZenithShape(base: Species): ZenithShape | null {
  return ZENITH_OF.get(base) ?? null;
}

/** Every Zenith there is, in the order the dex meets their pokemon */
export function listZeniths(): Species[] {
  return [...ZENITH_BASES.keys()];
}

/** Registered after every generation, since each one is read off the pokemon it is a Zenith of */
export default function registerZenithSpecies(): void {
  for (const shape of ZENITH_SHAPES) {
    const base = getSpeciesData(shape.base);
    const [hp, attack, defense, specialAttack, specialDefense, speed] = shape.stats;

    registerSpecies(shape.zenith, {
      ...base,
      name: `Zenith ${shape.holder}`,
      baseForm: false,
      worn: true,
      stats: {
        [Stats.HP]: hp,
        [Stats.Attack]: attack,
        [Stats.Defense]: defense,
        [Stats.SpecialAttack]: specialAttack,
        [Stats.SpecialDefense]: specialDefense,
        [Stats.Speed]: speed,
      },
      types: shape.types,
      abilities: [shape.ability],
      hiddenAbilities: [],
      // Put on in a fight rather than grown into, so it stands in no
      // line and nothing stages it
      evolvesFrom: undefined,
      evolvesInto: undefined,
      eggSpecies: undefined,
      biomes: [],
    });
  }
}
