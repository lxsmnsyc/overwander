import { setDevShinyBoost } from '../overworld/encounter/traits';
import { requireUid } from '../server/auth';
import check, { FLAG, TOKEN } from '../server/validate';
import getIdToken from './session';

/**
 * Switch the development run's boosted shiny odds on or off, here and
 * on the dev server, so both agree about what sparkles. Does nothing in
 * a build
 */
export default async function syncDevShinyBoost(on: boolean): Promise<void> {
  if (!import.meta.env.DEV) {
    return;
  }
  setDevShinyBoost(on);
  await syncOnServer(await getIdToken(), on);
}

async function syncOnServer(token: string, on: boolean): Promise<void> {
  'use server';
  check(TOKEN, token);
  check(FLAG, on);
  await requireUid(token);
  if (import.meta.env.DEV) {
    setDevShinyBoost(on);
  }
}
