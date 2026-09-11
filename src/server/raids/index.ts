import 'server-only';

/**
 * A raid, in the order it is lived: the lobby, the invites, the teams
 * that join, the snapshot each brings, the fight, and what is left
 * afterwards
 */

export { RAID_BATTLE_TIMEOUT } from './outcome';
export {
  enterRaid,
  hostMythicalRaid,
  leaveRaid,
  peekRaid,
  unwatchRaidLobby,
  watchRaidLobby,
} from './lobby';
export { declineRaidInvite, inviteToRaid } from './invites';
export { isAnyCatchQueued, joinRaid } from './join';
export { publishTeamSnapshot, readPublishedSpecies } from './snapshot';
export { clearRaid, finishBattle, startRaid } from './battle';
export { claimRaidReward } from './reward';
export type { RaidReward } from './reward';
