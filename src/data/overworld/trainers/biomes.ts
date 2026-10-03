import * as v from 'valibot';
import { Types } from '../../constants/types';
import type Biome from '../../ids/biome';
import { isOpenSea } from '../../ids/biome';
import { BIOME_IDS, TRAINER_IDS } from '../../ids/names';
import { idOf, idsOf } from '../../yaml';
import biomesFile from './biomes.yaml';
import { TRAINER_CLASSES, TRAINER_TYPES, TrainerClass } from './classes';

/**
 * Which type experts a country puts on the road. A Swimmer is met on
 * the water, a Hiker on hard ground, and neither is anywhere else —
 * the same rule the gyms follow, so a player hunting one class knows
 * which country to walk. The Ace Trainer is in none of the lists: they
 * field every type and travel everywhere.
 *
 * The lists are `biomes.yaml`, in the order a stop rolls from them
 */
export const BIOME_TRAINERS: Record<number, TrainerClass[]> = {};

for (const [name, trainers] of Object.entries(
  v.parse(v.record(v.string(), v.array(v.string())), biomesFile),
)) {
  const where = `trainers/biomes.yaml: ${name}`;

  BIOME_TRAINERS[idOf<Biome>(BIOME_IDS, name, where)] = idsOf<TrainerClass>(
    TRAINER_IDS,
    trainers,
    where,
  );
}

/**
 * The classes that can be met out on the water, which are the ones
 * that field it: a swimmer swims, a fisherman and a sailor have a
 * boat under them, a tuber a float. Read off the type table rather
 * than listed again here, so a class added to it is afloat with it
 */
const SEAFARING = new Set<TrainerClass>();

for (const trainer of TRAINER_CLASSES) {
  if (new Set(TRAINER_TYPES[trainer]).has(Types.Water)) {
    SEAFARING.add(trainer);
  }
}

/**
 * Who may be duelling in this country: its own type experts, and the
 * Ace, who belongs to no country.
 *
 * The open seas take only the country's seafarers. A bird keeper
 * watching the ocean does it from a shore, and an Ace fields every
 * type without fielding water in particular, so neither has a way of
 * being out there
 */
export function getBiomeTrainers(biome: Biome): TrainerClass[] {
  if (isOpenSea(biome)) {
    const seafarers: TrainerClass[] = [];

    for (const trainer of BIOME_TRAINERS[biome]) {
      if (SEAFARING.has(trainer)) {
        seafarers.push(trainer);
      }
    }
    return seafarers;
  }
  return [
    TrainerClass.AceTrainer,
    TrainerClass.JohtoAceTrainer,
    TrainerClass.HoennAceTrainer,
    TrainerClass.SinnohAceTrainer,
    TrainerClass.UnovaAceTrainer,
    ...BIOME_TRAINERS[biome],
  ];
}
