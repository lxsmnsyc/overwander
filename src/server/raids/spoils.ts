import 'server-only';
import { RaidKind } from '../../auth/raid-record';
import { EncounterType } from '../../overworld/encounter';
import {
  LEGENDARY_RAID_GOLD,
  LEGENDARY_RAID_REWARD_LEVEL,
  MYTHICAL_RAID_GOLD,
  MYTHICAL_RAID_REWARD_LEVEL,
  SHADOW_RAID_GOLD,
  SHADOW_RAID_REWARD_LEVEL,
} from '../../overworld/raid';

/** What each kind of lobby pays out, and at what level */
/**
 * What each kind of lobby pays, hands over, and records itself as
 */
export const RAID_GOLD: Record<RaidKind, number> = {
  [RaidKind.Legendary]: LEGENDARY_RAID_GOLD,
  [RaidKind.Shadow]: SHADOW_RAID_GOLD,
  [RaidKind.Mythical]: MYTHICAL_RAID_GOLD,
};

export const RAID_REWARD_LEVELS: Record<RaidKind, number> = {
  [RaidKind.Legendary]: LEGENDARY_RAID_REWARD_LEVEL,
  [RaidKind.Shadow]: SHADOW_RAID_REWARD_LEVEL,
  [RaidKind.Mythical]: MYTHICAL_RAID_REWARD_LEVEL,
};

export const RAID_ENCOUNTER_TYPES: Record<RaidKind, EncounterType> = {
  [RaidKind.Legendary]: EncounterType.LegendaryRaid,
  [RaidKind.Shadow]: EncounterType.ShadowRaid,
  [RaidKind.Mythical]: EncounterType.MythicalRaid,
};
