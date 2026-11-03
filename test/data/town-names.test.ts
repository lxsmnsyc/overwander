import { describe, expect, it } from 'vitest';
import Biome from '../../src/data/ids/biome';
import type { SettledBiome } from '../../src/data/ids/biome';
import nameTown from '../../src/data/overworld/town-names';

/**
 * A town's name is worked out from where it stands, and players tell
 * each other town names, so no change to how names are built may
 * rename one. These were generated before town names read a locale
 */
const ENGLISH_TOWNS: [SettledBiome, number, number, string][] = [
  [Biome.Glacier, 0, 0, 'Hoarfell Town, Oakenwold'],
  [Biome.Glacier, 3, -2, 'Floeholt Mills, Brimshire'],
  [Biome.Glacier, -1, 5, 'Whiterun Borough, Saltenfen'],
  [Biome.Glacier, 63, 63, 'Whitemoor Borough, Oakenwold'],
  [Biome.Glacier, -64, -64, 'Hoarfell Town, Harrowfen'],
  [Biome.Glacier, 100, -37, 'Morainewatch City, Calderfold'],
  [Biome.Glacier, 17, 250, 'Seracbury Hamlet, Ashenfold'],
  [Biome.Glacier, -200, 199, 'Hoarglen Town, Umberfen'],
  [Biome.Glacier, 5, 5, 'Calvinghurst Mills, Oakenwold'],
  [Biome.Glacier, 64, 0, 'Hoarfell Town, Windermarch'],
  [Biome.Glacier, 2, 2, 'Stillrun Mills, Oakenwold'],
  [Biome.Glacier, 7, 31, 'Whitewick Landing, Oakenwold'],
  [Biome.Beach, 0, 0, 'Shellfell Town, Oakenwold'],
  [Biome.Beach, 3, -2, 'Duneholt Mills, Brimshire'],
  [Biome.Beach, -1, 5, 'Tiderun Borough, Saltenfen'],
  [Biome.Beach, 63, 63, 'Tidemoor Borough, Oakenwold'],
  [Biome.Beach, -64, -64, 'Shellfell Town, Harrowfen'],
  [Biome.Beach, 100, -37, 'Pebblewatch City, Calderfold'],
  [Biome.Beach, 17, 250, 'Driftbury Hamlet, Ashenfold'],
  [Biome.Beach, -200, 199, 'Shellglen Town, Umberfen'],
  [Biome.Beach, 5, 5, 'Foamhurst Mills, Oakenwold'],
  [Biome.Beach, 64, 0, 'Shellfell Town, Windermarch'],
  [Biome.Beach, 2, 2, 'Cocklerun Mills, Oakenwold'],
  [Biome.Beach, 7, 31, 'Tidewick Landing, Oakenwold'],
  [Biome.Desert, 0, 0, 'Scorchfell Town, Oakenwold'],
  [Biome.Desert, 3, -2, 'Mirageholt Mills, Brimshire'],
  [Biome.Desert, -1, 5, 'Siroccorun Borough, Saltenfen'],
  [Biome.Desert, 63, 63, 'Siroccomoor Borough, Oakenwold'],
  [Biome.Desert, -64, -64, 'Scorchfell Town, Harrowfen'],
  [Biome.Desert, 100, -37, 'Cactuswatch City, Calderfold'],
  [Biome.Desert, 17, 250, 'Basinbury Hamlet, Ashenfold'],
  [Biome.Desert, -200, 199, 'Scorchglen Town, Umberfen'],
  [Biome.Desert, 5, 5, 'Kilnhurst Mills, Oakenwold'],
  [Biome.Desert, 64, 0, 'Scorchfell Town, Windermarch'],
  [Biome.Desert, 2, 2, 'Dustrun Mills, Oakenwold'],
  [Biome.Desert, 7, 31, 'Siroccowick Landing, Oakenwold'],
  [Biome.Volcano, 0, 0, 'Emberfell Town, Oakenwold'],
  [Biome.Volcano, 3, -2, 'Cinderholt Mills, Brimshire'],
  [Biome.Volcano, -1, 5, 'Fumerun Borough, Saltenfen'],
  [Biome.Volcano, 63, 63, 'Fumemoor Borough, Oakenwold'],
  [Biome.Volcano, -64, -64, 'Emberfell Town, Harrowfen'],
  [Biome.Volcano, 100, -37, 'Pumicewatch City, Calderfold'],
  [Biome.Volcano, 17, 250, 'Sulphurbury Hamlet, Ashenfold'],
  [Biome.Volcano, -200, 199, 'Emberglen Town, Umberfen'],
  [Biome.Volcano, 5, 5, 'Ashfallhurst Mills, Oakenwold'],
  [Biome.Volcano, 64, 0, 'Emberfell Town, Windermarch'],
  [Biome.Volcano, 2, 2, 'Magmarun Mills, Oakenwold'],
  [Biome.Volcano, 7, 31, 'Fumewick Landing, Oakenwold'],
  [Biome.Bog, 0, 0, 'Quagfell Town, Oakenwold'],
  [Biome.Bog, 3, -2, 'Cranberryholt Mills, Brimshire'],
  [Biome.Bog, -1, 5, 'Sinkrun Borough, Saltenfen'],
  [Biome.Bog, 63, 63, 'Sinkmoor Borough, Oakenwold'],
  [Biome.Bog, -64, -64, 'Quagfell Town, Harrowfen'],
  [Biome.Bog, 100, -37, 'Bitternwatch City, Calderfold'],
  [Biome.Bog, 17, 250, 'Fenbury Hamlet, Ashenfold'],
  [Biome.Bog, -200, 199, 'Quagglen Town, Umberfen'],
  [Biome.Bog, 5, 5, 'Blackwaterhurst Mills, Oakenwold'],
  [Biome.Bog, 64, 0, 'Quagfell Town, Windermarch'],
  [Biome.Bog, 2, 2, 'Wisprun Mills, Oakenwold'],
  [Biome.Bog, 7, 31, 'Sinkwick Landing, Oakenwold'],
  [Biome.Taiga, 0, 0, 'Pinefell Town, Oakenwold'],
  [Biome.Taiga, 3, -2, 'Spruceholt Mills, Brimshire'],
  [Biome.Taiga, -1, 5, 'Owlrun Borough, Saltenfen'],
  [Biome.Taiga, 63, 63, 'Owlmoor Borough, Oakenwold'],
  [Biome.Taiga, -64, -64, 'Pinefell Town, Harrowfen'],
  [Biome.Taiga, 100, -37, 'Sablewatch City, Calderfold'],
  [Biome.Taiga, 17, 250, 'Needlebury Hamlet, Ashenfold'],
  [Biome.Taiga, -200, 199, 'Pineglen Town, Umberfen'],
  [Biome.Taiga, 5, 5, 'Conehurst Mills, Oakenwold'],
  [Biome.Taiga, 64, 0, 'Pinefell Town, Windermarch'],
  [Biome.Taiga, 2, 2, 'Larchrun Mills, Oakenwold'],
  [Biome.Taiga, 7, 31, 'Owlwick Landing, Oakenwold'],
  [Biome.Glacier, 0, 52, 'New Hoarfell Town, Oakenwold'],
  [Biome.Glacier, 3, 52, 'Old Hoarfell Town, Oakenwold'],
  [Biome.Glacier, 6, 52, 'Upper Hoarfell Town, Oakenwold'],
  [Biome.Glacier, 9, 52, 'Lower Hoarfell Town, Oakenwold'],
  [Biome.Glacier, 12, 52, 'North Hoarfell Town, Oakenwold'],
  [Biome.Glacier, 15, 52, 'South Hoarfell Town, Oakenwold'],
  [Biome.Glacier, 18, 52, 'East Hoarfell Town, Oakenwold'],
  [Biome.Glacier, 21, 52, 'West Hoarfell Town, Oakenwold'],
];

describe('English town names', () => {
  it('stay as they were for a sample of towns', () => {
    for (const [biome, x, y, name] of ENGLISH_TOWNS) {
      expect(nameTown(x, y, biome), `${biome} ${x},${y}`).toBe(name);
    }
  });
});
