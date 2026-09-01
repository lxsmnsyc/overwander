import { Species } from '../data/ids/species';
import { REGION_NAMES, getSpeciesRegion } from '../data/species/regions';
import SpeciesSpriteAnimation from './species-sprite-animation';
import type { SpriteCoats } from './sprite-coats';
import { COATS_PATH, asSpriteCoats, coatOf, drawn, stamped } from './sprite-coats';
import asSpriteSheetJSON, { type SpriteSheetJSON } from './sprite-sheet';

/**
 * Which sheet belongs to which pokemon, and how to get one.
 *
 * A pokemon is three files, all named after its species id:
 *
 * ```
 * public/sprites/pokemon/regular/1.png
 * public/sprites/pokemon/shiny/1.png
 * public/sprites/pokemon/meta/1.json
 * ```
 *
 * so nothing has to keep a table of names beside the enum that already
 * numbers them. Species 100000, 100001 and 100002 are Missingno, an egg
 * and a substitute: things that appear on a field without being
 * anybody's pokemon, numbered alongside the rest so they are asked for
 * exactly the same way — and numbered a long way past the dex rather
 * than in front of it, because a species id **is** its dex number now
 * and those three have no dex number to take.
 *
 * The two coats are **siblings** rather than one nested inside the
 * other. They are two drawings of the same pokemon, and a directory of
 * every shiny is a thing worth being able to look at on its own. What
 * they are not is two animations: the description under `meta` is one
 * file for both, because a shiny is the same frames held for the same
 * time with the same anchors on them, and two copies of that is two
 * things to keep in step.
 *
 * Everything is shared as far as it can be. One description is fetched
 * per pokemon however many coats of it are asked for, one drawing per
 * coat however many callers want it, and a caller gets its own playhead
 * cloned off the loaded copy — six pokemon on a field are six playheads
 * over one image.
 */

export const SPRITE_ROOT = '/sprites/pokemon';

/**
 * Where one pokemon's sheets are filed.
 *
 * By region, so a folder holds a dex's worth of files rather than
 * every pokemon ever drawn. Which region is worked out from the dex
 * number — see `getSpeciesRegion` — so nothing has to be listed twice
 */
function regionRoot(species: Species): string {
  return `${SPRITE_ROOT}/${REGION_NAMES[getSpeciesRegion(species)]}`;
}

/**
 * What is drawn when a pokemon has no sheet of its own. Only a
 * handful are drawn so far, and the rest of the dex has to look like
 * *something* — Missingno is what the game has always shown when it
 * did not know what to show
 */
export const FALLBACK_SPECIES = Species.Missingno;

/**
 * The drawing of one coat of one pokemon.
 *
 * A **female** sheet is the same species drawn again — Venusaur's
 * flower, Pikachu's tail — and lives beside the ordinary one under
 * the same coat, suffixed `_f`. Only a few species have one, which is
 * why asking for it is a preference rather than a promise: see
 * `loadSpeciesSprite`
 */
export function spriteImagePath(species: Species, shiny = false, female = false): string {
  return `${regionRoot(species)}/${shiny ? 'shiny' : 'regular'}/${species}${female ? '_f' : ''}.png`;
}

/**
 * The animation a coat is played at.
 *
 * Shiny is a recolour of the same drawing, so it reads its coat's
 * description. A female is a redrawing from an archive of its own,
 * held for its own lengths and cut to its own frames, so it has one
 * of its own under the same `_f` its picture carries
 */
export function spriteMetaPath(species: Species, female = false): string {
  return `${regionRoot(species)}/meta/${species}${female ? '_f' : ''}.json`;
}

/**
 * Every description asked for so far, by the path of the description.
 * A failure is remembered as a failure: a pokemon with no description
 * should cost one 404, not one per frame
 */
const DESCRIPTIONS = new Map<string, Promise<SpriteSheetJSON | null>>();

/**
 * Every sheet asked for so far, by the path of its drawing
 */
const SHEETS = new Map<string, Promise<SpeciesSpriteAnimation | null>>();

/**
 * Which coats were drawn, fetched once for the whole session.
 *
 * A failure resolves to nothing rather than throwing: the list is an
 * optimisation, and a game that cannot read it should ask for the
 * sheets the long way round rather than not draw
 */
let listed: Promise<SpriteCoats | null> | undefined;

async function coats(): Promise<SpriteCoats | null> {
  listed ??= fetch(COATS_PATH)
    .then(async (response) => (response.ok ? asSpriteCoats(await response.json()) : null))
    .catch(() => null);
  return listed;
}

