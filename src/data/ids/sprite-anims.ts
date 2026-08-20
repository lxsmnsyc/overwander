/**
 * The animations a sprite sheet can carry, as numbers.
 *
 * A PMD archive names its animations, and the names are a closed
 * vocabulary the whole collection draws from. Numbering them is what
 * lets a sheet's description say `7` where it used to say `"Idle"` —
 * once per clip and once per anim, on a hundred and fifty sheets.
 *
 * **The numbers are written into every `meta/{species}.json`, so they
 * are append-only.** A new animation takes the next free number; an
 * existing one never moves, and nothing is ever removed. The archive's
 * own `Index` is no use for this — it numbers within one archive, so
 * half a dozen different animations are all `2`.
 *
 * Written as a frozen object rather than as an `enum`, unlike its
 * neighbours here, for two reasons: the names come back out of it, so
 * there is no second table to keep in step, and the sprite scripts run
 * under `node`, which refuses a file that declares an enum
 */
export const SpriteAnim = {
  // The eleven every sheet carries — see `COMMON_CAST`
  Idle: 0,
  Sleep: 1,
  Hurt: 2,
  Attack: 3,
  Charge: 4,
  Shoot: 5,
  Double: 6,
  Hop: 7,
  Rotate: 8,
  Walk: 9,
  Swing: 10,
  // Drawn for some pokemon and not others
  Slice: 11,
  SpAttack: 12,
  Shock: 13,
  QuickStrike: 14,
  Strike: 15,
  Jab: 16,
  Punch: 17,
  Kick: 18,
  MultiStrike: 19,
  Slam: 20,
  Withdraw: 21,
  Twirl: 22,
  RearUp: 23,
  Shake: 24,
  Lick: 25,
  Dance: 26,
  Uppercut: 27,
  Gas: 28,
  Stomp: 29,
  Emit: 30,
  Swell: 31,
  Ricochet: 32,
  MultiScratch: 33,
  Bite: 34,
  Appeal: 35,
  Chop: 36,
  Hover: 37,
  Rumble: 38,
  Sound: 39,
} as const;

export type SpriteAnim = (typeof SpriteAnim)[keyof typeof SpriteAnim];

/** Every animation there is, in the order they are numbered. */
export const SPRITE_ANIMS: SpriteAnim[] = Object.values(SpriteAnim);

const NAMED = new Map<number, string>(
  Object.entries(SpriteAnim).map(([name, anim]) => [anim, name]),
);

const ANIMS = new Map<number, SpriteAnim>(SPRITE_ANIMS.map((anim) => [anim, anim]));

const NUMBERED = new Map<string, SpriteAnim>(
  Object.entries(SpriteAnim).map(([name, anim]) => [name.toLowerCase(), anim]),
);

/**
 * The animation a number means, or nothing where this game has no
 * animation by that number — a description written by something newer
 */
export function asSpriteAnim(value: number): SpriteAnim | null {
  return ANIMS.get(value) ?? null;
}

/**
 * Which animation an archive means by a name, matched without regard
 * to case. Nothing for a name this game has no number for, which is a
 * sheet that cannot be described rather than one to guess at
 */
export function spriteAnimOf(name: string): SpriteAnim | null {
  return NUMBERED.get(name.trim().toLowerCase()) ?? null;
}

/** What an animation is called, for a message or a filename. */
export function spriteAnimName(anim: SpriteAnim): string {
  return NAMED.get(anim) ?? String(anim);
}
