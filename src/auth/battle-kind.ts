import type { BattleRecord } from './battles';

/**
 * What kind of fight a battle was.
 *
 * It is derived from the record rather than stored on it, because the
 * record already says everything needed to tell them apart: a raid
 * names the lobby it was fought for, and a fight with more than one
 * player in it is players fighting each other. What is left is a
 * grunt, who owns no lobby and fields a party belonging to nobody.
 *
 * Deriving it also means every battle already written can be filtered
 * by it, which stamping a field on new records would not have given
 */
const enum BattleKind {
  Raid = 0,
  /**
   * A scripted trainer's fight: a Team Rocket grunt today, any battle
   * npc later. One player against a party belonging to nobody
   */
  Npc = 1,
  /**
   * Players against each other. Nothing fields one yet — the derivation
   * is here so the day something does, its battles sort themselves
   */
  Player = 2,
}

export const BATTLE_KIND_NAMES: Record<BattleKind, string> = {
  [BattleKind.Raid]: 'Raids',
  [BattleKind.Npc]: 'Trainers',
  [BattleKind.Player]: 'Players',
};

export function getBattleKind(record: BattleRecord): BattleKind {
  if (record.raid.length > 0) {
    return BattleKind.Raid;
  }
  return record.players.length > 1 ? BattleKind.Player : BattleKind.Npc;
}

export default BattleKind;
