import { For, type JSX, Show, createSignal } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { MDXProvider } from 'solid-marked';
import {
  Badge,
  Button,
  Dialog,
  DialogActions,
  List,
  ListRow,
  Meta,
  Note,
  RowButton,
} from '../styled';
import BUILTINS from './markdown';
import { RELEASES, type Release } from './releases';

/**
 * What the game has shipped, newest first.
 *
 * The feed is the list: one row per release, saying what it brought.
 * The page itself is a read rather than a glance, so it opens over the
 * list rather than unfolding inside it.
 */

/** The page being read, drawn through the game's own markup. */
function ReleasePage(props: { release: Release | null }): JSX.Element {
  return (
    <MDXProvider builtins={BUILTINS}>
      <div class="text-sm">
        {/* Read as a value rather than through `Show`, whose callback
            hands back an accessor that is empty the moment the panel
            starts closing */}
        {props.release == null ? null : <Dynamic component={props.release.page} />}
      </div>
    </MDXProvider>
  );
}

export default function NewsTab(): JSX.Element {
  /**
   * What was last opened. It is not put back on closing: the panel
   * fades out, and a page that empties as it goes reads as a mistake
   */
  const [reading, setReading] = createSignal<Release | null>(null);
  const [open, setOpen] = createSignal(false);
  const close = (): void => {
    setOpen(false);
  };

  return (
    <>
      <Show
        when={RELEASES.length > 0}
        fallback={<Note>Nothing has shipped yet. There will be a page here when it does.</Note>}
      >
        <List>
          <For each={RELEASES}>
            {(release, at) => (
              <ListRow>
                <RowButton
                  class="flex flex-col gap-1"
                  onClick={() => {
                    setReading(release);
                    setOpen(true);
                  }}
                >
                  <span class="flex items-center gap-2 font-bold text-ink">
                    {release.name}
                    <Show when={at() === 0}>
                      <Badge tone="leaf">Latest</Badge>
                    </Show>
                  </span>
                  {/* The line the releases page carries, which is what
                      says whether this one is worth opening */}
                  <Show when={release.brought !== ''}>
                    <Meta class="max-w-prose">{release.brought}</Meta>
                  </Show>
                </RowButton>
              </ListRow>
            )}
          </For>
        </List>
      </Show>

      <Dialog
        isOpen={open()}
        onClose={close}
        width="wide"
        terse
        title={reading()?.name ?? 'News'}
        description={reading()?.brought ?? 'What this release brought.'}
      >
        <ReleasePage release={reading()} />
        <DialogActions>
          <Button onClick={close}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
