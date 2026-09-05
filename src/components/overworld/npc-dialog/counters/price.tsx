import type { JSX } from 'solid-js';
import type { Items } from '../../../../data/ids/items';
import ItemSprite from '../../../items/ItemSprite';
import { Badge, Row } from '../../../styled';

/**
 * What a counter that works for heart scales is being paid, drawn
 * rather than spelled out: the bag draws it the same way.
 *
 * It says what is in the bag rather than what the counter charges,
 * since every one of them charges one and the question a player has
 * is whether they can afford it. Green while they can, red when the
 * bag is empty
 */
export default function Price(props: { fee: Items; scales: number }): JSX.Element {
  return (
    <Row>
      <Badge tone={props.scales > 0 ? 'leaf' : 'ember'}>
        <ItemSprite item={props.fee} size={20} label="" />
        {props.scales} Heart {props.scales === 1 ? 'Scale' : 'Scales'}
      </Badge>
    </Row>
  );
}
