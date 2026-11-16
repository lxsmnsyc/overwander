import type { JSX } from 'solid-js';
import { getSpeciesData } from '../../../data/species';
import type { EncounterRecord } from '../../../model/encounter-record';
import { GENDER_MARKS } from './metrics';
import { m } from '../../../i18n/paraglide/messages.js';

/**
 * Who is standing there: the species and, for anything that has one,
 * its gender. The level and the marks are pills under it on the field's
 * plate, and the dialog's nameplate says the same in a sentence
 */
export function nameOf(encounter: EncounterRecord): string {
  return `${getSpeciesData(encounter.species).name} ${GENDER_MARKS[encounter.gender]}`.trimEnd();
}

/** The nameplate: the meeting as a line, or the bare word while no encounter is open */
export function appeared(encounter: EncounterRecord | null): string {
  return encounter == null
    ? m.safari_encounter()
    : m.safari_appeared({ name: getSpeciesData(encounter.species).name });
}

/** The name on the field's plate */
export default function Met(props: { encounter: EncounterRecord }): JSX.Element {
  return <span>{nameOf(props.encounter)}</span>;
}
