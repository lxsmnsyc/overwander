import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import SpeciesSpriteAnimation from '../../src/canvas/species-sprite-animation';
import asSpriteSheetJSON from '../../src/canvas/sprite-sheet';
import { COMMON_CAST, pickCast } from '../../src/data/constants/cast';

/**
 * Why a pokemon holds its Idle while it is casting.
 *
 * The canvas asks the **sheet** what it can do, so a pokemon stuck in
 * Idle is a pokemon whose sheet answered no to everything the move
 * offered. That answer comes from the clips the sheet built at load,
 * not from the description as written: a clip whose grid or packed
 * image is missing is dropped on the floor, and the only sign of it is
 * the pokemon standing there.
 */
const META = 'public/sprites/pokemon/meta';

function loaded(species: number): SpeciesSpriteAnimation {
  const data = asSpriteSheetJSON(JSON.parse(readFileSync(`${META}/${species}.json`, 'utf8')));
  const sprite = new SpeciesSpriteAnimation(`${species}.png`, data);

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  (sprite as unknown as { image: unknown }).image = {};
  return sprite;
}

const SHIPPED = readdirSync(META)
  .filter((name) => name.endsWith('.json'))
  .map((name) => ({ species: Number.parseInt(name, 10), raw: readFileSync(`${META}/${name}`, 'utf8') }))
  .filter((entry) => entry.raw.trim().length > 0)
  .map((entry) => entry.species)
  .sort((one, two) => one - two);

/**
 * Sheets that ship without one of the clips every sheet is supposed to
 * carry, and which one.
 *
 * Named here rather than quietly tolerated. A move whose preference
 * list ends in a clip the sheet has not got falls all the way through
 * to Idle, and the pokemon stands there through its own attack — so a
 * gap is worth knowing about even when nothing has tripped over it yet
 */
const KNOWN_GAPS: Record<number, string[] | undefined> = { 100001: ['Shoot'] };

describe('cast clips', () => {
  it('builds every common clip on every sheet that ships', () => {
    for (const species of SHIPPED) {
      const sprite = loaded(species);
      const missing = COMMON_CAST.filter((name) => !sprite.has(name));

      // A sheet short of a common clip is one whose moves fall through
      // the whole preference list and land on Idle
      expect(missing, `${species} is missing`).toEqual(KNOWN_GAPS[species] ?? []);
    }
  });

  it('stands in an Attack for a sheet that has no Shoot', () => {
    const short = loaded(100001);

    expect(short.has('Shoot'), 'the gap is still there').toBe(false);
    // A list that ends on Shoot used to fall through to Idle here
    expect(pickCast(['Emit', 'Shoot'], (name) => short.has(name))).toBe('Attack');
    expect(pickCast(['Shoot'], (name) => short.has(name))).toBe('Attack');
  });

  it('leaves a sheet that has its own Shoot alone', () => {
    const gengar = loaded(94);

    expect(pickCast(['Shoot'], (name) => gengar.has(name))).toBe('Shoot');
  });

  it('gives Gengar something to do for every cast list a move could offer', () => {
    const gengar = loaded(94);

    for (const wanted of COMMON_CAST) {
      expect(pickCast([wanted], (name) => gengar.has(name)), wanted).toBe(wanted);
    }
  });

  it('switches Gengar off its Idle when a cast is played', () => {
    const gengar = loaded(94);

    gengar.play('Idle', { loop: true });
    expect(gengar.playing).toBe('Idle');

    gengar.play('Attack', { loop: false, duration: 600 });
    expect(gengar.playing).toBe('Attack');
  });

  it('advances Gengar through the clip it was given', () => {
    const gengar = loaded(94);

    gengar.play('Attack', { loop: false, duration: 600 });

    const first = gengar.frame;

    gengar.update(300);
    expect(gengar.frame, 'half way through a 600ms window').not.toBe(first);
  });
});
