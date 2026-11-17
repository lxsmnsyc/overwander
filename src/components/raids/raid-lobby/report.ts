import type { PlayerIdentity } from '../../../auth/user';

/** The lobby the player is standing in, as the panel around it needs it */
export interface RaidLobbyReport {
  /**
   * What the lobby is called. The name belongs at the top of the panel
   * the lobby fills, which is the dialog's own heading rather than
   * anything this can draw
   */
  title: string;
  /**
   * Whether the player is hosting it: a host's lobby is not dismissed
   * by a stray press on the overlay
   */
  hosting: boolean;
}

export interface RaidLobbyProps {
  user: PlayerIdentity;
  raidId: string;
  /**
   * The lobby, reported upwards as soon as it is known, and null while
   * it loads and on the way out. Title and hold travel together, so the
   * panel never holds for a lobby it no longer names
   */
  onLobby?: (lobby: RaidLobbyReport | null) => void;
}
