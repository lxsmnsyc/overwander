import type { Session } from '@supabase/supabase-js';

/**
 * The signed-in player as the interface reads one. It is this shape
 * rather than the SDK's `User` so the seven screens that show a name
 * or an avatar never depend on which auth platform is behind it
 */
export interface PlayerIdentity {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

/**
 * The identity a session carries. OAuth providers put the name and
 * picture in the user metadata; an email account has neither
 */
export function asPlayerIdentity(session: Session | null): PlayerIdentity | null {
  const user = session?.user;

  if (user == null) {
    return null;
  }

  const meta = user.user_metadata as Record<string, unknown>;
  const name = typeof meta.full_name === 'string' ? meta.full_name : null;
  const photo = typeof meta.avatar_url === 'string' ? meta.avatar_url : null;

  return {
    uid: user.id,
    email: user.email ?? null,
    displayName: name === '' ? null : name,
    photoURL: photo === '' ? null : photo,
  };
}
