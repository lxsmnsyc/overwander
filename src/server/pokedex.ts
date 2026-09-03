import 'server-only';
import type Regions from '../data/ids/regions';
import type { Species } from '../data/ids/species';
import { FORMS_PER_SPECIES, SPECIES_FORM_BAND } from '../data/ids/species';
import { DEX_CAUGHT, DEX_SEEN, type DexSpec } from '../auth/pokedex-record';
import { getRegionSpan } from '../data/species/regions';
import { getWornForms } from '../data/species';
import type { Fragment, Sql } from 'postgres';
import { getSql } from './db';
import { asNumber } from './read';

/**
 * The dex, written over the owner connection.
 *
 * A dex is a record of what happened rather than something a player
 * owns, so nothing a browser sends may touch it: a client that could
 * write one could claim to have met whatever it liked.
 *
 * Every write is one atomic upsert against the (player, species) row,
 * so two species logged in the same breath cannot clobber each other
 * and the first meeting creates the row. Nothing reads before it
 * writes: the counts only ever go up, and a trigger holds them to it.
 */

/**
 * Add one to a tally. The sparkling ones are counted in the column of
 * their own rather than in both, so the two are separate totals and
 * the sum of them is how many were met altogether
 */
async function logSpecies(
  uid: string,
  spec: DexSpec,
  species: Species,
  shiny: boolean,
): Promise<void> {
  const sql = getSql();
  const base = spec === DEX_SEEN ? 'seen' : 'caught';
  const column = shiny ? `${base}_shiny` : base;

  await sql`
    insert into pokedex_entries (player, species, ${sql(column)})
    values (${uid}, ${species}, 1)
    on conflict (player, species)
      do update set ${sql(column)} = pokedex_entries.${sql(column)} + 1
  `;
}

/**
 * Write down that the player has met one.
 *
 * It is called where an encounter is **staged** rather than where one
 * is finished, so a pokemon that fled, or one a player walked away
 * from, is still one they have seen. The encounter row is written
 * once per spawn and player, so a meeting walked back into is not
 * counted twice
 */
export async function recordSeenSpecies(
  uid: string,
  species: Species,
  shiny: boolean,
): Promise<void> {
  await logSpecies(uid, DEX_SEEN, species, shiny);

  // A worn shape is never met on its own, so meeting the pokemon is
  // the only chance the dex gets to fill it in
  for (const worn of getWornForms(species)) {
    await logSpecies(uid, DEX_SEEN, worn, shiny);
  }
}

/**
 * Write down that the player has come to own one: caught, hatched or
 * given.
 *
 * The **seen** tally is deliberately not touched here. A wild catch
 * was already counted when the meeting was staged, and counting it
 * again would say a player met two Pidgey where they met one
 */
export async function recordCaughtSpecies(
  uid: string,
  species: Species,
  shiny: boolean,
): Promise<void> {
  await logSpecies(uid, DEX_CAUGHT, species, shiny);
}

/**
 * The dex number behind a stored id: itself below the form band, and
 * the species it is a form of above it.
 *
 * A fragment rather than a query, spliced into the one below and
 * never awaited, whatever its promise-shaped type says
 */
// oxlint-disable-next-line typescript/promise-function-async
function dexNumberOf(sql: Sql): Fragment {
  return sql`(case
    when species < ${SPECIES_FORM_BAND} then species
    else (species - ${SPECIES_FORM_BAND}) / ${FORMS_PER_SPECIES}
  end)`;
}

/**
 * How many distinct species this dex has as caught, shinies included.
 * Given a region, only its stretch of dex numbers counts.
 *
 * Counted in **pokemon rather than rows**: a player with nine unowns
 * has caught one pokemon, and it is a Johto one even though a form id
 * is nowhere near Johto's stretch
 */
export async function readCaughtDexCount(uid: string, region?: Regions): Promise<number> {
  const span = region == null ? null : getRegionSpan(region);
  const sql = getSql();
  // Built twice rather than held once: a fragment is spliced where it
  // is written, and the same object in two places is one too many
  const rows = await sql`
    select count(distinct ${dexNumberOf(sql)})::int as held from pokedex_entries
    where player = ${uid} and caught + caught_shiny > 0
    ${span == null ? sql`` : sql`and ${dexNumberOf(sql)} between ${span[0]} and ${span[1]}`}
  `;

  return asNumber(rows.at(0)?.held);
}