async function loadDescription(species: Species, female: boolean): Promise<SpriteSheetJSON | null> {
  try {
    // Asked for with the digest of the sheets it describes, so a
    // repacked pokemon is a new address rather than whatever the
    // browser kept from last time
    const response = await fetch(stamped(spriteMetaPath(species, female), await coats(), species));

    if (!response.ok) {
      return null;
    }
    return asSpriteSheetJSON(await response.json());
  } catch {
    // A description that is missing, unreachable or not JSON at all is
    // a pokemon this build cannot draw. Falling back is the caller's
    // business, not handling an exception mid-frame
    return null;
  }
}

async function description(species: Species, female: boolean): Promise<SpriteSheetJSON | null> {
  const path = spriteMetaPath(species, female);
  const known = DESCRIPTIONS.get(path);

  if (known != null) {
    return known;
  }

  const loading = loadDescription(species, female);

  DESCRIPTIONS.set(path, loading);
  return loading;
}

async function loadSheet(
  species: Species,
  shiny: boolean,
  female: boolean,
): Promise<SpeciesSpriteAnimation | null> {
  // Asked before anything is fetched: a species whose list says it was
  // never drawn this way is answered without a request, which is the
  // whole point of keeping the list
  if (!drawn(await coats(), species, coatOf(shiny, female))) {
    return null;
  }
  const data = await description(species, female);

  if (data == null) {
    return null;
  }

  try {
    const sprite = new SpeciesSpriteAnimation(
      stamped(spriteImagePath(species, shiny, female), await coats(), species),
      data,
    );

    await sprite.load();
    return sprite;
  } catch {
    // The description is there and the drawing is not: that is how a
    // pokemon with no shiny of its own answers, and the ordinary coat
    // is tried next
    return null;
  }
}

async function sheet(
  species: Species,
  shiny: boolean,
  female: boolean,
): Promise<SpeciesSpriteAnimation | null> {
  const path = spriteImagePath(species, shiny, female);
  const known = SHEETS.get(path);

  if (known != null) {
    return known;
  }

  const loading = loadSheet(species, shiny, female);

  SHEETS.set(path, loading);
  return loading;
}

export interface SpriteRequest {
  shiny?: boolean;
  /**
   * Whether to prefer the female drawing where the species has one.
   * Most do not, and a species without one is drawn the ordinary way
   * rather than not at all
   */
  female?: boolean;
  /**
   * Whether to fall back to Missingno when the species has no sheet.
   * On by default: a canvas asking for a pokemon wants something to
   * draw, and a caller that would rather draw nothing says so
   */
  fallback?: boolean;
}

/**
 * An animation for one pokemon, ready to play.
 *
 * It is a clone of the shared sheet, so playing, pausing and facing
 * it about affects this caller alone. Resolves null only when there
 * is no sheet and no fallback either
 */
/**
 * Whether this species was drawn a second time for its females.
 *
 * `loadSpeciesSprite` falls back silently, which is right for drawing
 * and useless for **deciding**: a dex wanting to show the two forms
 * side by side would otherwise show the same picture twice. This asks
 * for the female drawing and nothing else, so a species without one
 * answers no rather than answering with its ordinary sheet
 */
export async function hasFemaleSheet(species: Species, shiny = false): Promise<boolean> {
  return (await sheet(species, shiny, true)) != null;
}

/** The list, for anything that wants to read it rather than draw. */
export async function drawnCoats(): Promise<SpriteCoats | null> {
  return coats();
}

export default async function loadSpeciesSprite(
  species: Species,
  request: SpriteRequest = {},
): Promise<SpeciesSpriteAnimation | null> {
  const shiny = request.shiny === true;
  const female = request.female === true;
  /**
   * What to try, best first.
   *
   * Two things can be missing and they are not worth the same. A
   * **coat** is the whole colour of the pokemon and a player looking
   * for a shiny is looking for exactly that, so it is kept as long as
   * there is any drawing carrying it; a **form** is a flower or a tail
   * a few species differ by, and losing it costs a detail rather than
   * the point. So the shiny form is asked for first, then the shiny
   * without it, and only then the ordinary coat
   */
  const wanted: [Species, boolean, boolean][] = [];

  if (shiny) {
    if (female) {
      wanted.push([species, true, true]);
    }
    wanted.push([species, true, false]);
  }
  if (female) {
    wanted.push([species, false, true]);
  }
  wanted.push([species, false, false]);

  if (request.fallback !== false) {
    wanted.push([FALLBACK_SPECIES, false, false]);
  }

  for (const [wantedSpecies, wantedShiny, wantedFemale] of wanted) {
    const loaded = await sheet(wantedSpecies, wantedShiny, wantedFemale);

    if (loaded != null) {
      return loaded.clone();
    }
  }
  return null;
}
