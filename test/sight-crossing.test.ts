import { expect, it, vi } from 'vitest';

/** What the sight did to each topic, in order */
const log: string[] = [];
const ready: ((ready: boolean) => void)[] = [];

vi.mock('../src/auth/clock', () => ({ serverNow: () => 0 }));
vi.mock('../src/auth/live', () => ({
  joinTopic: (topic: string, handlers: { onReady: (ready: boolean) => void }) => {
    ready.push(handlers.onReady);
    return {
      track: () => log.push(`track ${topic}`),
      untrack: () => log.push(`untrack ${topic}`),
      send: () => undefined,
      leave: () => undefined,
    };
  },
}));

const { default: openSight } = await import('../src/auth/sight');
const { Depth } = await import('../src/overworld/depth');
const { SECTOR_CELLS, SECTOR_SLACK } = await import('../src/overworld/sight');

it('lists a walker in the sector they cross into before letting go of the old one', () => {
  const sight = openSight('me', 250);

  // Every sector joined is confirmed before the next step, as a quick server would
  const confirm = (): void => {
    for (const onReady of ready.splice(0)) {
      onReady(true);
    }
  };

  sight.stand(Depth.Surface, 5, 5, [1, 0]);
  confirm();
  log.length = 0;

  // Walk east until the home sector moves one to the right
  for (let x = 6; x <= SECTOR_CELLS + SECTOR_SLACK + 1; x += 1) {
    sight.stand(Depth.Surface, x, 5, [1, 0]);
    confirm();
  }

  const tracked = log.findIndex((line) => line.startsWith('track') && line.endsWith(':1:0'));
  const untracked = log.findIndex((line) => line.startsWith('untrack') && line.endsWith(':0:0'));

  expect(tracked).toBeGreaterThanOrEqual(0);
  expect(untracked).toBeGreaterThan(tracked);
  sight.close();
});
