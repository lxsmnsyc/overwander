import { Species } from '../../ids/species';
import type Regions from '../../ids/regions';
import { getSpeciesByRegion, getSpeciesData, getSpeciesRegion, isBaseForm } from '../../species';
import { EVERY_LAIR, getLairResidents } from '../lair';
import { TRAINER_REGIONS, TrainerClass } from './classes';
import TRAINER_TYPES from './types';

/**
 * What the Ace fields: five fully-grown pokemon, and none of them the
 * biome's business
 */
export const ACE_PARTY_SIZE = 5;

export const ACE_TRAINER_LEVELS: [minimum: number, maximum: number] = [60, 80];

/**
 * What a type expert fields: three to five of their own type, the
 * count rolled with the party. They are the roadside fight a player
 * meets long before the Ace
 */
export const TYPE_TRAINER_PARTY_MIN = 3;
export const TYPE_TRAINER_PARTY_MAX = 5;

export const TYPE_TRAINER_LEVELS: [minimum: number, maximum: number] = [40, 60];

/**
 * Whether this is one of the Aces. Each region has one, and what
 * makes them the hard fight of the road is the same in both: no type,
 * five fully-grown, and the levels and the purse to match
 */
export function isAceTrainer(trainer: TrainerClass): boolean {
  return (
    trainer === TrainerClass.AceTrainer ||
    trainer === TrainerClass.JohtoAceTrainer ||
    trainer === TrainerClass.HoennAceTrainer ||
    trainer === TrainerClass.SinnohAceTrainer
  );
}

/** The level band a class fights in */
export function trainerLevels(trainer: TrainerClass): [minimum: number, maximum: number] {
  return isAceTrainer(trainer) ? ACE_TRAINER_LEVELS : TYPE_TRAINER_LEVELS;
}

const LAIR_SPECIES = new Set(EVERY_LAIR.flatMap(getLairResidents));

/**
 * Whether this is as far as the species goes **within this region**.
 *
 * A later generation often puts the last stage of an older line in
 * its own dex: a Misdreavus grows into a Mismagius, and Mismagius is
 * Sinnoh's. A Johto trainer walks the Misdreavus, so a stage whose
 * every evolution belongs somewhere else is grown as far as this
 * region is concerned
 */
export function isGrownInRegion(species: Species, region: Regions): boolean {
  const roads = getSpeciesData(species).evolvesInto ?? [];

  return roads.every((road) => getSpeciesRegion(road.species) !== region);
}

/**
 * What a class may field: their own region's fully-grown species of
 * their own type, or of any type for the Ace. The region is the
 * class', not the country they are standing in, which is what makes
 * a Johto Swimmer worth meeting on the same water as a Kanto one.
 *
 * Legendaries stay out, one belongs to its raid, and so do the
 * alternate forms and the egg
 */
export function getTrainerPool(trainer: TrainerClass): Species[] {
  const types = new Set(TRAINER_TYPES[trainer]);

  return getSpeciesByRegion(TRAINER_REGIONS[trainer]).filter((species) => {
    if (species === Species.Egg || LAIR_SPECIES.has(species) || !isBaseForm(species)) {
      return false;
    }
    // "Rare" is the shape of the line rather than the odds of meeting
    // one: a species nothing evolves into is what a trainer this far
    // along would be walking with
    if (!isGrownInRegion(species, TRAINER_REGIONS[trainer])) {
      return false;
    }
    // An empty list is every type there is, which is the Ace's
    return types.size === 0 || getSpeciesData(species).types.some((one) => types.has(one));
  });
}
