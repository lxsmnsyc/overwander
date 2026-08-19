import { existsSync, readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import loadSpeciesSprite, {
  hasFemaleSheet,
  spriteImagePath,
} from '../../src/canvas/species-sprites';
import { Species } from '../../src/data/ids/species';

/**
 * Which drawing a female pokemon is given.
 *
 * A female sheet is the same species drawn again — a flower, a tail —
 * and only a handful of species have one, so asking for it is a
 * preference. What the preference is *ordered by* is the part worth
 * pinning down: a coat is the whole colour of the pokemon and a form
 * is a detail, so a shiny female with no female drawing keeps its
 * shininess rather than its flower.
 */
const REAL = JSON.parse(readFileSync('public/sprites/pokemon/meta/3.json', 'utf8')) as unknown;

/**
 * A world where only these drawings exist. Everything else 404s the
 * way a species without a female sheet does
 */
function only(paths: string[]): void {
  const there = new Set(paths);

  // oxlint-disable-next-line typescript/require-await
  vi.stubGlobal('fetch', async (url: string) => ({
    ok: url.endsWith('.json'),
    // oxlint-disable-next-line typescript/require-await
    json: async () => REAL,
  }));

  /** Answers to a `src` the way a browser does, for these paths only. */
  class Fake {
    private readonly listeners: Record<string, (() => void)[]> = {};

    addEventListener(name: string, run: () => void): void {
      (this.listeners[name] ??= []).push(run);
    }

    // oxlint-disable-next-line eslint/accessor-pairs
    set src(value: string) {
      const name = there.has(value) ? 'load' : 'error';

      queueMicrotask(() => {
        for (const run of this.listeners[name] ?? []) {
          run();
        }
      });
    }
  }

  vi.stubGlobal('Image', Fake);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('spriteImagePath', () => {
  it('suffixes the female drawing and nothing else', () => {
    expect(spriteImagePath(Species.Venusaur)).toMatch(/regular\/3\.png$/);
    expect(spriteImagePath(Species.Venusaur, true)).toMatch(/shiny\/3\.png$/);
    expect(spriteImagePath(Species.Venusaur, false, true)).toMatch(/regular\/3_f\.png$/);
    expect(spriteImagePath(Species.Venusaur, true, true)).toMatch(/shiny\/3_f\.png$/);
  });

  it('names drawings that are actually there', () => {
    for (const species of [Species.Venusaur, Species.Butterfree]) {
      for (const shiny of [false, true]) {
        const path = spriteImagePath(species, shiny, true);

        expect(existsSync(`public${path}`), path).toBe(true);
      }
    }
  });
});

describe('which drawing a female is given', () => {
  /**
   * Paths built the way the loader builds them, so a test says which
   * *drawings exist* rather than repeating the naming scheme
   */
  const at = (species: Species, shiny: boolean, female: boolean): string =>
    spriteImagePath(species, shiny, female);

  it('takes the female sheet when the species has one', async () => {
    const species = Species.Gyarados;

    only([at(species, false, true), at(species, false, false)]);
    expect((await loadSpeciesSprite(species, { female: true }))?.source).toBe(
      at(species, false, true),
    );
  });

  it('draws the ordinary sheet for a species with no female one', async () => {
    const species = Species.Lapras;

    only([at(species, false, false)]);
    expect((await loadSpeciesSprite(species, { female: true }))?.source).toBe(
      at(species, false, false),
    );
  });

  it('keeps a shiny female shiny rather than keeping her flower', async () => {
    const species = Species.Ditto;

    // The one ordering decision: no shiny female drawing, so the coat
    // wins and the form is given up
    only([at(species, true, false), at(species, false, true)]);
    expect((await loadSpeciesSprite(species, { shiny: true, female: true }))?.source).toBe(
      at(species, true, false),
    );
  });

  it('takes the shiny female where there is one', async () => {
    const species = Species.Eevee;

    only([at(species, true, true), at(species, true, false)]);
    expect((await loadSpeciesSprite(species, { shiny: true, female: true }))?.source).toBe(
      at(species, true, true),
    );
  });

  it('falls to the ordinary coat when no shiny was drawn at all', async () => {
    const species = Species.Vaporeon;

    only([at(species, false, true), at(species, false, false)]);
    expect((await loadSpeciesSprite(species, { shiny: true, female: true }))?.source).toBe(
      at(species, false, true),
    );
  });

  it('leaves a male alone', async () => {
    const species = Species.Jolteon;

    only([at(species, false, true), at(species, false, false)]);
    expect((await loadSpeciesSprite(species))?.source).toBe(at(species, false, false));
  });
});

describe('hasFemaleSheet', () => {
  it('says yes only where a female drawing was made', async () => {
    only([spriteImagePath(Species.NidoranF, false, true)]);
    expect(await hasFemaleSheet(Species.NidoranF)).toBe(true);

    only([spriteImagePath(Species.Nidorino, false, false)]);
    expect(await hasFemaleSheet(Species.Nidorino)).toBe(false);
  });

  it('asks about the coat it was given', async () => {
    only([spriteImagePath(Species.Raichu, false, true)]);
    expect(await hasFemaleSheet(Species.Raichu, true)).toBe(false);
    expect(await hasFemaleSheet(Species.Raichu)).toBe(true);
  });

  it('agrees with the drawings that ship', () => {
    // The real collection: Venusaur has a female drawing and Bulbasaur
    // does not, which is what the dex reads to decide on a second coat
    expect(existsSync(`public${spriteImagePath(Species.Venusaur, false, true)}`)).toBe(true);
    expect(existsSync(`public${spriteImagePath(Species.Bulbasaur, false, true)}`)).toBe(false);
  });
});
