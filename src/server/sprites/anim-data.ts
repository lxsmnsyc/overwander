import { xml2json } from 'xml-js';
import type { SpriteAnim } from '../../data/ids/sprite-anims';
import { spriteAnimName, spriteAnimOf } from '../../data/ids/sprite-anims';

/**
 * `AnimData.xml`, as the game wants it.
 *
 * A PMD sprite archive describes its animations in XML, where an entry
 * either names its own frame grid or copies another entry's. What the
 * sheet needs is a flat list with every copy resolved, since a copy is
 * drawn from the image it copied and only the name and index differ.
 */

const NUMBER = /^[0-9]+$/;

type Parsed = string | number | boolean | null | Parsed[] | { [key: string]: Parsed };

/**
 * `xml-js` wraps every leaf in `{ _text }` and leaves numbers as
 * strings. This unwraps both, so the tree below reads like the data it
 * describes rather than like the parser's shape
 */
function flatten(source: Parsed): Parsed {
  if (typeof source === 'string') {
    return NUMBER.test(source) ? Number.parseInt(source, 10) : source;
  }
  if (typeof source !== 'object' || source == null) {
    return typeof source === 'boolean' || typeof source === 'number' ? source : null;
  }
  if (Array.isArray(source)) {
    return source.map(flatten);
  }
  if ('_text' in source) {
    return flatten(source._text);
  }
  return Object.fromEntries(Object.entries(source).map(([key, value]) => [key, flatten(value)]));
}

/** One animation, with whatever it copied already resolved. */
export interface Anim {
  name: SpriteAnim;
  index: number;
  frameWidth: number;
  frameHeight: number;
  durations: number[];
  /** The image it is drawn from, which is itself unless it is a copy. */
  target: SpriteAnim;
}

export interface AnimData {
  shadowSize: number;
  anims: Anim[];
}

interface RawAnim {
  Name: string;
  Index?: number;
  CopyOf?: string;
  FrameWidth?: number;
  FrameHeight?: number;
  Durations?: { Duration: number | number[] };
}

function asArray<T>(value: T | T[] | undefined): T[] {
  if (value == null) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

/**
 * Reads the file, resolves the copies and keeps only the animations
 * the filter names. Everything else in the archive is an animation the
 * game has no move for, and a sheet holding it is a sheet of pixels
 * nobody ever draws
 */
export default function readAnimData(source: string, keep: RegExp): AnimData {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const parsed = flatten(JSON.parse(xml2json(source, { compact: true })) as Parsed) as {
    AnimData?: { ShadowSize?: number; Anims?: { Anim?: RawAnim | RawAnim[] } };
  };
  const root = parsed.AnimData;

  if (root == null) {
    throw new Error('The archive has no AnimData.xml worth reading');
  }
  const listed = asArray(root.Anims?.Anim);
  // Copies last, so whatever they copy has already been read
  const ordered = [...listed].sort((one, two) => {
    const first = one.CopyOf == null ? 0 : 1;

    return first - (two.CopyOf == null ? 0 : 1);
  });
  const found = new Map<string, Anim>();

  for (const entry of ordered) {
    // An animation this game has no number for is one no sheet can
    // describe, so it is left in the archive rather than half-written
    const named = spriteAnimOf(entry.Name);

    if (named == null) {
      continue;
    }
    if (entry.CopyOf != null) {
      const copied = found.get(entry.CopyOf);

      if (copied == null) {
        throw new Error(`${entry.Name} copies ${entry.CopyOf}, which the archive does not have`);
      }
      found.set(entry.Name, {
        ...copied,
        name: named,
        index: entry.Index ?? copied.index,
        target: copied.target,
      });
      continue;
    }
    found.set(entry.Name, {
      name: named,
      index: entry.Index ?? 0,
      frameWidth: entry.FrameWidth ?? 0,
      frameHeight: entry.FrameHeight ?? 0,
      durations: asArray(entry.Durations?.Duration),
      target: named,
    });
  }

  return {
    shadowSize: root.ShadowSize ?? 0,
    anims: [...found.values()].filter((anim) => keep.test(spriteAnimName(anim.target))),
  };
}
