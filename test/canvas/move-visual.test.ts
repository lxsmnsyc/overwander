import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import moveVisualFor from '../../src/canvas/battle/moves';
import MoveVisual, { type Beat, type MoveStage } from '../../src/canvas/battle/moves/__visual';
import { HYDRO_PUMP } from '../../src/canvas/battle/moves/hydro-pump';
import { SUPERSONIC } from '../../src/canvas/battle/moves/supersonic';
import DirectionalEffectSprite from '../../src/canvas/directional-effect-sprite';
import EffectSprite, { asEffectSpriteData } from '../../src/canvas/effect-sprite';
import { Moves } from '../../src/data/ids/moves';

/**
 * The sheets Supersonic is built out of, read off disk rather than
 * fetched: the running order names real folders, and a beat pointing
 * at a sheet that is not there is exactly the bug worth catching.
 */
function sheet(name: string): EffectSprite {
  const data = asEffectSpriteData(
    JSON.parse(readFileSync(`public/sprites/${name}/data.json`, 'utf8')),
  );
  const sprite = new EffectSprite(`${name}.png`, data);

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  (sprite as unknown as { image: unknown }).image = {};
  return sprite;
}

/** The same sheet through the class an aimed beat is played with. */
function aimedSheet(name: string): DirectionalEffectSprite {
  const data = asEffectSpriteData(
    JSON.parse(readFileSync(`public/sprites/${name}/data.json`, 'utf8')),
  );
  const sprite = new DirectionalEffectSprite(`${name}.png`, data);

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  (sprite as unknown as { image: unknown }).image = {};
  return sprite;
}

function recorder(): {
  context: CanvasRenderingContext2D;
  drawn: number[][];
  turns: number[];
  moves: number[][];
} {
  const drawn: number[][] = [];
  const turns: number[] = [];
  const moves: number[][] = [];
  const context = {
    globalAlpha: 1,
    save: () => {},
    restore: () => {},
    translate: (x: number, y: number) => {
      moves.push([x, y]);
    },
    rotate: (angle: number) => {
      turns.push(angle);
    },
    drawImage: (_image: unknown, ...rest: number[]) => {
      drawn.push(rest);
    },
  };

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return { context: context as unknown as CanvasRenderingContext2D, drawn, turns, moves };
}

const STAGE: MoveStage = { source: [100, 100], targets: [[300, 100]], scale: 1 };

const BEATS: Beat[] = [
  { sheet: 'effects/19', at: 0, span: 200, places: (stage) => [stage.source] },
  { sheet: 'effects/67', at: 200, span: 300, places: (stage) => stage.targets },
];

function performance(beats: Beat[] = BEATS): MoveVisual {
  return new MoveVisual(
    beats,
    beats.map((beat) => sheet(beat.sheet)),
  );
}

describe('MoveVisual', () => {
  it('lasts until its last beat is over', () => {
    expect(performance().duration).toBe(500);
  });

  it('draws nothing before its first beat starts', () => {
    const visual = performance();
    const { context, drawn } = recorder();

    visual.draw(context, STAGE);
    expect(drawn).toHaveLength(0);
  });

  it('draws only the beats the clock is inside', () => {
    const visual = performance();
    const { context, drawn } = recorder();

    visual.advance(100);
    visual.draw(context, STAGE);
    // The ring is playing and the mark has not started
    expect(drawn).toHaveLength(1);

    visual.advance(150);
    drawn.length = 0;
    visual.draw(context, STAGE);
    // The ring is past its span and the mark is inside its own
    expect(drawn).toHaveLength(1);
  });

  it('puts a copy at every place its beat answers with', () => {
    const visual = performance([
      { sheet: 'effects/19', at: 0, span: 200, places: (stage) => stage.targets },
    ]);
    const { context, drawn } = recorder();

    visual.advance(50);
    visual.draw(context, { ...STAGE, targets: [[10, 10], [20, 20], [30, 30]] });
    expect(drawn).toHaveLength(3);
  });

  it('draws nothing for a move that hit nothing', () => {
    const visual = performance([
      { sheet: 'effects/19', at: 0, span: 200, places: (stage) => stage.targets },
    ]);
    const { context, drawn } = recorder();

    visual.advance(50);
    visual.draw(context, { ...STAGE, targets: [] });
    expect(drawn).toHaveLength(0);
  });

  it('starts a beat where the clock already is rather than from its beginning', () => {
    const visual = performance();
    const { context, drawn } = recorder();

    // One long frame straight past the first beat's start
    visual.advance(150);
    visual.draw(context, STAGE);

    const late = performance();
    const second = recorder();

    // The same point reached in small steps
    for (let step = 0; step < 15; step += 1) {
      late.advance(10);
    }
    late.draw(second.context, STAGE);
    expect(second.drawn[0]?.slice(0, 4)).toEqual(drawn[0]?.slice(0, 4));
  });

  it('holds a beat that has run out until its span is over', () => {
    const visual = performance([
      { sheet: 'effects/67', at: 0, span: 2000, places: (stage) => stage.targets },
    ]);
    const { context, drawn } = recorder();

    // The sheet is a tenth of a second long and the beat is two
    // seconds, so most of the beat is its last frame held
    visual.advance(1900);
    visual.draw(context, STAGE);
    expect(drawn).toHaveLength(1);

    visual.advance(200);
    drawn.length = 0;
    visual.draw(context, STAGE);
    expect(drawn).toHaveLength(0);
    expect(visual.finished).toBe(true);
  });

  it('carries on when a sheet never arrived', () => {
    const visual = new MoveVisual(BEATS, [null, sheet('effects/67')]);
    const { context, drawn } = recorder();

    expect(visual.duration).toBe(500);
    visual.advance(250);
    visual.draw(context, STAGE);
    expect(drawn).toHaveLength(1);
  });

  it('rewinds without refetching', () => {
    const visual = performance();
    const { context, drawn } = recorder();

    visual.advance(500);
    expect(visual.finished).toBe(true);

    visual.restart();
    expect(visual.finished).toBe(false);
    expect(visual.progress).toBe(0);

    visual.advance(100);
    visual.draw(context, STAGE);
    expect(drawn).toHaveLength(1);
  });
});

