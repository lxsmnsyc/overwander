import type { User } from 'firebase/auth';
import {
  type DocumentReference,
  type FirestoreDataConverter,
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import { getFirebaseFirestore } from './firebase';

/**
 * The minimal personal details a player can set. Stored per user at
 * profiles/{uid}; Firestore security rules must restrict writes to
 * the owning uid
 */
export interface Profile {
  /**
   * Display name shown to other players
   */
  nickname: string;
  /**
   * Avatar image URL; null when unset
   */
  avatar: string | null;
}

const PROFILE_COLLECTION = 'profiles';

const converter: FirestoreDataConverter<Profile> = {
  toFirestore: (profile) => profile,
  fromFirestore: (snapshot) => {
    // Firestore hands back untyped data; normalize the fields
    // instead of blindly asserting the document shape
    const data = snapshot.data();

    return {
      nickname: typeof data.nickname === 'string' ? data.nickname : 'Trainer',
      avatar: typeof data.avatar === 'string' ? data.avatar : null,
    };
  },
};

function getProfileRef(uid: string): DocumentReference<Profile> {
  return doc(getFirebaseFirestore(), PROFILE_COLLECTION, uid).withConverter(converter);
}

export async function getProfile(uid: string): Promise<Profile | null> {
  const snapshot = await getDoc(getProfileRef(uid));

  return snapshot.data() ?? null;
}

export async function saveProfile(uid: string, profile: Profile): Promise<void> {
  return setDoc(getProfileRef(uid), profile, { merge: true });
}

/**
 * Seed details from whatever the auth method already knows: Google
 * sign-in carries a display name and photo, email accounts fall
 * back to the address' local part
 */
export function deriveProfileDefaults(user: User): Profile {
  return {
    nickname: user.displayName ?? user.email?.split('@')[0] ?? 'Trainer',
    avatar: user.photoURL,
  };
}

/**
 * The user's profile, created from the auth method's details on
 * first sight
 */
export async function ensureProfile(user: User): Promise<Profile> {
  const existing = await getProfile(user.uid);

  if (existing != null) {
    return existing;
  }

  const defaults = deriveProfileDefaults(user);

  await saveProfile(user.uid, defaults);
  return defaults;
}
