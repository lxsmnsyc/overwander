import useSkillBookOnServerSide from '../server/skill-book';
import { requireUid } from '../server/auth';
import check, { ID, TOKEN } from '../server/validate';
import getIdToken from './session';

/**
 * Use a Skill Book from the bag on one of the player's catches.
 * Resolves the move slots it now has, or null when it could not be used
 */
export default async function useSkillBook(catchId: string): Promise<number | null> {
  return useSkillBookOnServer(await getIdToken(), catchId);
}

async function useSkillBookOnServer(token: string, catchId: string): Promise<number | null> {
  'use server';
  check(TOKEN, token);
  check(ID, catchId);
  return useSkillBookOnServerSide(await requireUid(token), catchId);
}
