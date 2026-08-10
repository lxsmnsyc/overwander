import type { User } from 'firebase/auth';
import getFirebaseAuth from './firebase';

/**
 * The signed-in player's Firebase ID token, which is what a
 * privileged server function trusts. Everything that mints or moves
 * value goes through one of those, and the token is how the server
 * knows who is asking — the uid a client passes alongside it is never
 * taken at face value.
 *
 * Throws when nobody is signed in: a write with no caller has no
 * owner, and silently doing nothing would look like it worked
 */
export default async function getIdToken(user?: User): Promise<string> {
  const signedIn = user ?? getFirebaseAuth().currentUser;

  if (signedIn == null) {
    throw new Error('Not signed in');
  }
  return signedIn.getIdToken();
}
