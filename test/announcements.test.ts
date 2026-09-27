import { describe, expect, it } from 'vitest';
import { type Announcement, liveAnnouncements } from '../src/auth/announcements';

const ONE: Announcement = { id: 1, message: 'Maintenance at noon.', startsAt: 100, endsAt: 200 };
const TWO: Announcement = { id: 2, message: 'Double candy weekend.', startsAt: 150, endsAt: 300 };

describe('which announcements are showing', () => {
  it('shows one only between its start and its end', () => {
    expect(liveAnnouncements([ONE], 99, new Set())).toEqual([]);
    expect(liveAnnouncements([ONE], 100, new Set())).toEqual([ONE]);
    expect(liveAnnouncements([ONE], 200, new Set())).toEqual([]);
  });

  it('leaves out the ones the player has put away, and only those', () => {
    expect(liveAnnouncements([ONE, TWO], 160, new Set([1]))).toEqual([TWO]);
  });
});
