import { asRecordArray } from './__normalize';
import type { CaughtPokemon } from './caught-record';
import { asCaughtPokemon } from './caught-record';

/**
 * The embedded row shape PostgREST returns for a catch, restored to
 * the record shape `asCaughtPokemon` has always read. The children
 * ride along in one request (`CAUGHT_EMBED`), so a box is one query
 * however many pokemon are in it.
 */

/** The select clause that brings a catch and its children together */
export const CAUGHT_EMBED =
  '*, caught_moves(slot, move, points), caught_abilities(slot, ability), ' +
  'caught_items(slot, item), caught_history(seq, owner, owner_name, ' +
  'acquired_at_local, acquired_at_offset, kind, paid, ball)';

/** An ISO local stamp with its offset re-attached */
function toStoredISO(local: unknown, offset: unknown): string {
  const minutes = typeof offset === 'number' ? offset : Number(offset ?? 0);
  const absolute = Math.abs(minutes);
  const hours = String(Math.floor(absolute / 60)).padStart(2, '0');
  const rest = String(absolute % 60).padStart(2, '0');
  const stamp = String(local ?? '').replace(/(\.\d+)?([+-]\d{2}:?\d{2}|Z)?$/, '');

  return `${stamp}${minutes < 0 ? '-' : '+'}${hours}:${rest}`;
}

type Child = Record<string, unknown>;

function bySlot(rows: unknown, key: string): Child[] {
  return asRecordArray(rows).sort(
    (left, right) => Number(left[key] ?? 0) - Number(right[key] ?? 0),
  );
}

/**
 * One embedded row as the legacy record shape, ready for
 * `asCaughtPokemon`
 */
export function fromCaughtRow(row: Record<string, unknown>): CaughtPokemon {
  const moves = bySlot(row.caught_moves, 'slot');
  const abilities = bySlot(row.caught_abilities, 'slot');
  const items = bySlot(row.caught_items, 'slot');
  const history = bySlot(row.caught_history, 'seq');
  const movePoints: Record<string, number> = {};

  for (const entry of moves) {
    const points = Number(entry.points ?? 0);

    if (points > 0) {
      movePoints[String(entry.move)] = points;
    }
  }

  return asCaughtPokemon({
    owner: row.owner ?? '',
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
    moves: moves.map((entry) => Number(entry.move)),
    movePoints,
    abilities: abilities.map((entry) => Number(entry.ability)),
    slots: row.slots,
    items: items.map((entry) => Number(entry.item)),
    history: history.map((entry) => ({
      owner: entry.owner ?? entry.owner_name ?? '',
      ...(entry.owner == null && entry.owner_name != null ? { name: entry.owner_name } : {}),
      acquiredAt: toStoredISO(entry.acquired_at_local, entry.acquired_at_offset),
      kind: entry.kind,
      paid: entry.paid,
      ball: entry.ball,
    })),
    lockedAt: row.locked_at,
    steps: row.steps,
    hatchSteps: row.hatch_steps,
    steppedAt: row.stepped_at,
    health: row.health,
    statuses: row.statuses,
    lair: row.lair,
    ball: row.ball,
    caughtAt: toStoredISO(row.caught_at_local, row.caught_at_offset),
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
  });
}
