/**
 * Why a gift was given, as the game stores it. A gift the staff hand
 * out carries their own sentence, shown as written. One the game gives
 * by itself carries a code and its parameters instead, written into the
 * same column behind a marker, so the browser can say it in the
 * player's language (`describeGiftReason` in `src/i18n/gift-reasons.ts`).
 * Rows written before the codes keep their English sentence.
 */

export const GIFT_REASON_CODES = ['starter', 'starter-balls', 'quest', 'daily', 'hunt'] as const;

export type GiftReasonCode = (typeof GIFT_REASON_CODES)[number];

export interface GiftReason {
  code: GiftReasonCode;
  params: Readonly<Partial<Record<string, string>>>;
}

const MARKER = 'reason:';

/** The stored form of a reason the game writes */
export function writeGiftReason(
  code: GiftReasonCode,
  params: Readonly<Record<string, string>> = {},
): string {
  return `${MARKER}${JSON.stringify({ code, params })}`;
}

function isGiftReasonCode(value: unknown): value is GiftReasonCode {
  for (const code of GIFT_REASON_CODES) {
    if (code === value) {
      return true;
    }
  }
  return false;
}

/** The code a stored reason carries, or null for a sentence written by hand */
export function readGiftReason(stored: string): GiftReason | null {
  if (!stored.startsWith(MARKER)) {
    return null;
  }

  let said: unknown;

  try {
    said = JSON.parse(stored.slice(MARKER.length));
  } catch {
    return null;
  }
  if (
    typeof said !== 'object' ||
    said == null ||
    !('code' in said) ||
    !isGiftReasonCode(said.code)
  ) {
    return null;
  }

  // Only string parameters are kept: a stored row can hold anything
  const params: Record<string, string> = {};

  if ('params' in said && typeof said.params === 'object' && said.params != null) {
    for (const [key, value] of Object.entries(said.params)) {
      if (typeof value === 'string') {
        params[key] = value;
      }
    }
  }
  return { code: said.code, params };
}
