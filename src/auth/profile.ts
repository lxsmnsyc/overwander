import claimDevAdmin from './roles';
import getSupabase, { type Unwatch, watchRow } from './supabase';
import type { PlayerIdentity } from './user';

/**
 * The minimal personal details a player can set, plus their gold
 * balance. Stored per user in `profiles`; row-level security
 * restricts writes to the owning uid, and to the three fields that
 * are theirs to set
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
   * roles can grow without a migration. Nothing a browser sends may
   * name it: the grants let a player write only their nickname,
   * avatar and buddy. A role is granted out of band, the way gold is
   */
  role: string;
  /**
   * Whether the account is shut out of the game.
   *
   * A banned account can still sign in and read (there is nothing to
   * gain by hiding what has happened to it) and can do nothing else:
   * every privileged call refuses it before it reads a thing. Like
   * the role, it is written by the server alone
   */
  banned: boolean;
  /**
   * Why, in a sentence, for the player to read on the way in. Empty
   * for an account nobody has banned, and for one banned without a
   * word said
   */
  banReason: string;
  /**
   * The catch walking at the player's side, or an empty string when
   * they walk alone. A column of the profile because it is read on
   * nearly every overworld action
   */
  buddy: string;
}

const PROFILE_TABLE = 'profiles';

const PROFILE_COLUMNS = 'nickname, avatar, gold, role, banned, ban_reason, buddy_id';

/**
 * The store hands back untyped rows; normalize the fields instead of
 * blindly asserting the shape
 */
function asProfile(data: Record<string, unknown>): Profile {
  return {
    nickname: typeof data.nickname === 'string' ? data.nickname : 'Trainer',
    avatar: typeof data.avatar === 'string' ? data.avatar : null,
    gold: typeof data.gold === 'number' ? data.gold : Number(data.gold ?? 0),
    buddy: typeof data.buddy_id === 'string' ? data.buddy_id : '',
    // Everybody is a player until somebody says otherwise, so a
    // record without the field is one
    role: typeof data.role === 'string' ? data.role : '',
    // Everybody is welcome until somebody says otherwise
    banned: data.banned === true,
    banReason: typeof data.ban_reason === 'string' ? data.ban_reason : '',
  };
}

export async function getProfile(uid: string): Promise<Profile | null> {
  const { data } = await getSupabase()
    .from(PROFILE_TABLE)
    .select(PROFILE_COLUMNS)
    .eq('id', uid)
    .maybeSingle();

  return data == null ? null : asProfile(data);
}

/**
 * Several profiles in one read, for a screen naming a roomful of
 * players: a lobby, a history, a summary. A uid nobody answers to is
 * simply absent from the map
 */
export async function getProfiles(uids: string[]): Promise<Map<string, Profile>> {
  const found = new Map<string, Profile>();
  const wanted = [...new Set(uids)].filter(Boolean);

  if (wanted.length === 0) {
    return found;
  }

  const { data } = await getSupabase()
    .from(PROFILE_TABLE)
    .select(`id, ${PROFILE_COLUMNS}`)
    .in('id', wanted);

  for (const row of data ?? []) {
    found.set(String((row as Record<string, unknown>).id), asProfile(row));
  }
  return found;
}

/**
 * Follow the profile as it changes. Gold moves whenever the player
 * earns or spends, and the balance should not wait for a reload
 */
export function watchProfile(uid: string, onChange: (profile: Profile | null) => void): Unwatch {
  return watchRow(PROFILE_TABLE, `id=eq.${uid}`, async () => getProfile(uid), onChange);
}

/**
 * The fields a player edits themselves; the balance is off limits
 * here and only moves through grantGold and spendGold
 */
export type ProfileDetails = Pick<Profile, 'nickname' | 'avatar'>;

export async function saveProfile(uid: string, details: ProfileDetails): Promise<void> {
  const { error } = await getSupabase()
    .from(PROFILE_TABLE)
    .update({ nickname: details.nickname, avatar: details.avatar })
    .eq('id', uid);

  if (error != null) {
    throw new Error(error.message);
  }
}

/**
 * Point the profile's buddy at a catch, or clear it with an empty
 * string. It is written apart from the other details because it is
 * set from the catch sheet rather than from the profile form; see
 * [`src/auth/buddy.ts`](./buddy.ts) for what the field means
 */
export async function setBuddyField(uid: string, catchId: string): Promise<void> {
  const { error } = await getSupabase()
    .from(PROFILE_TABLE)
    .update({ buddy_id: catchId === '' ? null : catchId })
    .eq('id', uid);

  if (error != null) {
    throw new Error(error.message);
  }
}

/**
 * The profile as a fresh account would have it, for the screens that
 * draw one before the row lands
 */
export function deriveProfileDefaults(user: PlayerIdentity): Profile {
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
 * The user's profile. The row itself is created by a database trigger
 * the moment the account is, so what is left to this call is the
 * cosmetics: seed the display name and avatar from whatever the auth
 * method already knows, once, and hand a development build its keys
 */
export async function ensureProfile(user: PlayerIdentity): Promise<Profile> {
  const existing = await getProfile(user.uid);
  const defaults = deriveProfileDefaults(user);

  // The trigger writes 'Trainer' when the provider offered no name;
  // a provider that did offer one fills it in on first sight
  if (existing != null) {
    if (existing.nickname === 'Trainer' && defaults.nickname !== 'Trainer') {
      await saveProfile(user.uid, { nickname: defaults.nickname, avatar: defaults.avatar });
      return { ...existing, nickname: defaults.nickname, avatar: defaults.avatar };
    }
    return existing;
  }

  // The trigger has not landed yet (a fresh sign-up racing its own
  // first page): behave as though it had
  if (import.meta.env.DEV) {
    try {
      return { ...defaults, role: await claimDevAdmin() };
    } catch {
      return defaults;
    }
  }
  return defaults;
}
