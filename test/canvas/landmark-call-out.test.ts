import { describe, expect, it } from 'vitest';
import Landmark, { LANDMARKS, LANDMARK_NAMES } from '../../src/data/overworld/landmark';
import {
  isFightingLandmark,
  landmarkCallOut,
} from '../../src/components/overworld/chunk-canvas/scenery';
import { COLORS } from '../../src/components/overworld/chunk-canvas/metrics';

/**
 * The colour a landmark's cell is called out in.
 *
 * Once the charsets load, everybody standing at a landmark is a
 * person on a square, and the coat says nothing about what walking up
 * to them does. The ring under their feet is the only thing that
 * does, so what is worth checking is that the rungs of the league do
 * not all read as one fight.
 */

describe('the colour under somebody standing at a landmark', () => {
  it('gives each rung of the league a colour of its own', () => {
    const gym = landmarkCallOut(Landmark.GymLeader);
    const elite = landmarkCallOut(Landmark.EliteFour);
    const champion = landmarkCallOut(Landmark.Champion);

    expect(new Set([gym, elite, champion, COLORS.fight, COLORS.serve]).size).toBe(5);
    expect(gym).toBe(COLORS.gym);
    expect(elite).toBe(COLORS.elite);
    expect(champion).toBe(COLORS.champion);
  });

  it('leaves the ordinary fights ember and every counter tide', () => {
    expect(landmarkCallOut(Landmark.TeamRocket)).toBe(COLORS.fight);
    expect(landmarkCallOut(Landmark.Trainer)).toBe(COLORS.fight);
    expect(landmarkCallOut(Landmark.Market)).toBe(COLORS.serve);
    expect(landmarkCallOut(Landmark.WanderingNpc)).toBe(COLORS.serve);
  });

  it('answers for every landmark there is', () => {
    // A landmark with no colour draws no ring at all, which reads as
    // a cell nobody is standing on
    for (const landmark of LANDMARKS) {
      expect(landmarkCallOut(landmark), LANDMARK_NAMES[landmark]).toMatch(/^rgba\(/);
    }
    // And the three rungs are still fights, so nothing else about them
    // changes
    expect(isFightingLandmark(Landmark.GymLeader)).toBe(true);
    expect(isFightingLandmark(Landmark.EliteFour)).toBe(true);
    expect(isFightingLandmark(Landmark.Champion)).toBe(true);
  });
});
