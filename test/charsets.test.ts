import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import Awards from '../src/data/ids/awards';
import {
  CHARSETS,
  DEFAULT_CHARSET,
  FREE_CHARSETS,
  getCharset,
  getCharsetName,
} from '../src/data/overworld/charsets';
import {
  ELITE_MEMBERS,
  ELITE_MEMBER_CHARSETS,
  ELITE_MEMBER_HONORS,
  GYM_LEADERS,
  GYM_LEADER_BADGES,
  GYM_LEADER_CHARSETS,
  GYM_LEADER_LATER_CHARSETS,
  GYM_LEADER_PRIZE_CHARSETS,
  LEGENDS,
  LEGEND_CHARSETS,
  LEGEND_HONORS,
  LEGEND_NAMES,
  LEGEND_PRIZE_CHARSETS,
} from '../src/data/overworld/experts';
import Npc, {
  GIOVANNI_HONOR,
  ROCKET_EXECUTIVES,
  ROCKET_EXECUTIVE_CHARSETS,
  ROCKET_EXECUTIVE_HONORS,
  ROCKET_GRUNT_HONOR,
  npcSheets,
} from '../src/data/overworld/npc';
import { TRAINER_CHARSETS, TRAINER_CLASSES } from '../src/data/overworld/trainers';

/**
 * The characters a trainer may go about as, and what unlocks each.
 *
 * The list is derived from the expert and trainer tables rather than
 * written out, so what is worth testing is that the derivation covers
 * them and that every sheet it names is one the game can actually
 * draw.
 */

