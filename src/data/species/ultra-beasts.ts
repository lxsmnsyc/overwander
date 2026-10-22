import * as v from 'valibot';
import { SPECIES_IDS } from '../ids/names';
import type { Species } from '../ids/species';
import { idsOf } from '../yaml';
import beastsFile from './ultra-beasts.yaml';

/** The Ultra Beasts, which a Beast Ball is made for, out of `ultra-beasts.yaml` */
export const ULTRA_BEASTS = new Set<Species>(
  idsOf<Species>(SPECIES_IDS, v.parse(v.array(v.string()), beastsFile), 'ultra-beasts.yaml'),
);

export function isUltraBeast(species: Species): boolean {
  return ULTRA_BEASTS.has(species);
}
