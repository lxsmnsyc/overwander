import { getQuestData } from '../data/quests';
import { type GiftReason, type GiftReasonCode, readGiftReason } from '../model/gift-reason';
import { m } from './paraglide/messages.js';

function readQuestName(id: string | undefined): string {
  // A written quest is named in the reader's language; one since removed by its number
  return getQuestData(Number(id))?.name ?? `#${id ?? ''}`;
}

/** Each code's message */
const GIFT_REASON_MESSAGES: Record<GiftReasonCode, (params: GiftReason['params']) => string> = {
  starter: () => m.gift_reason_starter(),
  'starter-balls': () => m.gift_reason_starter_balls(),
  quest: (params) => m.gift_reason_quest({ name: readQuestName(params.quest) }),
  daily: (params) => m.gift_reason_daily({ name: params.name ?? '' }),
  hunt: (params) => m.gift_reason_hunt({ name: params.name ?? '' }),
};

/** Why a gift was given, in the player's language, or the staff's sentence as written */
export default function describeGiftReason(stored: string): string {
  const reason = readGiftReason(stored);

  return reason == null ? stored : GIFT_REASON_MESSAGES[reason.code](reason.params);
}
