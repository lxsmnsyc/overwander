import { For, type JSX, Show, createResource } from 'solid-js';
import readBox from '../../../auth/box';
import type { CaughtPokemon } from '../../../auth/caught';
import { syncServerClock } from '../../../auth/clock';
import type { Items } from '../../../data/ids/items';
import { getItemData } from '../../../data/items';
import { Species } from '../../../data/ids/species';
import { isLockLive } from '../../../model/battle-lock';
import { isShiny } from '../../../model/caught-record';
import { isEgg } from '../../../model/egg';
import { isUsableOn } from '../../../game/items/use-item';
import createClientSignal from '../../app/client-signal';
import { useGame } from '../../app/game-context';
import { answered } from '../../app/resource-reads';
import { describeCatch } from '../../catches/catch-summary';
import { detailItem } from '../../details';
import AnimatedSprite from '../../sprites/AnimatedSprite';
import { Badge, Button, CloseButton } from '../../styled';
import ItemSprite from '../ItemSprite';
import { m } from '../../../i18n/paraglide/messages.js';

/** How many of the pokemon it would help are drawn before the count says the rest */
const HELPED_SHOWN = 6;

/** How big the item is drawn at the top of the panel */
const ART_SIZE = 64;

export interface DetailPanelProps {
  player: string;
  item: Items;
  amount: number;
  /** The pocket it is kept in, by name */
  pocket: string;
  /** The pocket's colour, for the pocket's pill */
  tone: string;
  /** What pressing it does, or nothing for an item with no use from the bag */
  verb: string | null;
  /** Whether it is spent on a pokemon, so the panel says which ones it would help */
  onPokemon: boolean;
  onVerb: () => void;
  onClose: () => void;
}

/**
 * One item docked beside the tray: what it is, how many, what it sells
 * for, the pokemon it would help, and its verb. The verb does what a
 * press on the square used to.
 *
 * On a phone it is a sheet across the foot of the screen instead.
 */
export default function DetailPanel(props: DetailPanelProps): JSX.Element {
  const game = useGame();
  const client = createClientSignal();

  // The same kept box the Use it on picker reads, read again as the
  // records change: no read of its own reaches the server
  const [box] = createResource(
    () => client() && props.onPokemon && ([props.player, game.records()] as const),
    async ([player]): Promise<[CaughtPokemon[], number]> => {
      const [records, now] = await Promise.all([readBox(player), syncServerClock()]);
      const caught: CaughtPokemon[] = [];

      for (const [, record] of records) {
        caught.push(record);
      }
      return [caught, now];
    },
  );

  /**
   * The pokemon it would do some good, by the picker's own rule: none
   * in a battle, and only the ones the item can change. This body
   * declares the resource, so it reads it without waiting
   */
  const helped = (): CaughtPokemon[] | null => {
    const read = answered(box);

    if (read == null) {
      return null;
    }
    const [caught, now] = read;
    const kept: CaughtPokemon[] = [];

    for (const record of caught) {
      if (!isLockLive(record, now) && isUsableOn(props.item, record)) {
        kept.push(record);
      }
    }
    return kept;
  };

  const sells = (): number => {
    try {
      return getItemData(props.item).sell;
    } catch {
      return 0;
    }
  };

  return (
    <aside
      aria-label={detailItem(props.item).name}
      class="motion-crossfade fixed inset-x-0 bottom-0 z-40 flex max-h-[62dvh] flex-col gap-2.5
        overflow-y-auto rounded-t-sheet border-t-2 border-line bg-paper px-4 pt-4 pb-5 shadow-sheet
        animate-[rise-in_var(--motion-move)_var(--ease-spring)_backwards] md:static md:z-auto
        md:max-h-none md:w-[18.75rem] md:shrink-0 md:self-start md:overflow-visible
        md:rounded-none md:border-t-0 md:border-l-2 md:border-line-soft md:bg-transparent md:py-1
        md:pr-0 md:pl-4 md:shadow-none"
    >
      <div class="flex items-start gap-3 md:flex-col md:items-center">
        <span
          class="flex size-16 shrink-0 items-center justify-center rounded-card bg-line-soft
            md:size-24 md:rounded-sheet"
        >
          <ItemSprite item={props.item} size={ART_SIZE} label="" />
        </span>
        <div class="flex min-w-0 grow flex-col gap-1.5 md:w-full">
          <div class="flex items-center gap-2">
            <h3 class="m-0 min-w-0 truncate font-display text-xl leading-tight font-semibold">
              {detailItem(props.item).name}
            </h3>
            <span
              class="inline-flex h-[22px] shrink-0 items-center rounded-full bg-ink px-2 font-display
                text-xs font-semibold text-paper tabular-nums"
            >
              ×{props.amount}
            </span>
            <span class="ml-auto shrink-0">
              <CloseButton
                label={m.item_panel_close({ item: detailItem(props.item).name })}
                onPress={props.onClose}
              />
            </span>
          </div>
          <div class="flex flex-wrap gap-1.5">
            <span
              class="inline-flex h-6 items-center gap-1.5 rounded-full border-2 border-line-soft
                bg-paper px-2 text-xs font-extrabold"
            >
              <span class="size-2.5 rounded-[3px]" style={{ background: props.tone }} />
              {props.pocket}
            </span>
            <Show when={sells() > 0}>
              <Badge tone="gold" class="text-xs">
                {m.item_panel_sells({ price: sells() })}
              </Badge>
            </Show>
          </div>
        </div>
      </div>

      <p class="m-0 text-sm leading-relaxed text-muted">{detailItem(props.item).description}</p>

      <Show when={props.onPokemon}>
        <div class="flex flex-col gap-1.5">
          <span class="text-[11px] font-extrabold tracking-[0.12em] text-muted uppercase">
            {m.item_panel_helps()}
          </span>
          <Show when={helped()}>
            {(kept) => (
              <Show
                when={kept().length > 0}
                fallback={<span class="text-xs text-muted">{m.item_panel_helps_none()}</span>}
              >
                <div class="flex flex-wrap items-center gap-1.5">
                  <For each={kept().slice(0, HELPED_SHOWN)}>
                    {(record) => (
                      <span
                        role="img"
                        aria-label={describeCatch(record)}
                        title={describeCatch(record)}
                        class="relative size-9 rounded-[10px] border-2 border-line-soft bg-paper"
                      >
                        <AnimatedSprite
                          species={isEgg(record) ? Species.Egg : record.species}
                          shiny={isShiny(record)}
                          direction="DownLeft"
                          still
                          fill
                        />
                      </span>
                    )}
                  </For>
                  <span class="text-xs text-muted">
                    {m.item_panel_helps_count({ count: kept().length })}
                  </span>
                </div>
              </Show>
            )}
          </Show>
        </div>
      </Show>

      <Show when={props.verb}>
        {(verb) => (
          <Button tone="primary" class="mt-1 min-h-11 w-full justify-center" onClick={props.onVerb}>
            {verb()}
          </Button>
        )}
      </Show>
    </aside>
  );
}
