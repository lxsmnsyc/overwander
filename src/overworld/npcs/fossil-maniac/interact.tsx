import { buyFossil } from '../../../auth/npcs';
import { getFossilPrice } from '../../../data/overworld/fossil';
import playEffect, { Effect } from '../../../components/app/sound';
import { describeItem } from '../../../components/details';
import { PickItemForm } from '../../../components/forms/pick-item';
import ItemSprite from '../../../components/items/ItemSprite';
import { Detail } from '../../../components/styled';
import { formatNumber } from '../../../i18n/format';
import { m } from '../../../i18n/paraglide/messages.js';
import { goldHeld } from '../shared';
import type { NpcScript } from '../create';

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
    verb: m.npc_buy(),
    entries,
    step: m.npc_maniac_step(),
    none: m.npc_maniac_none(),
    have: goldHeld(gold),
    counts: false,
    note: (entry) => m.ui_gold({ amount: formatNumber(getFossilPrice(entry.item)) }),
    blocked: (entry) => (getFossilPrice(entry.item) > gold ? m.npc_more_than_held() : null),
    card: (entry) => (
      <Detail label={m.npc_costs()}>
        {m.ui_gold({ amount: formatNumber(getFossilPrice(entry.item)) })}
      </Detail>
    ),
  });

  if (pick == null) {
    return;
  }

  const [item] = pick;

  if ((await buyFossil(visit.snapshot, visit.cell, item)) == null) {
    await visit.say(m.npc_maniac_refused());
    return;
  }
  playEffect(Effect.ShopBuy);
  visit.notify({
    title: describeItem(item),
    message: m.npc_gold_spent({ amount: formatNumber(getFossilPrice(item)) }),
    art: () => <ItemSprite item={item} size={24} label="" />,
    tone: 'leaf',
  });
  visit.changed();
  await visit.say(m.npc_maniac_done());
};

export default maniac;
