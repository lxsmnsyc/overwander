import type { InventoryEntry } from '../../auth/inventory';
import { carveApricorns } from '../../auth/npcs';
import { type Items, getApricornBall } from '../../data/ids/items';
import { getItemData } from '../../data/items';
import { describeItem } from '../../components/details';
import { PickItemForm } from '../../components/forms/pick-item';
import ItemSprite from '../../components/items/ItemSprite';
import { Detail, Meta } from '../../components/styled';
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
      verb: 'Carve',
      entries: apricorns,
      none: 'You are carrying nothing he can carve.',
      step: 'Choose an apricorn',
      have: { amount: carrying, short: carrying === 0, unit: 'apricorns' },
      counts: true,
      note: (entry) => ballName(entry.item),
      card: (entry) => <Detail label="Becomes">{ballName(entry.item)}</Detail>,
      most: (entry) => entry.amount,
      sum: (item, amount) => (
        <Meta>
          {amount} × {describeItem(item)} ={' '}
          <strong>
            {amount} {ballName(item)}
          </strong>
        </Meta>
      ),
    });

    if (pick == null) {
      return;
    }

    const [item, amount] = pick;
    const done = await carveApricorns(visit.snapshot, visit.cell, item, amount);

    if (done == null) {
      await visit.say('Hm. These are not in your basket any more.');
      continue;
    }
    visit.notify({
      title: `${getItemData(done.ball).name}${done.amount > 1 ? ` ×${done.amount}` : ''}`,
      message: `−${amount} ${describeItem(item)}`,
      art: () => <ItemSprite item={done.ball} size={24} label="" />,
      tone: 'leaf',
    });
    visit.changed();
    await visit.say('There you are. Good, honest balls, every one.');
  }
};

export default kurt;
