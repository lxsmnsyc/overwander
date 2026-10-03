import { type JSX, Show, createResource } from 'solid-js';
import {
  type BoxRecord,
  DEFAULT_BOX_NAME,
  DEFAULT_BOX_TONE,
  boxTone,
  fileCatches,
  listBoxes,
} from '../../../../auth/boxes';
import createClientSignal from '../../../app/client-signal';
import { answered } from '../../../app/resource-reads';
import { Menu, type MenuAction } from '../../../styled';

/**
 * Which box a pokemon is filed in, beside its name, and the menu that
 * files it somewhere else. Drawn only for a player who has made a box:
 * until then everything is in Default and there is nowhere to move it.
 */
export interface BoxChipProps {
  player: string;
  catchId: string;
  /** The box it is in now, or null for Default */
  box: string | null;
  /** Bumped when anything changes, so the boxes are read again */
  revision: unknown;
  onMoved: (message: string) => void;
  onFailed: (message: string) => void;
}

export default function BoxChip(props: BoxChipProps): JSX.Element {
  const client = createClientSignal();
  const [boxes] = createResource(
    () => client() && ([props.player, props.revision] as const),
    async ([player]): Promise<[string, BoxRecord][]> => listBoxes(player),
  );

  /** The declaring body, so this never waits: no chip until they are read */
  const made = (): [string, BoxRecord][] => answered(boxes) ?? [];

  const here = (): { name: string; tone: string } => {
    for (const [id, box] of made()) {
      if (id === props.box) {
        return { name: box.name, tone: boxTone(box.colour) };
      }
    }
    return { name: DEFAULT_BOX_NAME, tone: DEFAULT_BOX_TONE };
  };

  const move = (box: string | null, name: string): void => {
    fileCatches([props.catchId], box)
      .then((outcome) => {
        if (outcome.done.length === 0) {
          props.onFailed('It could not be moved.');
          return;
        }
        props.onMoved(`Moved to ${name}.`);
      })
      .catch((caught: unknown) => {
        props.onFailed(caught instanceof Error ? caught.message : String(caught));
      });
  };

  const actions = (): MenuAction[] => {
    const listed: MenuAction[] = [
      {
        label: props.box == null ? `${DEFAULT_BOX_NAME} (here now)` : DEFAULT_BOX_NAME,
        disabled: props.box == null,
        onSelect: () => {
          move(null, DEFAULT_BOX_NAME);
        },
      },
    ];

    for (const [id, box] of made()) {
      listed.push({
        label: id === props.box ? `${box.name} (here now)` : box.name,
        disabled: id === props.box,
        onSelect: () => {
          move(id, box.name);
        },
      });
    }
    return listed;
  };

  return (
    <Show when={made().length > 0}>
      <span class="inline-flex items-center gap-1.5">
        <span
          aria-hidden="true"
          class="size-2.5 shrink-0 rounded-sm"
          style={{ background: here().tone }}
        />
        <Menu label={`In ${here().name}`} actions={actions()} />
      </span>
    </Show>
  );
}
