import type { JSX } from 'solid-js';
import { Hint, HintList } from '../../styled';
import { m } from '../../../i18n/paraglide/messages.js';

/** What the bag's pockets hold and what pressing does, for the dialog's title bar */
export default function BagHint(): JSX.Element {
  return (
    <Hint title={m.item_bag_help()}>
      <HintList>
        <li>{m.item_bag_help_use()}</li>
        <li>{m.item_bag_help_medicine()}</li>
        <li>{m.item_bag_help_held()}</li>
        <li>{m.item_bag_help_machines()}</li>
        <li>{m.item_bag_help_training()}</li>
        <li>{m.item_bag_help_fossils()}</li>
        <li>{m.item_bag_help_candies()}</li>
      </HintList>
    </Hint>
  );
}
