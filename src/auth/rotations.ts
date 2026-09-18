import type { RotationReward } from '../data/quests/rotations';
import { requireUid } from '../server/auth';
import check, { COUNT, LOCALE, OFFSET, ROTATION_SCOPE, TOKEN } from '../server/validate';
import type { RotationBoard, RotationScope } from '../server/rotations';
import {
  claimRotation as claimOnServerSide,
  listRotations as listOnServerSide,
} from '../server/rotations';
import { syncServerClock } from './clock';
import { getLocalOffset, getLocale } from './local-time';
import getIdToken from './session';

/**
 * The rotating board, as both sides read it: the day's quests and
 * the week's hunt, with claims. Progress and paying are the server's
 * arithmetic end to end
 */

export type { RotationBoard, RotationScope, RotationStanding } from '../server/rotations';

export async function getRotations(): Promise<RotationBoard> {
  return listOnServer(await getIdToken());
}

async function listOnServer(token: string): Promise<RotationBoard> {
  'use server';
  check(TOKEN, token);
  return listOnServerSide(await requireUid(token), await syncServerClock());
}

/**
 * Take one rotating quest's rewards. Resolves what was paid, or null
 * when the slot is unmet or already claimed
 */
export async function claimRotation(
  scope: RotationScope,
  slot: number,
): Promise<RotationReward[] | null> {
  return claimOnServer(await getIdToken(), scope, slot, getLocalOffset(), getLocale());
}

async function claimOnServer(
  token: string,
  scope: RotationScope,
  slot: number,
  offset: number,
  locale: string,
): Promise<RotationReward[] | null> {
  'use server';
  check(TOKEN, token);
  check(ROTATION_SCOPE, scope);
  check(COUNT, slot);
  check(OFFSET, offset);
  check(LOCALE, locale);
  return claimOnServerSide(
    await requireUid(token),
    scope,
    slot,
    await syncServerClock(),
    offset,
    locale,
  );
}
