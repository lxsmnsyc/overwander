import 'server-only';
import { asNumber, asNumberArray, asRecord, asString, asStringArray } from '../auth/__normalize';

/**
 * The admin SDK hands back untyped documents, the same way the web
 * SDK does. Everything the server reads goes through here so a
 * missing or malformed field becomes a zero, an empty string or an
 * empty list rather than an `any` travelling into game logic
 */
export function docData(
  snapshot: FirebaseFirestore.DocumentSnapshot,
): Record<string, unknown> | null {
  const data: unknown = snapshot.data();

  return data == null ? null : asRecord(data);
}

export { asNumber, asNumberArray, asString, asStringArray };
