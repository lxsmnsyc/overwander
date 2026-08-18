import { requireUid } from '../server/firebase';
import { grantDevAdmin } from '../server/roles';
import getIdToken from './session';

/**
 * Ask for the role a development build hands out. It is the server
 * that decides whether this is one, since a browser saying it is
 * developing is a browser granting itself authority
 */
export default async function claimDevAdmin(): Promise<string> {
  return grantOnServer(await getIdToken());
}

async function grantOnServer(token: string): Promise<string> {
  'use server';
  return grantDevAdmin(await requireUid(token));
}