describe('the characters a trainer may wear', () => {
  it('starts everybody with the two player characters and nothing else', () => {
    const free = CHARSETS.filter((charset) => charset.lock.kind === 'free');

    expect(free.map((charset) => charset.sheet)).toEqual(FREE_CHARSETS);
    expect(FREE_CHARSETS).toContain(DEFAULT_CHARSET);
  });

  it('names a sheet that is actually on disk', () => {
    // A sheet nobody packed is a square that draws nothing, and the
    // picker would offer it anyway: the lock says it was earned
    const missing = CHARSETS.filter(
      (charset) => !existsSync(`public/sprites/overworld/${charset.sheet}`),
    );

    expect(missing.map((charset) => charset.sheet)).toEqual([]);
  });

  it('pairs every gym leader with their own badge', () => {
    for (const leader of GYM_LEADERS) {
      // The coats they wander in, and the other looks the badge pays
      for (const sheet of [
        ...GYM_LEADER_CHARSETS[leader],
        ...(GYM_LEADER_PRIZE_CHARSETS[leader] ?? []),
      ]) {
        const found = getCharset(sheet);

        // Red is the Champion's sheet as well as the free one, and the
        // free claim is the one that stands
        if (FREE_CHARSETS.includes(sheet)) {
          continue;
        }
        expect(found?.lock).toEqual({ kind: 'award', award: GYM_LEADER_BADGES[leader] });
      }
    }
  });

  it('pairs every one of the Elite Four with their own mark', () => {
    for (const member of ELITE_MEMBERS) {
      for (const sheet of ELITE_MEMBER_CHARSETS[member]) {
        expect(getCharset(sheet)?.lock).toEqual({
          kind: 'award',
          award: ELITE_MEMBER_HONORS[member],
        });
      }
    }
  });

  it('pairs every trainer class with its own line', () => {
    // Every class, not every trade: Johto's Swimmer coats are opened
    // by Johto's swimmers
    for (const trainer of TRAINER_CLASSES) {
      for (const sheet of TRAINER_CHARSETS[trainer]) {
        expect(getCharset(sheet)?.lock).toEqual({ kind: 'trainer', trainer });
      }
    }
  });

  it('pays Kanto’s title in the champion’s own coats', () => {
    const seats = CHARSETS.filter(
      (charset) => charset.lock.kind === 'award' && charset.lock.award === Awards.KantoChampion,
    );

    // Blue keeps the seat at the top of Kanto now, so the title is
    // worth going about as him, in both looks the seat pays outright
    expect(seats.map((charset) => charset.sheet)).toEqual([
      'characters/frlg/blue',
      'characters/lgpe/blue',
    ]);
  });

  it('holds back the coats one deed is not enough for', () => {
    // Blue's Heart Gold look is the man who took Viridian's gym back
    // after his year at the top, so it asks for both crowns
    expect(getCharset('characters/hgss/blue')?.lock).toEqual({
      kind: 'awards',
      awards: [Awards.KantoChampion, Awards.JohtoChampion],
    });
  });

  it('pays Team Rocket’s boss in the coat he runs it in', () => {
    // His gym in Kanto is a different fight with a badge of its own,
    // and that one pays the other two looks of him
    expect(getCharset('characters/hgss/giovanni')?.lock).toEqual({
      kind: 'award',
      award: GIOVANNI_HONOR,
    });
    for (const sheet of ['characters/frlg/giovanni', 'characters/lgpe/giovanni']) {
      expect(getCharset(sheet)?.lock).toEqual({ kind: 'award', award: Awards.EarthBadge });
    }
  });

  it('pays a legend’s mark in coats of the legend', () => {
    for (const legend of LEGENDS) {
      for (const sheet of LEGEND_PRIZE_CHARSETS[legend]) {
        expect(getCharset(sheet)?.lock).toEqual({ kind: 'award', award: LEGEND_HONORS[legend] });
        expect(getCharset(sheet)?.name).toBe(LEGEND_NAMES[legend]);
      }
      // A coat the game starts players in stays free whoever wears it
      // in the world, so Red's mark pays his other two and not that
      // one. Steven's is nobody's starting look, so his mark pays the
      // sheet he is standing there in
      for (const sheet of LEGEND_CHARSETS[legend]) {
        expect(getCharset(sheet)?.lock).toEqual(
          FREE_CHARSETS.includes(sheet)
            ? { kind: 'free' }
            : { kind: 'award', award: LEGEND_HONORS[legend] },
        );
      }
    }
  });

  it('pays every Team Rocket rank in the coat it was met in', () => {
    for (const executive of ROCKET_EXECUTIVES) {
      for (const sheet of ROCKET_EXECUTIVE_CHARSETS[executive]) {
        expect(getCharset(sheet)?.lock).toEqual({
          kind: 'award',
          award: ROCKET_EXECUTIVE_HONORS[executive],
        });
      }
    }
    // The rank and file share one mark between them: a grunt is a
    // uniform rather than a person
    for (const sheet of npcSheets(Npc.RocketGrunt)) {
      expect(getCharset(sheet)?.lock).toEqual({ kind: 'award', award: ROCKET_GRUNT_HONOR });
    }
  });

  it('asks a Kanto leader’s later look for Johto’s crown as well', () => {
    for (const leader of GYM_LEADERS) {
      for (const sheet of GYM_LEADER_LATER_CHARSETS[leader] ?? []) {
        expect(getCharset(sheet)?.lock).toEqual({
          kind: 'awards',
          awards: [GYM_LEADER_BADGES[leader], Awards.JohtoChampion],
        });
      }
    }
    // Fuchsia's gym is his daughter's by then, and it is his badge
    // that pays her
    expect(getCharset('characters/hgss/janine')?.name).toBe('Janine');
    expect(getCharset('characters/hgss/brock')?.name).toBe('Brock');
  });

  it('pays a filled dex in the professor who asked for it', () => {
    for (const sheet of ['characters/frlg/oak', 'characters/lgpe/oak']) {
      expect(getCharset(sheet)?.lock).toEqual({ kind: 'award', award: Awards.KantoDexMedal });
      expect(getCharset(sheet)?.name).toBe('Professor Oak');
    }
    expect(getCharset('characters/hgss/elm')?.lock).toEqual({
      kind: 'award',
      award: Awards.JohtoDexMedal,
    });
    // Oak as Johto draws him asks for both dexes
    expect(getCharset('characters/hgss/oak')?.lock).toEqual({
      kind: 'awards',
      awards: [Awards.KantoDexMedal, Awards.JohtoDexMedal],
    });
    expect(getCharset('characters/oras/birch')?.lock).toEqual({
      kind: 'award',
      award: Awards.HoennDexMedal,
    });
    expect(getCharset('characters/oras/birch')?.name).toBe('Professor Birch');
  });

  it('says who a sheet is, and which game it is drawn from', () => {
    expect(getCharsetName('characters/frlg/brock')).toBe('Brock (FRLG)');
    expect(getCharsetName('characters/lgpe/brock')).toBe('Brock (LGPE)');
    // A sheet nobody offers still has to be called something
    expect(getCharsetName('characters/frlg/nobody')).toBe('Trainer');
  });
});
