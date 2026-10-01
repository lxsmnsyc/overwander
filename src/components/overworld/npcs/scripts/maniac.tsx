import { buyFossil } from '../../../../auth/npcs';
import { getFossilPrice } from '../../../../data/overworld/fossil';
import playEffect, { Effect } from '../../../app/sound';
import { describeItem } from '../../../details';
import { PickItemForm } from '../../../forms/pick-item';
import ItemSprite from '../../../items/ItemSprite';
import { Detail } from '../../../styled';
import { goldHeld } from '../shared';
import type { NpcScript } from '../visit';

/**
 * The fossil maniac: two rocks, and he will part with one. What he
 * carries is derived from the window, and the server derives it again
 */
const maniac: NpcScript = async (visit) => {
  const gold = await visit.gold();
  const offer = visit.snapshot.getFossilOffer(visit.cell);
  const entries = [];

  for (const item of offer) {
    entries.push({ user: visit.player, item, amount: 1 });
  }

  // He sells the dig, not the pokemon, so nothing says what is inside
  const pick = await visit.form(PickItemForm, {
    player: visit.player,
    verb: 'Buy',
    entries,
    step: 'Choose a rock',
    none: 'He has nothing on him just now.',
    have: goldHeld(gold),
    counts: false,
    note: (entry) => `${getFossilPrice(entry.item)} gold`,
    blocked: (entry) => (getFossilPrice(entry.item) > gold ? 'More than you hold' : null),
    card: (entry) => <Detail label="Costs">{getFossilPrice(entry.item)} gold</Detail>,
  });

  if (pick == null) {
    return;
  }

  const [item] = pick;

  if ((await buyFossil(visit.snapshot, visit.cell, item)) == null) {
    await visit.say('I will keep it. A short purse, or you have had my one this while.');
    return;
  }
  playEffect(Effect.ShopBuy);
  visit.notify({
    title: describeItem(item),
    message: `−${getFossilPrice(item)} gold`,
    art: () => <ItemSprite item={item} size={24} label="" />,
    tone: 'leaf',
  });
  visit.changed();
  await visit.say('A beauty. Take good care of it!');
};

export default maniac;
