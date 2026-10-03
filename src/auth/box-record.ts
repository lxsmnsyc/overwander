/**
 * A box a player files their catches into.
 *
 * Written apart from [`boxes.ts`](boxes.ts) because the server writes
 * it too, and a server module may not pull the browser's
 * server-function stubs in behind it.
 *
 * Default is not one of these. A catch with no box is in Default, which
 * cannot be renamed, recoloured or deleted, and keeps no slots: it is
 * where new catches land and where a deleted box's catches go back to.
 */
export interface BoxRecord {
  name: string;
  /** An index into `BOX_COLOURS` */
  colour: number;
  /** Its place in the player's list of boxes, from 0 */
  position: number;
}

/** How many boxes a player may make, Default not counted */
export const BOX_LIMIT = 32;

/** How long a box's name may be, the same as a nickname */
export { NICKNAME_LIMIT as BOX_NAME_LIMIT } from './nickname';

/**
 * The highest slot a box may use. Far past the longest dex, so a living
 * dex of every form still fits, and low enough to keep a typo from
 * paging a box into nonsense
 */
export const BOX_SLOT_LIMIT = 99_999;

/** What Default is called, wherever it is named */
export const DEFAULT_BOX_NAME = 'Default';

/**
 * The colours a box can be marked with, by index. Stored as the index,
 * so a colour can be retuned without touching anybody's boxes, and
 * appended to rather than reordered
 */
export const BOX_COLOURS: readonly { name: string; tone: string }[] = [
  { name: 'Blue', tone: '#2a75bb' },
  { name: 'Red', tone: '#dc2e26' },
  { name: 'Green', tone: '#33a05a' },
  { name: 'Gold', tone: '#c08508' },
  { name: 'Violet', tone: '#7b4fc0' },
  { name: 'Orange', tone: '#e2702b' },
  { name: 'Teal', tone: '#2f8f8a' },
  { name: 'Pink', tone: '#c4497e' },
  { name: 'Brown', tone: '#94643a' },
  { name: 'Slate', tone: '#5e7291' },
];

/** The tone Default is drawn in */
export const DEFAULT_BOX_TONE = '#1f2a44';

/** A stored colour as something to paint, falling back to the first for one this build lacks */
export function boxTone(colour: number): string {
  return (BOX_COLOURS.at(colour) ?? BOX_COLOURS[0]).tone;
}
