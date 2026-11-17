import { type JSX, Show } from 'solid-js';
import { PlayerFace } from '../../profile/PlayerPlate';
import { Meta, Pill } from '../../styled';
import { m } from '../../../i18n/paraglide/messages.js';

/**
 * A seat across the field: a white card holding the trainer's face,
 * name and seat number, then their party, then what can be done with
 * the seat (the team, the Ready stamp). The seat beside it faces it
 * across the VS mark.
 */
const SEAT =
  'flex min-w-0 flex-col gap-2 rounded-2xl border-2 border-line bg-paper/95 p-3' +
  ' shadow-[0_4px_0_rgb(20_32_58/0.18)]';

/** The ready stamp's shape, and how a ready one is coloured */
export const STAMP =
  'inline-flex h-[26px] shrink-0 items-center rounded-full border-2 px-2.5 text-[11px]' +
  ' font-extrabold';
export const STAMP_READY = 'border-leaf-dark bg-leaf text-on-accent';
export const STAMP_AT_REST = 'border-line bg-paper text-muted';

export interface FilledSeatProps {
  sprite: string | null;
  /** The trainer, as the reader sees them: "You", or a name that opens their profile */
  name: JSX.Element;
  host: boolean;
  seat: number;
  /** The party, drawn by the caller */
  party: JSX.Element;
  /** The team button and the Ready stamp */
  footer: JSX.Element;
}

export function FilledSeat(props: FilledSeatProps): JSX.Element {
  return (
    <div class={SEAT}>
      <div class="flex min-w-0 items-center gap-2">
        <PlayerFace sprite={props.sprite} size={36} />
        <span class="min-w-0 truncate text-sm font-extrabold">{props.name}</span>
        <Show when={props.host}>
          <Pill tone="tide">{m.duels_host_tag()}</Pill>
        </Show>
        <span class="grow" />
        <Meta class="shrink-0">{m.duels_seat({ seat: props.seat })}</Meta>
      </div>
      {props.party}
      <div class="flex flex-wrap items-center gap-1.5">{props.footer}</div>
    </div>
  );
}

/** A seat nobody sits in: a dashed card that says so */
export function OpenSeat(props: { seat: number; children?: JSX.Element }): JSX.Element {
  return (
    <div
      class="flex min-h-[170px] min-w-0 flex-col items-center justify-center gap-1.5 rounded-2xl
        border-2 border-dashed border-line bg-paper/90 p-3 text-center"
    >
      <span class="text-sm font-extrabold">{m.duels_seat_open({ seat: props.seat })}</span>
      <Meta>{m.duels_seat_waiting()}</Meta>
      {props.children}
    </div>
  );
}
