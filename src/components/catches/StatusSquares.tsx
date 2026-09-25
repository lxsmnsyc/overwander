import { For, type JSX, Show } from 'solid-js';
import { STATUS_NAMES } from '../../auth/health';
import { unpackStatuses } from '../../data/ids/status';
import { STATUS_COLORS } from '../battle/UnitCard';
import { TooltipHost } from '../styled';

/**
 * The statuses a catch walked out of its last fight with, as the
 * coloured squares the battle draws them as. Each is named in a
 * tooltip and to a screen reader, since a colour alone says nothing
 */
export default function StatusSquares(props: { statuses: number }): JSX.Element {
  return (
    <Show when={unpackStatuses(props.statuses).length > 0}>
      <span class="flex shrink-0 items-center gap-0.5">
        <For each={unpackStatuses(props.statuses)}>
          {(status) => (
            <TooltipHost class="inline-flex" name={STATUS_NAMES[status]}>
              <span
                class="size-2.5 rounded-[2px]"
                style={{ 'background-color': STATUS_COLORS[status] }}
                role="img"
                aria-label={STATUS_NAMES[status]}
              />
            </TooltipHost>
          )}
        </For>
      </span>
    </Show>
  );
}
