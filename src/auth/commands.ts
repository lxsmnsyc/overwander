import type { StaffGift } from '../server/gifts';
import type { TeleportOutcome, TeleportWanted } from '../server/teleport';
import findPlayerOnServerSide, { nameOf } from '../server/players';
import { giveGift } from '../server/gifts';
import { requireAdmin, setBan } from '../server/roles';
import { syncServerClock } from './clock';
import teleportOnServerSide from '../server/teleport';
import getIdToken from './session';

/**
 * What the command bar asks the server for.
 *
 * Every call here goes through `requireAdmin`, which reads the
 * caller's own profile: the bar is hidden from a player, and these
 * are what would happen if somebody called them anyway.
 *
 * Each one takes the player as it was typed rather than as a uid. The
 * bar has a nickname, an address or a friend code and no way to turn
 * any of them into an account, which is the server's job anyway
 */

/** A trainer a command found, for the line it prints back */
export interface FoundTrainer {
  player: string;
  nickname: string;
}

/**
 * A gift as the bar describes it, before anybody is resolved.
 *
 * Distributed over the union rather than omitted from it: an `Omit`
 * of a union keeps only the fields every member shares, which would
 * quietly drop everything that tells an item gift from a pokemon
 */
export type CommandGift = StaffGift extends infer Kind
  ? Kind extends StaffGift
    ? Omit<Kind, 'player'>
    : never
  : never;

/**
 * Put a player somewhere, and answer where they landed. Rejects with
 * the reason where the player or the destination is nobody
 */
export default async function teleport(
  player: string,
  wanted: TeleportWanted,
): Promise<TeleportOutcome> {
  return teleportOnServer(await getIdToken(), player, wanted);
}

async function teleportOnServer(
  token: string,
  player: string,
  wanted: TeleportWanted,
): Promise<TeleportOutcome> {
  'use server';
  return teleportOnServerSide(await requireAdmin(token), player, wanted, await syncServerClock());
}

/**
 * Which account a typed name means, and what they are called. Rejects
 * where it names nobody, or more than one trainer
 */
export async function findPlayer(named: string): Promise<FoundTrainer> {
  return findOnServer(await getIdToken(), named);
}

async function findOnServer(token: string, named: string): Promise<FoundTrainer> {
  'use server';

  const caller = await requireAdmin(token);
  const player = await findPlayerOnServerSide(caller, named);

  if (player == null) {
    throw new Error(`Nobody answers to ${named}.`);
  }
  return { player, nickname: await nameOf(player) };
}

/**
 * Put a gift on one player's shelf, or on everybody's when `to` is
 * null. Answers who it went to, so the bar can name them
 */
export async function giveCommandGift(
  to: string | null,
  gift: CommandGift,
): Promise<FoundTrainer | null> {
  return giftOnServer(await getIdToken(), to, gift);
}

async function giftOnServer(
  token: string,
  to: string | null,
  gift: CommandGift,
): Promise<FoundTrainer | null> {
  'use server';

  const caller = await requireAdmin(token);
  const player = to == null ? null : await findPlayerOnServerSide(caller, to);

  if (to != null && player == null) {
    throw new Error(`Nobody answers to ${to}.`);
  }
  const written = await giveGift({ ...gift, player }, await syncServerClock());

  if (!written) {
    throw new Error('That gift is already on the shelf.');
  }
  return player == null ? null : { player, nickname: await nameOf(player) };
}

/**
 * Shut a player out of the game, or let them back in. Rejects where
 * the account stands at the caller's own height or above it, which is
 * what the ladder refuses rather than the bar
 */
export async function banPlayer(
  named: string,
  banned: boolean,
  reason: string,
): Promise<FoundTrainer> {
  return banOnServer(await getIdToken(), named, banned, reason);
}

async function banOnServer(
  token: string,
  named: string,
  banned: boolean,
  reason: string,
): Promise<FoundTrainer> {
  'use server';

  const caller = await requireAdmin(token);
  const player = await findPlayerOnServerSide(caller, named);

  if (player == null) {
    throw new Error(`Nobody answers to ${named}.`);
  }
  if ((await setBan(caller, player, banned, reason)) == null) {
    throw new Error('That account is not yours to act on.');
  }
  return { player, nickname: await nameOf(player) };
}
