import 'server-only';
import { asOffset } from '../auth/local-time';
import type { Tx } from './db';
import { asNumber, asNumberArray, asRecord, asRecordArray, asString } from './read';

/**
 * The bridge between the normalized tables and the record shape the
 * game logic reads.
 *
 * A catch is one row plus four child tables, but everything above
 * this file still thinks in the old document shape: `moves` an array,
 * `movePoints` a map, `history` a list, `caughtAt` an ISO string in
 * the owner's zone. Assembling that shape here, once, means the
 * validation and game logic ported from the Firestore days keep
 * reading the fields they always read, and `asCaughtPokemon` stays
 * the single normalizer on both sides of the wire.
 */

/** The escrow sentinel the record shape still uses for a NULL owner */
const ESCROW = '';

/**
 * An ISO local timestamp with its offset re-attached, which is the
 * string shape the record has always carried
 */
export function toStoredISO(local: unknown, offset: number): string {
  const stamp = local instanceof Date ? local : new Date(asString(local));
  const minutes = asOffset(offset);
  const absolute = Math.abs(minutes);
  const hours = String(Math.floor(absolute / 60)).padStart(2, '0');
  const rest = String(absolute % 60).padStart(2, '0');

  return `${stamp.toISOString().slice(0, -1)}${minutes < 0 ? '-' : '+'}${hours}:${rest}`;
}

/**
 * The two column halves of a stored local timestamp, from the ISO
 * string shape
 */
export function fromStoredISO(iso: string): { local: Date; offset: number } {
  const match = /([+-])(\d{2}):(\d{2})$/.exec(iso);
  const offset =
    match == null ? 0 : (match[1] === '-' ? -1 : 1) * (Number(match[2]) * 60 + Number(match[3]));
  const local = new Date(`${iso.replace(/([+-]\d{2}:\d{2}|Z)$/, '')}Z`);

  return { local, offset };
}

/**
 * One catch in the legacy record shape, or null when there is no such
 * row. `lock` takes `for update` on the row and its children, which
 * every read-then-write caller wants
 */
export async function readCaughtIn(
  transaction: Tx,
  id: string,
  lock = true,
): Promise<Record<string, unknown> | null> {
  const rows = lock
    ? await transaction`select * from caught where id = ${id} for update`
    : await transaction`select * from caught where id = ${id}`;
  const row = rows.at(0);

  if (row == null) {
    return null;
  }

  const [moves, abilities, items, history] = await Promise.all([
    transaction`select move, points from caught_moves where caught_id = ${id} order by slot`,
    transaction`select ability from caught_abilities where caught_id = ${id} order by slot`,
    transaction`select item from caught_items where caught_id = ${id} order by slot`,
    transaction`
      select owner, owner_name, acquired_at_local, acquired_at_offset, kind, paid, ball
      from caught_history where caught_id = ${id} order by seq
    `,
  ]);

  return assembleCaught(row, moves, abilities, items, history);
}

/**
 * The row and its children as the record shape. Split out so list
 * readers that batch their child queries can reuse the assembly
 */
export function assembleCaught(
  row: Record<string, unknown>,
  moves: readonly Record<string, unknown>[],
  abilities: readonly Record<string, unknown>[],
  items: readonly Record<string, unknown>[],
  history: readonly Record<string, unknown>[],
): Record<string, unknown> {
  const movePoints: Record<string, number> = {};

  for (const entry of moves) {
    const points = asNumber(entry.points);

    if (points > 0) {
      movePoints[String(asNumber(entry.move))] = points;
    }
  }

  return {
    owner: row.owner == null ? ESCROW : asString(row.owner),
    type: row.type,
    species: row.species,
    nickname: row.nickname,
    level: row.level,
    individualValue: row.individual_value,
    traitValue: row.trait_value,
    ivs: row.ivs,
    gender: row.gender,
    nature: row.nature,
    shiny: row.shiny,
    shadow: row.shadow,
    egg: row.egg,
    favorite: row.favorite,
    guarded: row.guarded,
    traded: row.traded,
    auctionable: row.auctionable,
    moves: moves.map((entry) => asNumber(entry.move)),
    movePoints,
    abilities: abilities.map((entry) => asNumber(entry.ability)),
    slots: row.slots,
    items: items.map((entry) => asNumber(entry.item)),
    history: history.map((entry) => ({
      owner: entry.owner == null ? asString(entry.owner_name) : asString(entry.owner),
      ...(entry.owner == null && entry.owner_name != null
        ? { name: asString(entry.owner_name) }
        : {}),
      acquiredAt: toStoredISO(entry.acquired_at_local, asNumber(entry.acquired_at_offset)),
      kind: entry.kind,
      paid: entry.paid == null ? null : asNumber(entry.paid),
      ball: entry.ball == null ? null : asNumber(entry.ball),
    })),
    lockedAt: row.locked_at,
    steps: row.steps,
    hatchSteps: row.hatch_steps,
    steppedAt: row.stepped_at,
    health: row.health,
    statuses: row.statuses,
    lair: row.lair,
    ball: row.ball,
    caughtAt: toStoredISO(row.caught_at_local, asNumber(row.caught_at_offset)),
    locale: row.locale,
    effortValues: {
      0: row.ev_hp,
      1: row.ev_atk,
      2: row.ev_def,
      3: row.ev_spa,
      4: row.ev_spd,
      5: row.ev_spe,
    },
    effortBonus: row.effort_bonus,
    walked: row.walked,
    friendship: row.friendship,
    origin: {
      timestamp: row.origin_timestamp,
      x: row.origin_x,
      y: row.origin_y,
      biome: row.origin_biome,
      ...(row.origin_place == null ? {} : { place: row.origin_place }),
    },
  };
}

