import { type JSX, Match, Show, Switch, createSignal } from 'solid-js';
import type { BoxLayout } from '../../../auth/boxes';
import { ActionsIcon, PlusIcon } from '../../icons';
import { Badge, Button, Menu, Meta, Row, Select } from '../../styled';
import BoxForm from './box-form';
import type { RailBox } from './rail';
import { m } from '../../../i18n/paraglide/messages.js';
import { joinSentences } from '../../../i18n/format';

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
      return props.id == null
        ? m.catch_heading_picking()
        : joinSentences([m.catch_heading_picking(), m.catch_heading_picking_place()]);
    }
    if (props.id == null) {
      return m.catch_heading_default({ count: props.count });
    }
    if (props.count === 0) {
      return m.catch_heading_empty();
    }
    if (gaps() === 0) {
      return m.catch_heading_count({ count: props.count });
    }
    return joinSentences([
      m.catch_heading_slots({ count: props.count, span: props.span }),
      m.catch_heading_gaps({ gaps: gaps() }),
    ]);
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
                {m.catch_heading_built_in()}
              </Badge>
            </Show>
          </div>
          <Meta>{fill()}</Meta>
        </div>
        <div class="flex shrink-0 items-center gap-2">
          <Show when={props.id != null && props.count === 0 && !props.selecting}>
            <Button tone="accent" disabled={props.busy} onClick={props.onAdd}>
              <PlusIcon class="size-4" aria-hidden="true" />
              {m.catch_heading_add()}
            </Button>
          </Show>
          <Show when={props.id != null}>
            <Menu
              label={m.catch_heading_menu({ name: props.name })}
              icon={ActionsIcon}
              actions={[
                {
                  label: m.catch_heading_rename(),
                  onSelect: () => {
                    setAsking('edit');
                  },
                },
                {
                  label: m.catch_heading_change_colour(),
                  onSelect: () => {
                    setAsking('colour');
                  },
                },
                {
                  label: m.catch_heading_lay_out(),
                  hint: m.catch_heading_lay_out_hint(),
                  separated: true,
                  disabled: props.busy || props.count === 0,
                  onSelect: () => {
                    props.onLayOut('dex');
                  },
                },
                {
                  label: m.catch_heading_close_up(),
                  hint: m.catch_heading_close_up_hint(),
                  disabled: props.busy || gaps() === 0,
                  onSelect: () => {
                    props.onLayOut('packed');
                  },
                },
                {
                  label: m.catch_heading_move_all({ count: props.count }),
                  disabled: props.busy || props.count === 0,
                  onSelect: () => {
                    setTo(TO_DEFAULT);
                    setAsking('empty');
                  },
                },
                {
                  label: m.catch_heading_delete(),
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
              heading={
                asking() === 'edit'
                  ? m.catch_heading_rename_box({ name: props.name })
                  : m.catch_heading_colour_of({ name: props.name })
              }
              name={props.name}
              colour={props.colour}
              verb={m.catch_heading_save()}
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
              label={m.catch_heading_move_all_to({ count: props.count })}
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
              {m.catch_heading_move_them()}
            </Button>
            <Button
              onClick={() => {
                setAsking(null);
              }}
            >
              {m.ui_never_mind()}
            </Button>
          </Row>
        </Match>
        {/* Two presses, since a box is not made back as easily as it is
            lost. What was in it is safe either way */}
        <Match when={asking() === 'delete'}>
          <Row class="items-center">
            <Meta>{m.catch_heading_delete_ask({ name: props.name, count: props.count })}</Meta>
            <Button
              tone="danger"
              disabled={props.busy}
              onClick={() => {
                setAsking(null);
                props.onDelete();
              }}
            >
              {m.catch_heading_delete_it()}
            </Button>
            <Button
              onClick={() => {
                setAsking(null);
              }}
            >
              {m.catch_heading_keep_it()}
            </Button>
          </Row>
        </Match>
      </Switch>
    </div>
  );
}
