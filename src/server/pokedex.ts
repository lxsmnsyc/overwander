import 'server-only';
import type Regions from '../data/ids/regions';
import { type CatchSnapshot, asCatchSnapshot } from '../auth/catch-snapshot';
import type { Species } from '../data/ids/species';
import { DEX_CAUGHT, DEX_SEEN, type DexSpec } from '../auth/pokedex-record';
import { getRegionSpan } from '../data/species/regions';
import type { Sql } from 'postgres';
import { type Tx, getSql, tx } from './db';
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
 * Add one sighting each to a whole list, in **one statement**.
 *
 * A species appears at most once in it: postgres refuses an upsert
 * that would touch the same row twice, and a party fielding six
 * Rattata is one Rattata met anyway. The two coats are separate
 * columns of that one row, so a species met in both is a single row
 * carrying a 1 in each
 */
async function logSightings(
  uid: string,
  met: Map<Species, { seen: number; shiny: number }>,
  sql: Sql | Tx = getSql(),
): Promise<void> {
  if (met.size === 0) {
    return;
  }

  const rows = [...met].map(([species, coats]) => ({
    player: uid,
    species,
    seen: coats.seen,
    seen_shiny: coats.shiny,
  }));

  await sql`
    insert into pokedex_entries ${sql(rows, 'player', 'species', 'seen', 'seen_shiny')}
    on conflict (player, species) do update set
      seen = pokedex_entries.seen + excluded.seen,
      seen_shiny = pokedex_entries.seen_shiny + excluded.seen_shiny
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
}

/**
 * Write down one that arrived without ever being met: hatched,
 * evolved into, or handed over at the end of a raid.
 *
 * Both tallies are bumped, because the moment it is the player's is
 * also the first time they have laid eyes on it. Without this the
 * caught column climbs past the seen one, which reads as a dex that
 * has lost count: a Charizard nobody ever saw
 */
export async function recordFoundSpecies(
  uid: string,
  species: Species,
  shiny: boolean,
): Promise<void> {
  await recordSeenSpecies(uid, species, shiny);
  await recordCaughtSpecies(uid, species, shiny);
}

/**
 * Write down every species a battle put in front of the player, which
 * is what standing on a field with something amounts to. Six Rattata
 * on the other side are one Rattata met
 */
export async function recordSeenParty(
  uid: string,
  party: CatchSnapshot[],
  sql?: Sql | Tx,
): Promise<void> {
  const met = new Map<Species, { seen: number; shiny: number }>();

  for (const one of party) {
    met.set(one.species, {
      seen: one.shiny ? (met.get(one.species)?.seen ?? 0) : 1,
      shiny: one.shiny ? 1 : (met.get(one.species)?.shiny ?? 0),
    });
  }
  await logSightings(uid, met, sql);
}

/**
 * Write down everything the other side of a battle fielded against
 * this player.
 *
 * It is called where a battle is **staged** rather than where one is
 * settled, for the same reason an encounter is: a fight walked away
 * from is still a fight the player stood in. The other side is read
 * off the team snapshots the server froze, so it covers every kind of
 * battle at once, a raid boss and a rocket's party and another
 * player's team alike
 */
export async function recordSeenOpponents(battleId: string, uid: string): Promise<void> {
  // One transaction, two statements: the other side is read and the
  // sightings are written together, so a dex cannot be left holding
  // half a battle
  await tx(async (transaction) => {
    const rows = await transaction`
      select ts.catches
      from battle_teams bt
      join team_snapshots ts on ts.id = bt.snapshot_id
      where bt.battle_id = ${battleId} and (bt.player is null or bt.player <> ${uid})
    `;
    const fielded: CatchSnapshot[] = [];

    for (const row of rows) {
      if (Array.isArray(row.catches)) {
        fielded.push(...row.catches.map((value) => asCatchSnapshot(value)));
      }
    }
    await recordSeenParty(uid, fielded, transaction);
  });
}

/**
 * Write down that the player has come to own one they met first: a
 * wild catch, and nothing else.
 *
 * The **seen** tally is deliberately not touched here. The meeting
 * was already counted when the encounter was staged, and counting it
 * again would say a player met two Pidgey where they met one.
 * Anything that arrives without a meeting goes through
 * `recordFoundSpecies` instead
 */
export async function recordCaughtSpecies(
  uid: string,
  species: Species,
  shiny: boolean,
): Promise<void> {
  await logSpecies(uid, DEX_CAUGHT, species, shiny);
}

/**
 * How many distinct species this dex has as caught, shinies included.
 * Given a region, only its stretch of dex numbers counts
 */
export async function readCaughtDexCount(uid: string, region?: Regions): Promise<number> {
  const span = region == null ? null : getRegionSpan(region);
  const sql = getSql();
  const rows = await sql`
    select count(*)::int as held from pokedex_entries
    where player = ${uid} and caught + caught_shiny > 0
    ${span == null ? sql`` : sql`and species between ${span[0]} and ${span[1]}`}
  `;

  return asNumber(rows.at(0)?.held);
}