/** Legacy field name to its scalar column, for the update mapper */
const SCALAR_COLUMNS: Record<string, string> = {
  owner: 'owner',
  type: 'type',
  species: 'species',
  nickname: 'nickname',
  level: 'level',
  individualValue: 'individual_value',
  traitValue: 'trait_value',
  ivs: 'ivs',
  gender: 'gender',
  nature: 'nature',
  shiny: 'shiny',
  shadow: 'shadow',
  egg: 'egg',
  favorite: 'favorite',
  guarded: 'guarded',
  traded: 'traded',
  auctionable: 'auctionable',
  slots: 'slots',
  lockedAt: 'locked_at',
  locked_at: 'locked_at',
  steps: 'steps',
  hatchSteps: 'hatch_steps',
  steppedAt: 'stepped_at',
  health: 'health',
  statuses: 'statuses',
  lair: 'lair',
  ball: 'ball',
  locale: 'locale',
  effortBonus: 'effort_bonus',
  walked: 'walked',
  friendship: 'friendship',
};

const EV_COLUMNS = ['ev_hp', 'ev_atk', 'ev_def', 'ev_spa', 'ev_spd', 'ev_spe'];

/**
 * Apply a bag of legacy-shaped fields to the row and its children.
 *
 * Arrays replace their child rows whole, the way the old code always
 * rewrote the whole array; `movePoints` rides on the move rows, so a
 * caller changing points without changing moves may pass it alone.
 * An `owner` of the empty string is the escrow sentinel and stores as
 * NULL. `caughtAt` and `history` accept the ISO string shape
 */
export async function updateCaughtIn(
  transaction: Tx,
  id: string,
  fields: Record<string, unknown>,
): Promise<void> {
  const scalars: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(fields)) {
    if (Object.hasOwn(SCALAR_COLUMNS, key)) {
      const column = SCALAR_COLUMNS[key];

      scalars[column] = column === 'owner' && value === ESCROW ? null : value;
    }
  }

  if ('effortValues' in fields) {
    const values = asRecord(fields.effortValues);

    for (const [at, column] of EV_COLUMNS.entries()) {
      scalars[column] = asNumber(values[String(at)]);
    }
  }
  if ('caughtAt' in fields) {
    const { local, offset } = fromStoredISO(asString(fields.caughtAt));

    scalars.caught_at_local = local;
    scalars.caught_at_offset = offset;
  }

  if (Object.keys(scalars).length > 0) {
    await transaction`
      update caught set ${transaction(scalars, ...Object.keys(scalars))}
      where id = ${id}
    `;
  }

  if ('moves' in fields) {
    const moves = asNumberArray(fields.moves);
    const points = asRecord(fields.movePoints);

    await transaction`delete from caught_moves where caught_id = ${id}`;
    if (moves.length > 0) {
      const rows = moves.map((move, slot) => ({
        caught_id: id,
        slot,
        move,
        points: asNumber(points[String(move)]),
      }));

      await transaction`
        insert into caught_moves ${transaction(rows, 'caught_id', 'slot', 'move', 'points')}
      `;
    }
  } else if ('movePoints' in fields) {
    const points = asRecord(fields.movePoints);

    await transaction`update caught_moves set points = 0 where caught_id = ${id}`;
    for (const [move, value] of Object.entries(points)) {
      await transaction`
        update caught_moves set points = ${asNumber(value)}
        where caught_id = ${id} and move = ${Number(move)}
      `;
    }
  }

  if ('abilities' in fields) {
    const abilities = asNumberArray(fields.abilities);

    await transaction`delete from caught_abilities where caught_id = ${id}`;
    if (abilities.length > 0) {
      const rows = abilities.map((ability, slot) => ({ caught_id: id, slot, ability }));

      await transaction`
        insert into caught_abilities ${transaction(rows, 'caught_id', 'slot', 'ability')}
      `;
    }
  }

  if ('items' in fields) {
    const items = asNumberArray(fields.items);

    await transaction`delete from caught_items where caught_id = ${id}`;
    if (items.length > 0) {
      const rows = items.map((item, slot) => ({ caught_id: id, slot, item }));

      await transaction`
        insert into caught_items ${transaction(rows, 'caught_id', 'slot', 'item')}
      `;
    }
  }

  if ('history' in fields) {
    const history = asRecordArray(fields.history);

    // Append-only in the schema: only rows past the stored count may
    // be inserted, which is exactly what every caller does
    const counted = await transaction`
      select count(*)::int as seq from caught_history where caught_id = ${id}
    `;
    const from = asNumber(counted[0]?.seq);

    for (const [at, entry] of history.entries()) {
      if (at < from) {
        continue;
      }

      const { local, offset } = fromStoredISO(asString(entry.acquiredAt));
      const owner = asString(entry.owner);
      const named = 'name' in entry && entry.name != null;
      // A named entry is a story trainer; a uuid is a real player. The
      // two columns are exclusive
      const ownerColumn = named || !isUuid(owner) ? null : owner;
      let ownerNameColumn: string | null = null;

      if (named) {
        ownerNameColumn = asString(entry.name);
      } else if (!isUuid(owner)) {
        ownerNameColumn = owner;
      }

      await transaction`
        insert into caught_history
          (caught_id, seq, owner, owner_name, acquired_at_local, acquired_at_offset,
           kind, paid, ball)
        values
          (${id}, ${at},
           ${ownerColumn},
           ${ownerNameColumn},
           ${local}, ${offset}, ${asNumber(entry.kind)},
           ${entry.paid == null ? null : asNumber(entry.paid)},
           ${entry.ball == null ? null : asNumber(entry.ball)})
      `;
    }
  }
}

/** Whether the string is an account id rather than a story name */
function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
