import { APRICORNS, ItemTypes, Items, getApricornBall } from '../ids/items';
import { getItemData, registerItem } from './__create';

/**
 * The seven apricorns.
 *
 * Each is picked off a tree and carried to Kurt, who carves it into
 * the one ball its colour makes. That is the whole of what an
 * apricorn does, so none of them is usable, held, or worth anything
 * to a vendor: an apricorn is a ball nobody has carved yet.
 */

/** What each colour is called, which is also how its icon is filed. */
const COLOURS: Partial<Record<Items, string>> = {
  [Items.RedApricorn]: 'red',
  [Items.BlueApricorn]: 'blue',
  [Items.YellowApricorn]: 'yellow',
  [Items.GreenApricorn]: 'green',
  [Items.PinkApricorn]: 'pink',
  [Items.WhiteApricorn]: 'white',
  [Items.BlackApricorn]: 'black',
};

/** An apricorn's name, from the colour it is filed under. */
function apricornName(colour: string): string {
  return `${colour.slice(0, 1).toUpperCase()}${colour.slice(1)} Apricorn`;
}

export default function registerApricorns(): void {
  for (const item of APRICORNS) {
    const colour = COLOURS[item] ?? 'red';
    const ball = getApricornBall(item);

    registerItem(item, {
      name: apricornName(colour),
      type: ItemTypes.Evolution,
      // The one thing it is for, named: an apricorn nobody can carve
      // is a fruit, and which ball it makes is the only reason to
      // pick one over another
      description: `Kurt carves this one into a ${ball == null ? 'ball' : getItemData(ball).name}.`,
      icon: `apricorn/${colour}`,
      // No flag at all: nothing holds one, nothing uses one in the
      // field, and no counter lists one. It is carried to somebody
      flags: 0,
      buy: 0,
      sell: 0,
    });
  }
}
