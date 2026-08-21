import 'server-only';
import {
  asNumber,
  asNumberArray,
  asRecord,
  asRecordArray,
  asString,
  asStringArray,
} from '../auth/__normalize';

/**
 * The store hands back untyped rows. Everything the server reads goes
 * through here so a missing or malformed field becomes a zero, an
 * empty string or an empty list rather than an `any` travelling into
 * game logic
 */
export function rowData(row: Record<string, unknown> | undefined): Record<string, unknown> | null {
  return row == null ? null : asRecord(row);
}

export { asNumber, asNumberArray, asRecord, asRecordArray, asString, asStringArray };
