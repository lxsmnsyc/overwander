import type { PlayerIdentity } from '../../../auth/user';

/** The lobby the player is standing in, as the panel around it needs it */
export interface DuelLobbyReport {
  /** What the lobby is called, so the dialog's own heading can say it */
  title: string;
  /** Whether this player holds a seat, so the panel only closes by Leave */
  seated: boolean;
}

export interface DuelLobbyProps {
  user: PlayerIdentity;
  duelId: string;
  /**
   * The lobby, reported upwards once it has loaded, and null while it
   * loads and on the way out. Title and seat travel together
   */
  onLobby?: (lobby: DuelLobbyReport | null) => void;
}
