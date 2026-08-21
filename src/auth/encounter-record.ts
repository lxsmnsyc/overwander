// Rows arrive untyped; the reads below restore const-enum fields via
// assertions that tsc requires but tsgolint (resolving const enums to
// number) considers unnecessary
// oxlint-disable typescript/no-unnecessary-type-assertion
import type Abilities from '../data/ids/abilities';
import type Biome from '../data/ids/biome';
import type { Items } from '../data/ids/items';
import type { Moves } from '../data/ids/moves';
import type Natures from '../data/ids/natures';
import type { Genders, Species } from '../data/ids/species';
import type Lairs from '../data/overworld/lair';
import type { Encounter, EncounterType } from '../overworld/encounter';
import { asBoolean, asNumber, asNumberArray, asRecord, asString } from './__normalize';

/**
 * A player's view of a spawn, keyed by the spawn and the player.
 * Shininess, gender, ability and nature differ per player, so they are
 * stored per player rather than on the spawn.
 *
 * This row is the authority on what a player met: the server
 * writes it when the meeting starts and reads it back when the catch
 * is recorded, so a client cannot describe a better pokemon than the
 * one it was actually shown
 */
export interface EncounterRecord extends Encounter {
  spawn: string;
  player: string;
  /**
   * What the place is called, for a meeting that happened somewhere
   * with a name rather than at a coordinate — a distribution received
   * in a particular town. Absent for everything met in the world,
   * which is named by the chunk it stands in
   */
  place?: string;
  /**
   * The room the pokemon walks in with, packed. Absent for an ordinary
   * meeting, which arrives with what the game gives everything; a
   * gift may be written with more, and the record has to say so
   */
  slots?: number;
  /**
   * Every ability it walks in with, where it walks in with more than
   * the one it rolled. Absent for an ordinary meeting, which carries
   * `ability` and nothing else
   */
  abilities?: Abilities[];
}

/**
 * Restore an encounter record from an untyped row. Both
 * the client (through its converter) and the privileged server read
 * through here, so the two agree on what the stored shape means
 */
export function asEncounterRecord(value: unknown): EncounterRecord {
  const data = asRecord(value);

  return {
    spawn: asString(data.spawn),
    player: asString(data.player),
    type: asNumber(data.type) as EncounterType,
    species: asNumber(data.species) as Species,
    level: asNumber(data.level),
    individualValue: asNumber(data.individualValue),
    traitValue: asNumber(data.traitValue),
    ivs: asNumber(data.ivs),
    lair: data.lair == null ? null : (asNumber(data.lair) as Lairs),
    nature: asNumber(data.nature) as Natures,
    ability: asNumber(data.ability) as Abilities,
    gender: asNumber(data.gender) as Genders,
    shiny: asBoolean(data.shiny),
    shadow: asBoolean(data.shadow),
    moves: asNumberArray(data.moves) as Moves[],
    // Missing on a record written before wild pokemon carried
    // anything: empty-handed, which is what it was
    items: asNumberArray(data.items) as Items[],
    timestamp: asNumber(data.timestamp),
    x: asNumber(data.x),
    y: asNumber(data.y),
    biome: asNumber(data.biome) as Biome,
    // Both are absent from every meeting but a written one, and left
    // off rather than defaulted: a place nobody named has no name
    ...(typeof data.place === 'string' && data.place !== '' ? { place: data.place } : {}),
    ...(typeof data.slots === 'number' ? { slots: asNumber(data.slots) } : {}),
    ...(Array.isArray(data.abilities)
      ? { abilities: asNumberArray(data.abilities) as Abilities[] }
      : {}),
  };
}
