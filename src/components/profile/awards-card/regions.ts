import Awards, {
  FRONTIER_SYMBOLS,
  HOENN_BADGES,
  HOENN_HONORS,
  JOHTO_BADGES,
  JOHTO_HONORS,
  KALOS_BADGES,
  KALOS_HONORS,
  KANTO_BADGES,
  KANTO_HONORS,
  SINNOH_BADGES,
  SINNOH_HONORS,
  UNOVA_BADGES,
  UNOVA_HONORS,
} from '../../../data/ids/awards';
import { SYNDICATE_HONORS } from '../../../data/overworld/syndicate';
import { LEGENDS, LEGEND_HONORS } from '../../../data/overworld/experts';
import { m } from '../../../i18n/paraglide/messages.js';

/**
 * The shelf, one card per region: its badges first, then the marks of
 * its Elite Four, its Champion title and its dex medal, in the order
 * the walk earns them. What belongs to no region's walk (the Frontier,
 * the syndicates and the legends) stands in a card of its own.
 */

export interface AwardRegion {
  name: () => string;
  badges: Awards[];
  /** Elite marks, the Champion title and the dex medal: everything after the badges */
  honors: Awards[];
  champion: Awards | null;
  /** Every award of the card in the order it is drawn */
  all: Awards[];
}

function region(
  name: () => string,
  badges: Awards[],
  honors: Awards[],
  champion: Awards,
  dex: Awards | null,
): AwardRegion {
  return {
    name,
    badges,
    honors,
    champion,
    all: [...badges, ...honors, champion, ...(dex == null ? [] : [dex])],
  };
}

export function readRegions(): AwardRegion[] {
  return [
    region(
      m.dex_region_kanto,
      KANTO_BADGES,
      KANTO_HONORS,
      Awards.KantoChampion,
      Awards.KantoDexMedal,
    ),
    region(
      m.dex_region_johto,
      JOHTO_BADGES,
      JOHTO_HONORS,
      Awards.JohtoChampion,
      Awards.JohtoDexMedal,
    ),
    region(
      m.dex_region_hoenn,
      HOENN_BADGES,
      HOENN_HONORS,
      Awards.HoennChampion,
      Awards.HoennDexMedal,
    ),
    region(
      m.dex_region_sinnoh,
      SINNOH_BADGES,
      SINNOH_HONORS,
      Awards.SinnohChampion,
      Awards.SinnohDexMedal,
    ),
    region(
      m.dex_region_unova,
      UNOVA_BADGES,
      UNOVA_HONORS,
      Awards.UnovaChampion,
      Awards.UnovaDexMedal,
    ),
    region(m.dex_region_kalos, KALOS_BADGES, KALOS_HONORS, Awards.KalosChampion, null),
  ];
}

/** The marks that belong to no region's walk */
export function readElsewhere(): Awards[] {
  const marks: Awards[] = [...FRONTIER_SYMBOLS, ...SYNDICATE_HONORS];

  for (const legend of LEGENDS) {
    marks.push(LEGEND_HONORS[legend]);
  }
  return marks;
}
