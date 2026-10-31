import type { DuelRefusal } from '../data/constants/duel-rules';
import { formatNumber } from './format';
import { m } from './paraglide/messages.js';

/** Why a pokemon cannot be fielded in a duel, in the player's language, or null for none */
export default function describeDuelRefusal(refusal: DuelRefusal | null): string | null {
  if (refusal == null) {
    return null;
  }
  if (refusal.kind === 'stat-total') {
    return m.duel_refusal_stat_total({ total: formatNumber(refusal.total) });
  }
  if (refusal.kind === 'form-item') {
    return m.duel_refusal_form_item();
  }
  return refusal.kind === 'legendary' ? m.duel_refusal_legendary() : m.duel_refusal_mythical();
}
