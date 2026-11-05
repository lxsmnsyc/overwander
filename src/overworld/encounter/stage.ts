import {
  DEFAULT_ITEM_SLOTS,
  DEFAULT_MOVE_SLOTS,
  Slots,
  defaultSlots,
  withSlots,
} from '../../data/constants/slots';
import type { EncounterRecord } from '../../model/encounter-record';
import type { Spawn } from '../chunk-snapshot';
import type ChunkSnapshot from '../chunk-snapshot';
import type { Buddy } from '../core';
import getWorld from '../current';
import createOverworld from '../setup';
import { EncounterType } from './kinds';
import { getSpawnLevels } from './levels';
import deriveEncounter, { type EncounterOptions } from './index';
import { deriveTrainedAbilities } from './traits';

/**
 * The record a meeting is written down as, worked out in full before
 * anything is stored. The server stages every meeting through this,
 * so what a test rolls here is what the encounters table is handed
 */
export default function stageEncounter(
  uid: string,
  snapshot: ChunkSnapshot,
  id: string,
  spawn: Spawn,
  buddy: Buddy | null,
  options: EncounterOptions = {},
): EncounterRecord {
  // Snapshot spawns are wild meetings; a raid reward carries its own
  // type (raid encounters never flee) and, from a shadow raid, its
  // permanent Shadow ability. What the buddy changes about the
  // meeting (the shiny odds it carries, the nature it passes on, the
  // gender it draws out) is asked of the overworld rather than
  // spelled out here
  const overworld = createOverworld(uid, buddy);

  // The sky the meeting happened under, read here rather than taken
  // from the client: the floor it puts under the pokemon's values and
  // whether it walks out shadowed are both written into the record, so
  // what the weather was is the server's to say
  const sky =
    options.weather ??
    getWorld().getWeather(snapshot.chunk.x, snapshot.chunk.y, snapshot.weatherWindow);
  const derived = deriveEncounter(snapshot, spawn, uid, {
    ...options,
    // After the spread, so a caller that named one keeps it and one
    // that named nothing is not handed an undefined over the top of it
    weather: sky,
    shinyBoost: (options.shinyBoost ?? 1) * overworld.checkEncounterShiny(id),
    // What a buddy finds in a pokemon's mouth, and how strong the
    // chunk fields one. Both are wild-meeting rules: a raid prize and
    // a gift arrive with their level named, and a trainer's party
    // brings a band of its own
    heldBoost: (options.heldBoost ?? 1) * overworld.checkEncounterHeld(id),
    levels:
      options.levels ??
      (options.level == null && (options.type ?? EncounterType.Wild) === EncounterType.Wild
        ? overworld.checkEncounterLevels(id, getSpawnLevels(spawn[0]))
        : undefined),
  });

  // What a trained pokemon keeps once it changes hands: the second
  // ability its owner put into it, and the room for the second item
  // it was carrying. Both are asked for by the caller, since nothing
  // met in the world has either
  const abilities = [
    ...new Set([
      ...deriveTrainedAbilities(
        derived.species,
        derived.traitValue,
        derived.ability,
        options.abilities ?? 1,
      ),
      // Whatever the meeting itself came with, which is a family
      // signature off a fata morgana and nothing else
      ...(derived.abilities ?? []),
    ]),
  ];

  // Room for both, or the record would hold a second ability it has
  // no slot for: the battle counts slots rather than what is on the
  // list, and the counter would read it as already full
  const room = Math.max(DEFAULT_ITEM_SLOTS, options.itemSlots ?? DEFAULT_ITEM_SLOTS);
  const slots = withSlots(
    withSlots(defaultSlots(abilities), Slots.Item, room),
    Slots.Move,
    Math.max(DEFAULT_MOVE_SLOTS, derived.moves.length),
  );

  return {
    ...derived,
    nature: overworld.checkEncounterNature(id, derived.nature),
    gender: overworld.checkEncounterGender(id, derived.gender),
    spawn: id,
    player: uid,
    ...(abilities.length > 1 ? { abilities } : {}),
    ...(slots === defaultSlots() ? {} : { slots }),
  };
}
