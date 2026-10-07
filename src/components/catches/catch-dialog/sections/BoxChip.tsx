import { type JSX, Show, createResource, createSignal } from 'solid-js';
import {
  type BoxRecord,
  DEFAULT_BOX_NAME,
  DEFAULT_BOX_TONE,
  boxTone,
  fileCatches,
  listBoxes,
  makeBox,
} from '../../../../auth/boxes';
import createClientSignal from '../../../app/client-signal';
import { answered } from '../../../app/resource-reads';
import { BoxIcon } from '../../../icons';
import { Dialog, Menu, type MenuAction } from '../../../styled';
import BoxForm from '../../catches-list/box-form';

/**
 * Which box a pokemon is filed in, beside its name, and the menu that
 * files it somewhere else or into a box made on the spot. Drawn for a
 * player with no box yet too: Default is a box, and New box is how a
 * second one starts.
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
  const [made, setMade] = createSignal(0);
  const [boxes] = createResource(
    () => client() && ([props.player, props.revision, made()] as const),
    async ([player]): Promise<[string, BoxRecord][]> => listBoxes(player),
  );
  /** Whether the name and colour of a new box are being asked for */
  const [making, setMaking] = createSignal(false);
  const [busy, setBusy] = createSignal(false);

  /** The declaring body, so this never waits: Default until they are read */
  const listed = (): [string, BoxRecord][] => answered(boxes) ?? [];

  const here = (): { name: string; tone: string } => {
    for (const [id, box] of listed()) {
      if (id === props.box) {
        return { name: box.name, tone: boxTone(box.colour) };
      }
    }
    return { name: DEFAULT_BOX_NAME, tone: DEFAULT_BOX_TONE };
  };

  const failed = (caught: unknown): void => {
    props.onFailed(caught instanceof Error ? caught.message : String(caught));
  };

  const move = (box: string | null, name: string): void => {
    // Where it already is: the tick says so, and nothing needs doing
    if (box === props.box) {
      return;
    }
    fileCatches([props.catchId], box)
      .then((outcome) => {
        if (outcome.done.length === 0) {
          props.onFailed('It could not be moved.');
          return;
        }
        props.onMoved(`Moved to ${name}.`);
      })
      .catch(failed);
  };

  const make = (name: string, colour: number): void => {
    setBusy(true);
    makeBox(name, colour, [props.catchId])
      .then((id) => {
        if (id == null) {
          props.onFailed('The box could not be made.');
          return;
        }
        setMaking(false);
        setMade((count) => count + 1);
        props.onMoved(`Made ${name} and moved it there.`);
      })
      .catch(failed)
      .finally(() => {
        setBusy(false);
      });
  };

  const actions = (): MenuAction[] => {
    const entries: MenuAction[] = [
      {
        label: DEFAULT_BOX_NAME,
        swatch: DEFAULT_BOX_TONE,
        checked: props.box == null,
        onSelect: () => {
          move(null, DEFAULT_BOX_NAME);
        },
      },
    ];

    for (const [id, box] of listed()) {
      entries.push({
        label: box.name,
        swatch: boxTone(box.colour),
        checked: id === props.box,
        onSelect: () => {
          move(id, box.name);
        },
      });
    }
    entries.push({
      label: 'New box…',
      separated: true,
      onSelect: () => {
        setMaking(true);
      },
    });
    return entries;
  };

  return (
    <>
      <Menu
        label={`In ${here().name}. Move to another box`}
        heading="Move to"
        actions={actions()}
        face={
          <span class="inline-flex items-center gap-1.5">
            <BoxIcon class="size-4 shrink-0 text-tide-dark" aria-hidden="true" />
            <span
              aria-hidden="true"
              class="size-2.5 shrink-0 rounded-[3px]"
              style={{ background: here().tone }}
            />
            {here().name}
          </span>
        }
      />
      <Show when={making()}>
        <Dialog
          isOpen={making()}
          onClose={() => {
            setMaking(false);
          }}
          title="New box"
          description="Name it and pick a colour. This pokemon goes in it."
        >
          <BoxForm
            verb="Make it"
            busy={busy()}
            onSubmit={make}
            onCancel={() => {
              setMaking(false);
            }}
          />
        </Dialog>
      </Show>
    </>
  );
}
