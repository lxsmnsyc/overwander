/**
 * A refusal the server (or the browser's own guard) answers with: a
 * code and its parameters, never a sentence. The browser turns it into
 * the player's language with `describeFailure` in `src/i18n/refusals.ts`.
 *
 * It crosses the server function boundary as a thrown `Error`, the one
 * thing that boundary carries for a failure, with the code and the
 * parameters written into its message as JSON behind a marker.
 */

/** Every refusal a player can be shown, each with a message in `src/i18n/messages` */
export const REFUSAL_CODES = [
  'not-signed-in',
  'banned',
  'closed',
  'maintenance',
  'pace',
  'not-allowed',
  'invalid',
  'friends-full',
  'friend-requests-closed',
  'nobody-answers',
  'not-walked',
  'too-many-chunks',
  'list-comparison',
  'confirm-password',
  'gift-on-shelf',
  'not-yours',
  'new-version',
  'safari-ended',
] as const;

export type RefusalCode = (typeof REFUSAL_CODES)[number];

export type RefusalParams = Readonly<Partial<Record<string, string>>>;

export interface Refusal {
  code: RefusalCode;
  params: RefusalParams;
}

const MARKER = 'refusal:';

/** The error to throw for a refusal */
export function refuse(code: RefusalCode, params: RefusalParams = {}): Error {
  return new Error(`${MARKER}${JSON.stringify({ code, params })}`);
}

function isRefusalCode(value: unknown): value is RefusalCode {
  for (const code of REFUSAL_CODES) {
    if (code === value) {
      return true;
    }
  }
  return false;
}

/** The refusal a thrown value carries, or null for any other failure */
export function readRefusal(thrown: unknown): Refusal | null {
  // Only an error whose message starts with the marker is one
  if (!(thrown instanceof Error) || !thrown.message.startsWith(MARKER)) {
    return null;
  }

  let said: unknown;

  try {
    said = JSON.parse(thrown.message.slice(MARKER.length));
  } catch {
    return null;
  }

  // A code this build does not know, from an older or newer server, is no refusal
  if (typeof said !== 'object' || said == null || !('code' in said) || !isRefusalCode(said.code)) {
    return null;
  }

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
