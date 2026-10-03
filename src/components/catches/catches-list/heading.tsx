import { type JSX, Match, Show, Switch, createSignal } from 'solid-js';
import type { BoxLayout } from '../../../auth/boxes';
import { ActionsIcon, PlusIcon } from '../../icons';
import { Badge, Button, Menu, Meta, Row, Select } from '../../styled';
import BoxForm from './box-form';
import type { RailBox } from './rail';

/**
 * The name over the box showing, how full it is, and what can be done
 * to the box as a whole. Default is built in and has nothing in its
 * menu to do: it cannot be renamed or deleted, and keeps no squares to
 * lay out.
 */
export interface BoxHeadingProps {
  name: string;
  tone: string;
  /** Its id, or null for Default */
  id: string | null;
  colour: number;
  count: number;
  /** One past its last filled square, which is how many squares it spans */
  span: number;
  /** Every box, for moving everything out of this one */
  boxes: RailBox[];
  busy: boolean;
  onEdit: (name: string, colour: number) => void;
  onLayOut: (layout: BoxLayout) => void;
  onEmpty: (to: string | null) => void;
  onDelete: () => void;
  /** Whether presses pick, which changes what the line under the name says */
  selecting: boolean;
  /** Open the picker that fills this box from every other */
  onAdd: () => void;
}

/** What the heading is asking about, if anything, under the name */
type Asking = 'edit' | 'colour' | 'empty' | 'delete' | null;

/** The destination value for Default, which no box id can be */
const TO_DEFAULT = '';

export default function BoxHeading(props: BoxHeadingProps): JSX.Element {
  const [asking, setAsking] = createSignal<Asking>(null);
  const [to, setTo] = createSignal(TO_DEFAULT);

  const gaps = (): number => Math.max(0, props.span - props.count);

  /** What the line under the name says about how full the box is */
  const fill = (): string => {
    if (props.selecting) {
      return 'Press to pick. Shift-press picks a run, and a picked set carries across pages and searches.';
    }
    const pokemon = `${props.count} pokemon`;

    if (props.id == null) {
      return `${pokemon}. Anything not filed in a box waits here, and new catches land here first.`;
    }
    if (props.count === 0) {
      return 'Empty for now';
    }
    if (gaps() === 0) {
      return `${pokemon}.`;
    }
    return `${pokemon} over ${props.span} slots. ${gaps()} gap${gaps() === 1 ? '' : 's'} left to fill.`;
  };

  const destinations = (): { value: string; label: string }[] => {
    const options: { value: string; label: string }[] = [];

    for (const box of props.boxes) {
      if (box.id !== props.id) {
        options.push({ value: box.id ?? TO_DEFAULT, label: box.name });
      }
    }
    return options;
  };

  return (
    <div class="flex flex-col gap-2">
      <div class="flex items-end justify-between gap-3">
        <div class="flex min-w-0 flex-col gap-0.5">
          <div class="flex items-center gap-2.5">
            {/* Default is the box everything starts in, and wears no colour of its own */}
            <Show when={props.id != null}>
              <span class="size-4 shrink-0 rounded-[5px]" style={{ background: props.tone }} />
            </Show>
            <h3 class="m-0 truncate text-2xl font-black">{props.name}</h3>
            <Show when={props.id == null}>
              <Badge tone="tide" class="tracking-wide uppercase">
                Built in
              </Badge>
            </Show>
          </div>
          <Meta>{fill()}</Meta>
        </div>
        <div class="flex shrink-0 items-center gap-2">
          <Show when={props.id != null && props.count === 0 && !props.selecting}>
            <Button tone="accent" disabled={props.busy} onClick={props.onAdd}>
              <PlusIcon class="size-4" aria-hidden="true" />
              Add pokemon
            </Button>
          </Show>
          <Show when={props.id != null}>
            <Menu
              label={`${props.name} menu`}
              icon={ActionsIcon}
              actions={[
                {
                  label: 'Rename',
                  onSelect: () => {
                    setAsking('edit');
                  },
                },
                {
                  label: 'Change colour',
                  onSelect: () => {
                    setAsking('colour');
                  },
                },
                {
                  label: 'Lay out by dex number',
                  hint: 'Puts each pokemon in the slot of its number',
                  separated: true,
                  disabled: props.busy || props.count === 0,
                  onSelect: () => {
                    props.onLayOut('dex');
                  },
                },
                {
                  label: 'Close up the gaps',
                  hint: 'Slides everything forward, keeping its order',
                  disabled: props.busy || gaps() === 0,
                  onSelect: () => {
                    props.onLayOut('packed');
                  },
                },
                {
                  label: `Move all ${props.count} to another box`,
                  disabled: props.busy || props.count === 0,
                  onSelect: () => {
                    setTo(TO_DEFAULT);
                    setAsking('empty');
                  },
                },
                {
                  label: 'Delete box',
                  tone: 'danger',
                  separated: true,
                  disabled: props.busy,
                  onSelect: () => {
                    setAsking('delete');
                  },
                },
              ]}
            />
          </Show>
        </div>
      </div>

      <Switch>
        <Match when={asking() === 'edit' || asking() === 'colour'}>
          <div class="max-w-sm">
            <BoxForm
              heading={asking() === 'edit' ? `Rename ${props.name}` : `Colour of ${props.name}`}
              name={props.name}
              colour={props.colour}
              verb="Save"
              busy={props.busy}
              onSubmit={(name, colour) => {
                setAsking(null);
                props.onEdit(name, colour);
              }}
              onCancel={() => {
                setAsking(null);
              }}
            />
          </div>
        </Match>
        <Match when={asking() === 'empty'}>
          <Row class="items-end">
            <Select
              label={`Move all ${props.count} to`}
              value={to()}
              options={destinations()}
              onChange={(value) => {
                setTo(value);
              }}
            />
            <Button
              tone="primary"
              disabled={props.busy}
              onClick={() => {
                setAsking(null);
                props.onEmpty(to() === TO_DEFAULT ? null : to());
              }}
            >
              Move them
            </Button>
            <Button
              onClick={() => {
                setAsking(null);
              }}
            >
              Never mind
            </Button>
          </Row>
        </Match>
        {/* Two presses, since a box is not made back as easily as it is
            lost. What was in it is safe either way */}
        <Match when={asking() === 'delete'}>
          <Row class="items-center">
            <Meta>
              Delete {props.name}? Its {props.count} pokemon go back to Default.
            </Meta>
            <Button
              tone="danger"
              disabled={props.busy}
              onClick={() => {
                setAsking(null);
                props.onDelete();
              }}
            >
              Delete it
            </Button>
            <Button
              onClick={() => {
                setAsking(null);
              }}
            >
              Keep it
            </Button>
          </Row>
        </Match>
      </Switch>
    </div>
  );
}
