import type Lairs from '../../data/overworld/lair';
import type Phenomenon from '../../data/overworld/phenomenon';
import type Abilities from '../../data/ids/abilities';
import type Biome from '../../data/ids/biome';
import type { Moves } from '../../data/ids/moves';
import type Natures from '../../data/ids/natures';
import type { Items } from '../../data/ids/items';
import type { Genders, Species } from '../../data/ids/species';
import type { EncounterType } from './kinds';

/** What a meeting is, as the record a catch is made from */
/**
 * A concrete wild pokemon derived from a spawn roll: everything a
 * battle or capture needs to materialize the unit
 */
export interface Encounter {
  /**
   * How the pokemon was encountered
   */
  type: EncounterType;
  species: Species;
  level: number;
  /**
   * The 32-bit roll the IVs are sliced from
   */
  individualValue: number;
  /**
   * The 32-bit roll whose byte slices drive level, gender, ability
   * and nature
   */
  traitValue: number;
  /**
   * The six per-stat values (0-31) sliced from the individual value,
   * packed five bits each into one integer. `individualValue` is the
   * roll they came from and stays beside them: the two agree for a
   * wild pokemon and disagree for a bred or polished one
   */
  ivs: number;
  nature: Natures;
  /**
   * One of the line's possible abilities, pre-evolutions included
   */
  ability: Abilities;
  /**
   * A pure gender-ratio roll from its dedicated spawn value
   */
  gender: Genders;
  /**
   * The lair it was fought in, for a raid prize; null for everything
   * met anywhere else, and for a shadow raid that stood in no
   * particular place
   */
  lair: Lairs | null;
  /**
   * Whether it sparkles for the observing user. The same wild pokemon
   * can be shiny for one trainer and plain for another, since the
   * roll is a resonance between their id and its trait value
   */
  shiny: boolean;
  /**
   * Whether it is shadowed, which carries the Shadow ability for good
   */
  shadow: boolean;
  /**
   * The last (up to) four level-up moves learnable at this level
   */
  moves: Moves[];
  /**
   * What it is carrying, which is nothing for most of them. A wild
   * pokemon holds at most one thing, so this is empty or a single
   * item
   */
  items: Items[];
  /**
   * The snapshot window the spawn belongs to
   */
  timestamp: number;
  /**
   * The chunk the spawn appeared in
   */
  x: number;
  y: number;
  biome: Biome;
  /**
   * What startled it out, for a meeting a phenomenon staged. Absent
   * for everything walked into, which is most of them.
   *
   * The Lure Ball is what reads it: nothing here fishes, and what a
   * ripple brings up is the nearest thing the world has to a catch on
   * a line
   */
  phenomenon?: Phenomenon;
}