describe('supersonic', () => {
  it('is built out of sheets that are actually there', () => {
    for (const beat of SUPERSONIC) {
      const sprite = sheet(beat.sheet);

      expect(sprite.length, `${beat.sheet} ticks`).toBeGreaterThan(0);
      expect(sprite.cellWidth, `${beat.sheet} cell`).toBeGreaterThan(0);
    }
  });

  it('sends its crossing ring the whole way and no further', () => {
    const stage: MoveStage = { source: [0, 0], targets: [[100, 0]], scale: 1 };
    const crossing = SUPERSONIC.find((beat) => beat.places(stage, 0.5)[0]?.[0] === 50);

    expect(crossing, 'a beat that moves').toBeDefined();
    expect(crossing?.places(stage, 0)[0]).toEqual([0, 0]);
    expect(crossing?.places(stage, 1)[0]).toEqual([100, 0]);
  });

  it('leaves the mark hanging after the rings are done', () => {
    const rings = SUPERSONIC.filter((beat) => beat.sheet === 'effects/19');
    const mark = SUPERSONIC.find((beat) => beat.sheet === 'effects/67');
    const lastRing = Math.max(...rings.map((beat) => beat.at + beat.span));

    expect(mark).toBeDefined();
    expect((mark?.at ?? 0) + (mark?.span ?? 0)).toBeGreaterThan(lastRing);
  });

  it('has a visual, and a move without one says so', () => {
    expect(moveVisualFor(Moves.Supersonic)).not.toBeNull();
    expect(moveVisualFor(Moves.Tackle)).toBeNull();
  });
});

describe('hydro pump', () => {
  const stage: MoveStage = { source: [0, 0], targets: [[100, 0]], scale: 1 };

  it('is built out of sheets that are actually there', () => {
    for (const beat of HYDRO_PUMP) {
      const sprite = sheet(beat.sheet);

      expect(sprite.length, `${beat.sheet} ticks`).toBeGreaterThan(0);
    }
  });

  it('lays the jet out along the line, in order, without reaching either end', () => {
    const jet = HYDRO_PUMP.filter((beat) => beat.sheet === 'effects/82');
    const along = jet.map((beat) => beat.places(stage, 0)[0]?.[0] ?? 0);

    expect(jet.length).toBeGreaterThan(1);
    expect([...along].sort((one, two) => one - two)).toEqual(along);
    expect(along[0]).toBeGreaterThan(0);
    expect(along[along.length - 1]).toBeLessThan(100);
    // Each length lights up after the one behind it and they all end
    // together, so the stream reaches and is then sustained
    const ends = jet.map((beat) => beat.at + beat.span);

    expect(new Set(ends).size).toBe(1);
    expect(jet[0].at).toBeLessThan(jet[jet.length - 1].at);
  });

  it('turns its splash back down the jet', () => {
    const splash = HYDRO_PUMP.find((beat) => beat.aim != null);

    expect(splash?.places(stage, 1)[0]).toEqual([100, 0]);
    expect(splash?.aim?.(stage, 1)).toEqual([0, 0]);
    // Pinned at the foot of its cell — the water's contact with
    // whatever it hit, not the middle of the picture
    expect(splash?.pivot).toEqual([16, 32]);
  });

  it('aims through the directional class and leaves the rest upright', () => {
    const aimed = HYDRO_PUMP.filter((beat) => beat.aim != null);
    const visual = new MoveVisual(
      aimed,
      aimed.map((beat) => aimedSheet(beat.sheet)),
    );
    const { context, turns, moves } = recorder();

    visual.advance(400);
    visual.draw(context, stage);
    expect(moves[0]).toEqual([100, 0]);
    // Source is due left of the target, so the crown is turned a
    // quarter turn to face back along the jet
    expect(turns[0]).toBeCloseTo(Math.PI / 2);
  });
});
