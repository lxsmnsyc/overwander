import type { InventoryEntry } from '../../../auth/inventory';
import { carveApricorns } from '../../../auth/npcs';
import { type Items, getApricornBall } from '../../../data/ids/items';
import { getItemData } from '../../../data/items';
import { describeItem } from '../../../components/details';
import { PickItemForm } from '../../../components/forms/pick-item';
import ItemSprite from '../../../components/items/ItemSprite';
import { Detail, Meta } from '../../../components/styled';
import { m } from '../../../i18n/paraglide/messages.js';
import type { NpcScript } from '../create';

/** What an apricorn becomes */
function ballName(item: Items): string {
  const ball = getApricornBall(item);

  return ball == null ? '' : getItemData(ball).name;
}

/**
 * Kurt at his lathe: a basket of one colour in, the ball that colour
 * makes out. He charges nothing and the colour settles which ball, so
 * how many is the only thing left to decide
 */
const kurt: NpcScript = async (visit) => {
  for (;;) {
    const apricorns: InventoryEntry[] = [];
    let carrying = 0;

    for (const entry of await visit.bag()) {
      if (getApricornBall(entry.item) != null && entry.amount > 0) {
        apricorns.push(entry);
        carrying += entry.amount;
      }
    }

    const pick = await visit.form(PickItemForm, {
      player: visit.player,
      verb: m.npc_kurt_action(),
      entries: apricorns,
      none: m.npc_kurt_none(),
      step: m.npc_kurt_step(),
      have: { amount: carrying, short: carrying === 0, unit: m.npc_unit_apricorns() },
      counts: true,
      note: (entry) => ballName(entry.item),
      card: (entry) => <Detail label={m.npc_kurt_becomes()}>{ballName(entry.item)}</Detail>,
      most: (entry) => entry.amount,
      sum: (item, amount) => (
        <Meta>
          {m.npc_kurt_sum({ amount, item: describeItem(item) })}{' '}
          <strong>{m.npc_kurt_sum_result({ amount, ball: ballName(item) })}</strong>
        </Meta>
      ),
    });

    if (pick == null) {
      return;
    }

    const [item, amount] = pick;
    const done = await carveApricorns(visit.snapshot, visit.cell, item, amount);

    if (done == null) {
      await visit.say(m.npc_kurt_refused());
      continue;
    }
    visit.notify({
      title:
        done.amount > 1
          ? m.npc_name_times({ name: getItemData(done.ball).name, amount: done.amount })
          : getItemData(done.ball).name,
      message: m.npc_kurt_toast({ amount, item: describeItem(item) }),
      art: () => <ItemSprite item={done.ball} size={24} label="" />,
      tone: 'leaf',
    });
    visit.changed();
    await visit.say(m.npc_kurt_done());
  }
};

export default kurt;
