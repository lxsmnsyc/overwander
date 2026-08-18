/**
 * What an account is beyond a player, and what each of those may do.
 *
 * The names are shared by both sides: the server grants them and
 * enforces them, and the dashboard hides what an account cannot use.
 * The file lives apart from either so neither has to import the other.
 *
 * There are four, and they are a ladder rather than a set of flags —
 * every rung may do what the rung below it may, plus its own. What
 * separates them is who they may act **on**: nobody may touch an
 * account standing at their own height or above it, which is what
 * stops staff from turning on each other.
 */

export const MODERATOR_ROLE = 'moderator';
export const ADMIN_ROLE = 'admin';
export const OWNER_ROLE = 'owner';

/** Every role there is, lowest first. An empty string is a player */
export const ROLES = ['', MODERATOR_ROLE, ADMIN_ROLE, OWNER_ROLE] as const;

export type Role = (typeof ROLES)[number];

/**
 * How high a role stands. An unknown one — a role written by a later
 * version, or a typo in the console — stands at the bottom rather
 * than being trusted for something nobody recognises
 */
export function rankOf(role: string): number {
  const at = ROLES.findIndex((known) => known === role);

  return at < 0 ? 0 : at;
}

/** What each is called where somebody reads it */
export const ROLE_NAMES: Record<Role, string> = {
  '': 'Player',
  [MODERATOR_ROLE]: 'Moderator',
  [ADMIN_ROLE]: 'Admin',
  [OWNER_ROLE]: 'Owner',
};

/**
 * Whether the role opens the dashboard at all. It decides what is
 * *offered* and nothing more — every action behind the screen is
 * checked again on the server, since a browser can claim anything
 */
export default function isStaff(role: string): boolean {
  return rankOf(role) >= rankOf(MODERATOR_ROLE);
}

/**
 * Whether the role runs the game itself: the mystery gifts, the raids
 * and the auction board. A moderator keeps order among players and has
 * no business handing out legendaries
 */
export function runsTheGame(role: string): boolean {
  return rankOf(role) >= rankOf(ADMIN_ROLE);
}

/**
 * Whether one account may act on another at all — banning it, or
 * changing what it is.
 *
 * Strictly below: an admin may not ban an admin, a moderator may not
 * ban a moderator, and nobody may act on the owner. Acting on
 * yourself is refused for the same reason it is refused everywhere
 * else here — an account that could take its own authority away would
 * be one nobody can give it back to
 */
export function canActOn(actor: string, target: string): boolean {
  return rankOf(actor) > rankOf(target);
}

/**
 * Whether this account may ban at all. It is the lowest staff power,
 * and it is the whole of what a moderator is for
 */
export function canBan(role: string): boolean {
  return isStaff(role);
}

/**
 * The roles this account may hand out.
 *
 * An owner makes moderators and admins; an admin makes moderators, and
 * takes a role back off. Nobody grants the owner's role from a screen:
 * there is one, and it is granted where the project is deployed rather
 * than from inside the game
 */
export function grantableRoles(actor: string): Role[] {
  if (rankOf(actor) >= rankOf(OWNER_ROLE)) {
    return ['', MODERATOR_ROLE, ADMIN_ROLE];
  }
  if (rankOf(actor) >= rankOf(ADMIN_ROLE)) {
    return ['', MODERATOR_ROLE];
  }
  return [];
}

/**
 * Whether the actor may put this exact role on this exact account:
 * the role has to be one they may hand out, and the account has to be
 * one they may act on — including where it already stands, so an admin
 * cannot demote another admin by handing them a role they *can* grant
 */
export function canAssign(actor: string, target: string, wanted: string): boolean {
  return canActOn(actor, target) && grantableRoles(actor).some((role) => role === wanted);
}
