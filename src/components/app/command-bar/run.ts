import {
  BAN,
  GIFT_CATCH,
  GIFT_ENCOUNTER,
  GIFT_ITEM,
  LOCATE,
  TELEPORT,
  UNBAN,
  VIEW,
} from './commands';
import type { CommandArguments } from '../../../core/command';
import { GiftKind } from '../../../auth/gift-record';
import type { Origin } from './locate';
import type { PositionRecord } from '../../../auth/position-record';
import locate, { LOCATE_RADIUS, readLocate } from './locate';
import namePlace from '../../../overworld/place';
import parseCommand from '../../../core/command';
import readGift from './gift';
import readPlayer from './player';
import readTeleport from './teleport';
import teleport, { banPlayer, findPlayer, giveCommandGift } from '../../../auth/commands';
import { getLocalOffset, toLocalTime } from '../../../auth/local-time';
import { serverNow } from '../../../auth/clock';

/**
 * Running what was typed, and saying what happened.
 *
 * The bar reports in one line either way, so a refusal and a success
 * come back through the same shape and the bar has nothing to decide
 */

/** Whether the bar is answering or refusing */
export type CommandTone = 'answer' | 'refusal';

export interface CommandResult {
  tone: CommandTone;
  /**
   * The whole of what the bar prints, in one line. It stands under
   * the box rather than being announced and taken away, so it says
   * what happened on its own rather than under a heading
   */
  message: string;
  /**
   * A player whose profile the bar should open. The bar shows the
   * profile instead of a toast: `/view` is a command whose whole
   * answer is the screen it opens
   */
  viewing?: string;
  /**
   * Where a teleport left somebody. The bar stands its own screen
   * there when it was the caller who moved: the row arriving from the
   * server otherwise reads as a second screen walking off with the
   * player, and this one fences itself off rather than moving
   */
  moved?: PositionRecord;
}

/** Where the caller is standing, which is what `/locate` counts from */
export interface CommandContext {
  origin: Origin;
}

function refused(message: string): CommandResult {
  return { tone: 'refusal', message };
}

function done(message: string): CommandResult {
  return { tone: 'answer', message };
}

/** What went wrong, in the server's own words where it said any */
function wrong(error: unknown): CommandResult {
  return refused(error instanceof Error ? error.message : 'It did not go through.');
}

async function runTeleport(parameters: CommandArguments): Promise<CommandResult> {
  const asked = readTeleport(parameters);

  if (!asked.ok) {
    return refused(asked.reason);
  }

  try {
    const landed = await teleport(asked.value.player, asked.value.wanted);

    return {
      ...done(
        `${landed.nickname} is in ${namePlace(landed.chunkX, landed.chunkY)}, ` +
          `cell ${landed.cellX}, ${landed.cellY}.`,
      ),
      moved: landed,
    };
  } catch (error) {
    return wrong(error);
  }
}

/** `/locate` asks nobody: the world is derived on both sides alike */
function runLocate(parameters: CommandArguments, context: CommandContext): CommandResult {
  const asked = readLocate(parameters);

  if (!asked.ok) {
    return refused(asked.reason);
  }
  // On the player's own clock, not the server's: the sky a chunk is
  // under is read in the observer's zone, so a window counted in UTC
  // would be somebody else's hour
  const found = locate(asked.value, context.origin, toLocalTime(serverNow(), getLocalOffset()));

  return found == null ? refused(`Nothing like that within ${LOCATE_RADIUS} chunks.`) : done(found);
}

async function runGift(kind: GiftKind, parameters: CommandArguments): Promise<CommandResult> {
  const asked = readGift(kind, parameters);

  if (!asked.ok) {
    return refused(asked.reason);
  }

  try {
    const taker = await giveCommandGift(asked.value.to, asked.value.gift);

    return done(taker == null ? 'It is on every shelf.' : `It is on ${taker.nickname}'s shelf.`);
  } catch (error) {
    return wrong(error);
  }
}

async function runBan(parameters: CommandArguments, banned: boolean): Promise<CommandResult> {
  const asked = readPlayer(parameters);

  if (!asked.ok) {
    return refused(asked.reason);
  }

  try {
    const player = await banPlayer(asked.value.player, banned, asked.value.reason);

    return done(banned ? `${player.nickname} is shut out.` : `${player.nickname} is back in.`);
  } catch (error) {
    return wrong(error);
  }
}

async function runView(parameters: CommandArguments): Promise<CommandResult> {
  const asked = readPlayer(parameters);

  if (!asked.ok) {
    return refused(asked.reason);
  }

  try {
    const found = await findPlayer(asked.value.player);

    return { ...done(found.nickname), viewing: found.player };
  } catch (error) {
    return wrong(error);
  }
}

/**
 * Run a typed line. Answers the line to print back, which is a
 * refusal for anything the bar could not make sense of
 */
export default async function runCommand(
  line: string,
  context: CommandContext,
): Promise<CommandResult> {
  const asked = parseCommand(line);

  if (asked == null) {
    return refused('Start with the name of a command.');
  }
  switch (asked.name) {
    case TELEPORT:
      return runTeleport(asked.parameters);
    case LOCATE:
      return runLocate(asked.parameters, context);
    case GIFT_ITEM:
      return runGift(GiftKind.Item, asked.parameters);
    case GIFT_CATCH:
      return runGift(GiftKind.Catch, asked.parameters);
    case GIFT_ENCOUNTER:
      return runGift(GiftKind.Encounter, asked.parameters);
    case BAN:
      return runBan(asked.parameters, true);
    case UNBAN:
      return runBan(asked.parameters, false);
    case VIEW:
      return runView(asked.parameters);
    default:
      return refused(`There is no ${asked.name} command.`);
  }
}
