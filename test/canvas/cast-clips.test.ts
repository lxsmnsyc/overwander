import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import SpeciesSpriteAnimation from '../../src/canvas/species-sprite-animation';
import asSpriteSheetJSON from '../../src/canvas/sprite-sheet';
import { MoveTargetType } from '../../src/battle/events';
import {
  COMMON_CAST,
  type CastAnimation,
  isLoopingCast,
  pickCast,
} from '../../src/data/constants/cast';
import { Moves } from '../../src/data/ids/moves';
import { getMoveData } from '../../src/data/moves';
import { animationFor } from '../../src/components/battle/BattleCanvas';
import { createBattle, createUnit } from '../battle/harness';

/**
 * Whether a pokemon has something to play while it casts.
 *
 * A pokemon that holds its Idle through its own attack is a pokemon
 * whose sheet answered no to everything the move offered, and the
 * answer comes from the clips the sheet **built at load** rather than
 * from the description as written: a clip whose grid or packed image
 * is missing is dropped on the floor, and the only sign of it is the
 * pokemon standing there.
 *
 * The chain has four links and this covers all of them — the sheet
 * carries the clip, the move offers one the sheet has, the engine
 * reports the cast, and the sprite switches to it. Each was suspected
 * once and cleared; a regression in any of them looks identical from
 * the outside, which is why they are pinned down separately.
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
  .map((name) => ({
    species: Number.parseInt(name, 10),
    raw: readFileSync(`${META}/${name}`, 'utf8'),
  }))
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
      expect(
        pickCast([wanted], (name) => gengar.has(name)),
        wanted,
      ).toBe(wanted);
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

describe('what the field shows while a move is cast', () => {
  it('reports a cast on the unit for the frames it is winding up', () => {
    const { battle, teamA, teamB } = createBattle();
    const caster = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    caster.addMove(Moves.Tackle);
    caster.cast(Moves.Tackle, { type: MoveTargetType.Unit, unit: target });

    // The canvas reads exactly this pair every frame
    const busy = caster.casting ?? caster.channeling;

    expect(busy, 'nothing to animate from').not.toBeUndefined();
    expect(busy?.move).toBe(Moves.Tackle);
  });

  it('winds up on a looping Charge whatever it is about to throw', () => {
    const { battle, teamA, teamB } = createBattle();
    const caster = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);
    const sprite = loaded(94);

    caster.addMove(Moves.Tackle);
    caster.cast(Moves.Tackle, { type: MoveTargetType.Unit, unit: target });

    // Gathering itself, not swinging: the swing is the throw, and
    // spending it on the wind-up leaves nothing for the move going off
    const gathering = animationFor(caster, sprite);

    expect(gathering.animation).toBe('Charge');
    expect(isLoopingCast(gathering.animation)).toBe(true);
    expect(gathering.loop).toBe(true);
    // A loop fills a window of any length by repeating rather than by
    // being dragged out over it
    expect(gathering.duration).toBe(null);
  });

  it('throws the move own clip over the window it is in the air', () => {
    const { battle, teamA, teamB } = createBattle();
    const caster = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);
    const sprite = loaded(94);
    const striking = { move: Moves.Tackle, window: 250 };

    caster.addMove(Moves.Tackle);
    caster.cast(Moves.Tackle, { type: MoveTargetType.Unit, unit: target });

    // Thrown beats winding up: a unit part-way into the next step of a
    // multi-step move is still throwing this one
    const throwing = animationFor(caster, sprite, striking);

    expect(throwing.animation).not.toBe('Charge');
    expect(throwing.loop).toBe(false);
    // Fitted to the flight, so the gesture ends as the hit lands
    expect(throwing.duration).toBe(250);
  });

  it('repeats a thrown clip that was drawn as a loop', () => {
    const { battle, teamA, teamB } = createBattle();
    const caster = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);
    const sprite = loaded(94);

    caster.addMove(Moves.Confusion);
    caster.cast(Moves.Confusion, { type: MoveTargetType.Unit, unit: target });

    // Gengar has no Special Attack clip and no Emit, so Confusion
    // falls through its preference to the Charge every sheet carries —
    // and a Charge repeats rather than being stretched, throw or not
    const throwing = animationFor(caster, sprite, { move: Moves.Confusion, window: 250 });

    expect(throwing.animation).toBe('Charge');
    expect(throwing.loop).toBe(true);
    expect(throwing.duration).toBe(null);
  });

  it('offers a clip Gengar has for every move it can learn', () => {
    const sprite = loaded(94);
    const idle: number[] = [];
    let checked = 0;

    // Walked by id rather than over the enum, which is `const` and has
    // no values to iterate at runtime. Ids this build has no data for
    // are not moves anybody can cast
    for (let id = 1; id < 1000; id += 1) {
      const move: Moves = id;

      let cast: CastAnimation[];

      try {
        // The walk is over raw ids because the enum is `const` and has
        // nothing to iterate at runtime; an id this build has no data
        // for is not a move anybody can cast
        cast = getMoveData(move).cast;
      } catch {
        continue;
      }
      checked += 1;
      if (pickCast(cast, (name) => sprite.has(name)) === 'Idle') {
        idle.push(id);
      }
    }
    expect(checked, 'moves to check').toBeGreaterThan(50);
    expect(idle, 'moves that leave Gengar standing still').toEqual([]);
  });
});
