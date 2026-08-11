// Firestore returns untyped documents; the reads below restore
// const-enum fields via assertions that tsc requires but tsgolint
// (resolving const enums to number) considers unnecessary
// oxlint-disable typescript/no-unnecessary-type-assertion
import type Abilities from '../data/ids/abilities';
import type Biome from '../data/ids/biome';
import type { Moves } from '../data/ids/moves';
import type Natures from '../data/ids/natures';
import type { Genders, Species } from '../data/ids/species';
import type { Encounter, EncounterType } from '../overworld/encounter';
import { asNumber, asNumberArray, asRecord, asString } from './__normalize';

/**
 * A player's view of a spawn at encounters/{spawnId}:{playerId}. The
 * derived traits — shininess, gender, ability, nature — differ per
 * player, so they are stored per player rather than on the spawn.
 *
 * This document is the authority on what a player met: the server
 * writes it when the meeting starts and reads it back when the catch
 * is recorded, so a client cannot describe a better pokemon than the
 * one it was actually shown
 */
export interface EncounterRecord extends Encounter {
  spawn: string;
  player: string;
}

/**
 * Restore an encounter record from an untyped Firestore value. Both
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
    nature: asNumber(data.nature) as Natures,
    ability: asNumber(data.ability) as Abilities,
    gender: asNumber(data.gender) as Genders,
    flags: asNumber(data.flags),
    moves: asNumberArray(data.moves) as Moves[],
    timestamp: asNumber(data.timestamp),
    x: asNumber(data.x),
    y: asNumber(data.y),
    biome: asNumber(data.biome) as Biome,
  };
}
