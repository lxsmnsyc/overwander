import { onCleanup } from 'solid-js';
import createLongPressGesture, { type LongPress } from '../../canvas/long-press';

export type { LongPress } from '../../canvas/long-press';

/** The hold gesture for a component, dropped with the component that made it */
export default function createLongPress(open: () => void): LongPress {
  const press = createLongPressGesture(open);

  onCleanup(press.cancel);
  return press;
}
