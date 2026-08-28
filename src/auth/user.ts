import type { Session } from '@supabase/supabase-js';

/**
 * The signed-in player as the interface reads one. It is this shape
 * rather than the SDK's `User` so the screens that show a name never
 * depend on which auth platform is behind it
 */
export interface PlayerIdentity {
  uid: string;
  email: string | null;
  displayName: string | null;
}

/**
 * The identity a session carries. OAuth providers put the name in the
 * user metadata; an email account has none. The provider's picture is
 * not read: a trainer is seen as an overworld character they earned,
 * not as whatever their sign-in happens to carry
 */
export function asPlayerIdentity(session: Session | null): PlayerIdentity | null {
  const user = session?.user;

  if (user == null) {
    return null;
  }

  const meta = user.user_metadata as Record<string, unknown>;
  const name = typeof meta.full_name === 'string' ? meta.full_name : null;

  return {
    uid: user.id,
    email: user.email ?? null,
    displayName: name === '' ? null : name,
  };
}
