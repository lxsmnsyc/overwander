import { For, Show, createSignal, onSettled } from 'solid-js';
import { Dynamic, type JSX } from '@solidjs/web';
import { MDXProvider } from 'solid-marked';
import {
  Badge,
  Button,
  Dialog,
  DialogActions,
  LIST_PAGE,
  Meta,
  Note,
  RailTab,
  RailTabs,
  TabGroup,
  createPager,
} from '../styled';
import BUILTINS, { ReleaseLine } from './markdown';
import { RELEASES, type Release } from './releases';
import { m } from '../../i18n/paraglide/messages.js';

/**
 * What the game has shipped, newest first.
 *
 * The feed is a rail: one row per release, saying what it brought, and
 * the page of the one chosen beside it. On a phone there is no room for
 * both, so the rail is the whole screen and a release opens as a sheet
 * over it.
 *
 * The rail pages at `LIST_PAGE`: the list grows with every update.
 */

/** From `md` up, where the rail and the page fit side by side */
const SIDE_BY_SIDE = '(min-width: 48rem)';

/** The page being read, drawn through the game's own markup. */
function ReleasePage(props: { release: Release | null }): JSX.Element {
  return (
    <MDXProvider builtins={BUILTINS}>
      <ReleaseLine value={props.release?.brought ?? ''}>
        <div class="text-sm">
          {/* Read as a value rather than through `Show`, whose callback
              hands back an accessor that is empty the moment the panel
              starts closing */}
          {props.release == null ? null : <Dynamic component={props.release.page} />}
        </div>
      </ReleaseLine>
    </MDXProvider>
  );
}

/** Whether the rail has room for the page beside it, followed as the window changes */
function createSideBySide(): () => boolean {
  const [side, setSide] = createSignal(false);

  onSettled(() => {
    const query = window.matchMedia(SIDE_BY_SIDE);
    const follow = (): void => {
      setSide(query.matches);
    };

    follow();
    query.addEventListener('change', follow);
    return () => {
      query.removeEventListener('change', follow);
    };
  });
  return side;
}

export default function NewsTab(): JSX.Element {
  /**
   * What was last chosen. It is not put back on closing: the panel
   * fades out, and a page that empties as it goes reads as a mistake.
   * The newest release is read until another is chosen
   */
  const [chosen, setChosen] = createSignal<Release | null>(null);
  const [open, setOpen] = createSignal(false);
  const side = createSideBySide();
  const paged = createPager(() => RELEASES, LIST_PAGE);
  const reading = (): Release | null => chosen() ?? (RELEASES.length > 0 ? RELEASES[0] : null);
  /** The open release's place in the list, which is its tab */
  const selected = (): number => {
    const now = reading();

    return now === null ? -1 : RELEASES.indexOf(now);
  };
  const close = (): void => {
    setOpen(false);
  };

  return (
    <Show when={RELEASES.length > 0} fallback={<Note>{m.news_empty()}</Note>}>
      <div class="flex min-h-0 grow flex-col gap-3 md:flex-row md:gap-0">
        <div
          class="flex shrink-0 flex-col gap-1 md:w-[290px] md:overflow-y-auto md:border-r-2
            md:border-line-soft md:pr-3"
        >
          {/* A rail like the others: the keys move between releases and
              the open one is the selected tab. On a phone a release is
              a sheet, so nothing stays selected once it is put away */}
          <TabGroup
            horizontal
            value={side() || open() ? selected() : -1}
            onChange={(value) => {
              setChosen(RELEASES[value]);
              // A phone has no pane beside the rail: the page is a sheet over it
              setOpen(!side());
            }}
          >
            <RailTabs
              label={m.news_releases()}
              class="max-md:flex-col max-md:overflow-x-visible md:border-r-0! md:pr-0!"
            >
              <For each={paged.shown()}>
                {(release) => (
                  <RailTab
                    value={RELEASES.indexOf(release)}
                    class="flex-col items-start! gap-0.5! rounded-[14px]! px-3 py-[9px]"
                  >
                    <span class="flex items-center gap-2 text-sm font-extrabold">
                      {release.name}
                      <Show when={release === RELEASES[0]}>
                        <Badge tone="leaf" class="px-2 py-0 text-[11px]">
                          {m.news_latest()}
                        </Badge>
                      </Show>
                    </span>
                    {/* The line the releases page carries, which is what
                        says whether this one is worth opening */}
                    <Show when={release.brought !== ''}>
                      <Meta class="leading-[1.35] font-normal">{release.brought}</Meta>
                    </Show>
                  </RailTab>
                )}
              </For>
            </RailTabs>
          </TabGroup>
          {paged.controls()}
        </div>

        <Show when={side()}>
          <div class="min-w-0 grow md:overflow-y-auto md:px-6.5 md:py-3.5">
            <ReleasePage release={reading()} />
          </div>
        </Show>
      </div>

      <Dialog
        isOpen={open()}
        onClose={close}
        width="wide"
        terse
        title={reading()?.name ?? m.panel_news()}
        description={reading()?.brought ?? m.news_release_description()}
      >
        <ReleasePage release={reading()} />
        <DialogActions>
          <Button onClick={close}>{m.ui_close()}</Button>
        </DialogActions>
      </Dialog>
    </Show>
  );
}
