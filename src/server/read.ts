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

/**
 * The other direction: a bag of fields on its way into `update`.
 *
 * A helper that works out what a record should become — what purifying
 * leaves behind, what a lock writes — hands back one of these rather
 * than a `Record<string, unknown>`. The two say the same thing about
 * the keys, but only this one says the values are field values, which
 * is exactly what the admin SDK asks for at the call
 */
export type UpdateFields = FirebaseFirestore.UpdateData<FirebaseFirestore.DocumentData>;

export { asNumber, asNumberArray, asString, asStringArray };
