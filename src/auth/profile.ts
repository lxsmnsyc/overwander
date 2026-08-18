import type { User } from 'firebase/auth';
import {
  type DocumentReference,
  type FirestoreDataConverter,
  type Unsubscribe,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
} from 'firebase/firestore';
import { getFirebaseFirestore } from './firebase';
import claimDevAdmin from './roles';

/**
 * The minimal personal details a player can set, plus their gold
 * balance. Stored per user at profiles/{uid}; Firestore security
 * rules must restrict writes to the owning uid
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
  /**
   * The in-game currency balance
   */
  gold: number;
  /**
   * What this account is, beyond a player: an empty string for
   * everybody who signs up, and whatever the game comes to call its
   * staff for the few who are not.
   *
   * It is a **string** rather than a flag or an enum so the set of
   * roles can grow without a migration — a record written today reads
   * back the same however many roles exist tomorrow.
   *
   * Nothing a browser sends may name it: the rules let a player write
   * only their nickname, avatar and buddy, and refuse a first write
   * that names a role at all. A role is granted out of band, the way
   * gold is
   */
  role: string;
  /**
   * Whether the account is shut out of the game.
   *
   * A banned account can still sign in and read — there is nothing to
   * gain by hiding what has happened to it — and can do nothing else:
   * every privileged call refuses it before it reads a thing. Like the
   * role, it is written by the server alone
   */
  banned: boolean;
  /**
   * Why, in a sentence, for the player to read on the way in. Empty
   * for an account nobody has banned, and for one banned without a
   * word said
   */
  banReason: string;
  /**
   * The `caught/{catchId}` walking at the player's side, or an empty
   * string when they walk alone.
   *
   * It was a store of its own — `buddies/{uid}`, one document holding
   * one string — and it is a field because it is read on nearly every
   * overworld action: every encounter derivation, every catch, every
   * step report asks who is walking beside the player. A field costs
   * the read the profile was already making
   */
  buddy: string;
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
      gold: typeof data.gold === 'number' ? data.gold : 0,
      buddy: typeof data.buddy === 'string' ? data.buddy : '',
      // Everybody is a player until somebody says otherwise, so a
      // record without the field is one
      role: typeof data.role === 'string' ? data.role : '',
      // Everybody is welcome until somebody says otherwise
      banned: data.banned === true,
      banReason: typeof data.banReason === 'string' ? data.banReason : '',
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

/**
 * Follow the profile as it changes. Gold moves whenever the player
 * earns or spends, and the balance should not wait for a reload
 */
export function watchProfile(
  uid: string,
  onChange: (profile: Profile | null) => void,
): Unsubscribe {
  return onSnapshot(getProfileRef(uid), (snapshot) => {
    onChange(snapshot.data() ?? null);
  });
}

/**
 * The fields a player edits themselves; the balance is off limits
 * here and only moves through grantGold and spendGold
 */
export type ProfileDetails = Pick<Profile, 'nickname' | 'avatar'>;

export async function saveProfile(uid: string, details: ProfileDetails): Promise<void> {
  return setDoc(getProfileRef(uid), details, { merge: true });
}

/**
 * Point the profile's buddy at a catch, or clear it with an empty
 * string. It is written apart from the other details because it is
 * set from the catch sheet rather than from the profile form — see
 * [`src/auth/buddy.ts`](./buddy.ts) for what the field means
 */
export async function setBuddyField(uid: string, catchId: string): Promise<void> {
  return setDoc(getProfileRef(uid), { buddy: catchId }, { merge: true });
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
    gold: 0,
    buddy: '',
    // An account opens as a player, and welcome, whatever it may be
    // made later
    role: '',
    banned: false,
    banReason: '',
  };
}

/**
 * The balance is currency, so it never moves from a browser: gold is
 * granted and spent by the server in
 * [`src/server/profile.ts`](../server/profile.ts), and the rules let
 * a player write only their own nickname, avatar and buddy. The role
 * is the same kind of field for the same reason — an account that
 * could name what it is would be granting itself whatever a role ever
 * comes to allow
 */

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

  // The whole document, balance included: saveProfile deliberately
  // cannot write gold
  await setDoc(getProfileRef(user.uid), defaults);

  // A development build opens every account as staff, which is a
  // thing only the server can do — the rules refuse a browser that
  // names its own role. It is asked for after the profile exists so
  // the grant has a document to merge into, and a refusal is nothing
  // to stop a sign-up over
  if (import.meta.env.DEV) {
    try {
      return { ...defaults, role: await claimDevAdmin() };
    } catch {
      return defaults;
    }
  }
  return defaults;
}
