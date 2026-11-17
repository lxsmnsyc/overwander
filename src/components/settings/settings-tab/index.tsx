import { For, type JSX, Show } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import settings, { SETTINGS_PANES, type SettingsPane, setSetting } from '../../app/settings';
import { RailTab, RailTabs, TabGroup, TabPane } from '../../styled';
import SecurityPane from '../SecurityPane';
import {
  AboutPane,
  AudioPane,
  ControlsPane,
  DevelopmentPane,
  DisplayPane,
  PlayPane,
  WorldPane,
} from './panes';
import { m } from '../../../i18n/paraglide/messages.js';

/** Each section's label, in the order the list shows them */
const PANE_LABELS: Record<SettingsPane, () => string> = {
  display: m.settings_pane_display,
  controls: m.settings_pane_controls,
  world: m.settings_pane_world,
  play: m.settings_pane_play,
  audio: m.settings_pane_audio,
  security: m.settings_pane_security,
  about: m.settings_pane_about,
  development: m.settings_pane_development,
};

/** The line beside a section's name, saying what it is for */
const PANE_LINES: Record<SettingsPane, () => string> = {
  display: m.settings_line_display,
  controls: m.settings_line_controls,
  world: m.settings_line_world,
  play: m.settings_line_play,
  audio: m.settings_line_audio,
  security: m.settings_line_security,
  about: m.settings_line_about,
  development: m.settings_line_development,
};

/** The colour square each section wears on the rail */
const PANE_TONES: Record<SettingsPane, string> = {
  display: 'var(--color-tide)',
  controls: 'var(--color-arcane)',
  world: '#36B26F',
  play: '#F59A3B',
  audio: '#E94B6A',
  security: 'var(--color-ember)',
  about: 'var(--color-muted)',
  development: 'var(--color-line)',
};

const PANE_BODIES: Record<SettingsPane, () => JSX.Element> = {
  display: DisplayPane,
  controls: ControlsPane,
  world: WorldPane,
  play: PlayPane,
  audio: AudioPane,
  security: SecurityPane,
  about: AboutPane,
  development: DevelopmentPane,
};

/** The sections a build offers: development only in a dev build */
function shownPanes(): SettingsPane[] {
  const panes: SettingsPane[] = [];

  for (const pane of SETTINGS_PANES) {
    if (pane !== 'development' || import.meta.env.DEV) {
      panes.push(pane);
    }
  }
  return panes;
}

/**
 * One section at a time: a rail of them down the left from `md` up and
 * a row of chips on a phone, each with a colour square, and the open
 * one's name and cards beside it. Tabs are numbered, so a section's tab
 * value is its place in `SETTINGS_PANES`, and the open one is
 * remembered per device
 */
export default function SettingsTab(): JSX.Element {
  const open = (): number => {
    const at = SETTINGS_PANES.indexOf(settings().settingsPane);

    return shownPanes().includes(settings().settingsPane) && at >= 0 ? at : 0;
  };

  return (
    <TabGroup
      horizontal
      value={open()}
      onChange={(value) => {
        setSetting('settingsPane', SETTINGS_PANES[value] ?? 'display');
      }}
      class="flex flex-col gap-3 md:flex-row md:items-stretch md:gap-5"
    >
      <RailTabs label={m.settings_sections()} class="md:w-50">
        <For each={shownPanes()}>
          {(pane) => (
            <>
              {/* About is what the game is, not how it is set up */}
              <Show when={pane === 'about'}>
                <span
                  aria-hidden="true"
                  class="mx-1 my-1.5 hidden h-0.5 shrink-0 bg-line-soft md:block"
                />
              </Show>
              <RailTab value={SETTINGS_PANES.indexOf(pane)}>
                <span
                  aria-hidden="true"
                  class="size-4 shrink-0 rounded-[5px] md:size-[22px] md:rounded-[7px]"
                  style={{ background: PANE_TONES[pane] }}
                />
                <span class="truncate">{PANE_LABELS[pane]()}</span>
              </RailTab>
            </>
          )}
        </For>
      </RailTabs>

      <div class="min-w-0 grow">
        <For each={shownPanes()}>
          {(pane) => (
            <TabPane value={SETTINGS_PANES.indexOf(pane)}>
              <div class="flex flex-col gap-3">
                <div class="flex flex-wrap items-baseline gap-x-2.5">
                  <h3 class="m-0 font-display text-[22px] leading-tight font-semibold">
                    {PANE_LABELS[pane]()}
                  </h3>
                  <span class="text-xs text-muted">{PANE_LINES[pane]()}</span>
                </div>
                <Dynamic component={PANE_BODIES[pane]} />
              </div>
            </TabPane>
          )}
        </For>
      </div>
    </TabGroup>
  );
}
