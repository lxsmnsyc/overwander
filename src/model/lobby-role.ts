/**
 * What somebody is in a lobby for. A raid lobby and a battle lobby
 * both hold people who came to fight and people who came to look, and
 * an invitation to either says which
 */
export const enum LobbyRole {
  /**
   * Here with a party. In a raid that is a team among many; in a duel
   * it is one of the two seats
   */
  Fighter = 0,
  /**
   * Here to watch. A watcher settles nothing and is owed nothing --
   * the host of a duel counts as one when they staged the fight for
   * other people
   */
  Spectator = 1,
}

export const LOBBY_ROLE_NAMES: Record<LobbyRole, string> = {
  [LobbyRole.Fighter]: 'Fighter',
  [LobbyRole.Spectator]: 'Spectator',
};
