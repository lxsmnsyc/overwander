import type { JSX } from 'solid-js';
import type { Items } from '../../../../data/ids/items';
import ItemSprite from '../../../items/ItemSprite';
import { Row } from '../../../styled';

/**
 * What a Heart Scale counter charges, and whether the bag can pay it.
 * Every one of them charges one, so the count carried turns ember at none
 */
export default function FeeLine(props: { fee: Items; scales: number }): JSX.Element {
  return (
    <Row class="justify-center gap-1.5 text-sm">
      <span class="text-xs font-semibold text-muted uppercase">Fee</span>
      <ItemSprite item={props.fee} size={20} label="" />
      <span>1 Heart Scale</span>
      <span class={props.scales > 0 ? 'text-muted' : 'font-semibold text-ember-dark'}>
        · you have {props.scales}
      </span>
    </Row>
  );
}
