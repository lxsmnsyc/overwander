import * as v from 'valibot';
import type Abilities from '../ids/abilities';
import { ABILITY_IDS } from '../ids/names';
import { idsOf } from '../yaml';
import flagsFile from './flags.yaml';

/**
 * The abilities a mechanic treats apart, out of `flags.yaml`. Kept in a
 * leaf of their own so the ability factories may read them without
 * importing the abilities that use them
 */

const NAMES = v.array(v.string());

const flags = v.parse(
  v.strictObject({
    unreceivable: NAMES,
    protected: NAMES,
    'mold-proof': NAMES,
    'always-known': NAMES,
  }),
  flagsFile,
);

function abilities(names: string[], where: string): Set<Abilities> {
  return new Set(idsOf<Abilities>(ABILITY_IDS, names, `flags.yaml: ${where}`));
}

/** What Receiver and Power of Alchemy will not take up */
export const UNRECEIVABLE = abilities(flags.unreceivable, 'unreceivable');

/** The special-tier abilities that can never be disabled */
export const PROTECTED_ABILITIES = abilities(flags.protected, 'protected');

/** The ones Mold Breaker cannot see past, though Neutralizing Gas still quiets them */
export const MOLD_PROOF_ABILITIES = abilities(flags['mold-proof'], 'mold-proof');

/** The ones the AI knows about without seeing them cue */
export const ALWAYS_KNOWN = abilities(flags['always-known'], 'always-known');
