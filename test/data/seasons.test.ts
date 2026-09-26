import { describe, expect, it } from 'vitest';
import { Seasons, getSeason } from '../../src/data/ids/biome';
import { Species } from '../../src/data/ids/species';
import { getSeasonalCoat } from '../../src/data/species';

/** Midday on the first of the given month, which is what a month means here */
function firstOf(month: number): number {
  return Date.UTC(2026, month, 1, 12);
}

describe('the season', () => {
  it('turns a month at a time, January in spring', () => {
    const turned: Seasons[] = [];

    for (let month = 0; month < 12; month++) {
      turned.push(getSeason(firstOf(month)));
    }

    expect(turned).toEqual([
      Seasons.Spring,
      Seasons.Summer,
      Seasons.Autumn,
      Seasons.Winter,
      Seasons.Spring,
      Seasons.Summer,
      Seasons.Autumn,
      Seasons.Winter,
      Seasons.Spring,
      Seasons.Summer,
      Seasons.Autumn,
      Seasons.Winter,
    ]);
  });

  it('holds for a whole month rather than drifting inside one', () => {
    for (const day of [1, 9, 17, 28]) {
      expect(getSeason(Date.UTC(2026, 3, day, 12))).toBe(Seasons.Winter);
    }
  });

  it('hands each deer the coat its season names', () => {
    expect(getSeasonalCoat(Species.Deerling, Seasons.Spring)).toBe(Species.Deerling);
    expect(getSeasonalCoat(Species.Deerling, Seasons.Summer)).toBe(Species.DeerlingSummer);
    expect(getSeasonalCoat(Species.Deerling, Seasons.Autumn)).toBe(Species.DeerlingAutumn);
    expect(getSeasonalCoat(Species.Deerling, Seasons.Winter)).toBe(Species.DeerlingWinter);
    expect(getSeasonalCoat(Species.Sawsbuck, Seasons.Winter)).toBe(Species.SawsbuckWinter);
  });

  it('leaves anything that does not wear the year as it is', () => {
    for (const season of [Seasons.Spring, Seasons.Summer, Seasons.Autumn, Seasons.Winter]) {
      expect(getSeasonalCoat(Species.Rattata, season)).toBe(Species.Rattata);
    }
  });
});
