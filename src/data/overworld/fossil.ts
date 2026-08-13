import { Items } from '../ids/items';
import { listFossils } from '../items/fossils';

/**
 * The two people a fossil passes through.
 *
 * The **Fossil Maniac** sells them. He is the only place in the game
 * a fossil can be bought, and he carries two of the three: which two
 * is the window's, so a player after a particular one waits for it or
 * walks somewhere else. He deals with a player once while he is
 * standing there — a maniac who sold three fossils an hour would make
 * the dig pointless.
 *
 * The **Fossil Scientist** revives them, and is deliberately **not**
 * once a window. He takes nothing but the fossil itself, so what
 * paces him is how many fossils a player is carrying; turning away
 * the second of two already dug up would only be a walk to the next
 * cell to do the same thing.
 *
 * What comes out is decided by the fossil rather than by him — see
 * [`FOSSIL_SPECIES`](../items/fossils.ts) — and comes out at
 * `FOSSIL_REVIVE_LEVEL`, the same for everybody who brought the same
 * rock.
 */

/**
 * How many of the three the maniac is carrying. Two, so what he
 * offers is a choice rather than an announcement, and never all of
 * them: a window that could sell a player the whole set would leave
 * nothing for the next one to be worth stopping at
 */
export const FOSSIL_OFFER_KINDS = 2;

/**
 * What he charges for each. Dear, because a fossil is a species the
 * world does not spawn at all any more, and the amber dearer still:
 * Aerodactyl was the rarest thing on the mountain when the mountain
 * still had one
 */
export const FOSSIL_PRICES = new Map<Items, number>([
  [Items.HelixFossil, 12_000],
  [Items.DomeFossil, 12_000],
  [Items.OldAmber, 30_000],
]);

/**
 * What one costs him to part with, or zero for anything he does not
 * deal in
 */
export function getFossilPrice(item: Items): number {
  return FOSSIL_PRICES.get(item) ?? 0;
}

/**
 * What comes out of the bench. Level 20 is where the mainline games
 * have revived a fossil since the first of them, and it is fixed
 * rather than rolled so the same rock is worth the same to everybody
 * who carried one in
 */
export const FOSSIL_REVIVE_LEVEL = 20;

/**
 * Which two this maniac is carrying, drawn without repeats.
 *
 * The draw is the caller's, the way the vendor's crate is, which is
 * what makes the offer derived rather than stored: every player who
 * reaches the same maniac in the same window is shown the same two
 */
export function rollFossilOffer(random: () => number): Items[] {
  const rest = listFossils();
  const offer: Items[] = [];

  while (offer.length < FOSSIL_OFFER_KINDS && rest.length > 0) {
    offer.push(...rest.splice(Math.floor(random() * rest.length), 1));
  }
  return offer;
}
