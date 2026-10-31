import { type RefusalCode, type RefusalParams, readRefusal } from '../model/refusal';
import { m } from './paraglide/messages.js';

/** Each refusal's message. A switch may carry the staff's own words, which are shown as written */
const REFUSAL_MESSAGES: Record<RefusalCode, (params: RefusalParams) => string> = {
  'not-signed-in': () => m.refusal_not_signed_in(),
  banned: () => m.refusal_banned(),
  closed: (params) => params.message ?? m.refusal_closed(),
  maintenance: (params) => params.message ?? m.refusal_maintenance(),
  pace: () => m.refusal_pace(),
  'not-allowed': () => m.refusal_not_allowed(),
  invalid: (params) => m.refusal_invalid({ detail: params.detail ?? '' }),
  'friends-full': () => m.refusal_friends_full(),
  'friend-requests-closed': () => m.refusal_friend_requests_closed(),
  'nobody-answers': (params) => m.refusal_nobody_answers({ name: params.name ?? '' }),
  'not-walked': () => m.refusal_not_walked(),
  'too-many-chunks': () => m.refusal_too_many_chunks(),
  'list-comparison': () => m.refusal_list_comparison(),
  'confirm-password': () => m.refusal_confirm_password(),
  'gift-on-shelf': () => m.refusal_gift_on_shelf(),
  'not-yours': () => m.refusal_not_yours(),
  'new-version': () => m.refusal_new_version(),
  'safari-ended': () => m.refusal_safari_ended(),
};

/**
 * What to tell the player about something that failed, in their
 * language: a refusal's message, or the error's own words for anything
 * else
 */
export default function describeFailure(thrown: unknown): string {
  const refusal = readRefusal(thrown);

  if (refusal != null) {
    return REFUSAL_MESSAGES[refusal.code](refusal.params);
  }
  return thrown instanceof Error ? thrown.message : String(thrown);
}
