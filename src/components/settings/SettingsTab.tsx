import { For, type JSX, Show } from 'solid-js';
import { useColorScheme, usePreferredColorScheme } from 'terracotta';
import { Dynamic } from 'solid-js/web';
import settings, {
  type BoardEdge,
  type BoxColumns,
  type ClockFormat,
  SETTINGS_PANES,
  type SettingsPane,
  setSetting,
} from '../app/settings';
import Regions from '../../data/ids/regions';
import { getBaseForms } from '../../data/species';
import { REGIONS, getSpeciesRegion } from '../../data/species/regions';
import { ACTION_NAMES, ACTION_ORDER, type GameAction } from '../app/keys';
import {
  Card,
  KeyBind,
  Note,
  Panel,
  RadioGroup,
  Slider,
  Switch,
  TabBar,
  TabButton,
  TabGroup,
  TabPane,
} from '../styled';
import CreditsCard from './CreditsCard';
import SecurityPane from './SecurityPane';
import { type Locale, chooseLocale, currentLocale } from '../../i18n/locale';
import { m } from '../../i18n/paraglide/messages.js';

/**
 * How the game is set up for this player, and what it is made of.
 *
 * It is the one panel that is not about the world: nothing here is
 * earned, spent or lost, and nothing in it is worth a round trip. What
 * a player changes here changes their own copy of the game.
 */

/**
 * Day and night, as a setting rather than as the quick switch on the
 * menu bar. The switch says what the game is drawn in *now*, which for
 * a player who has never chosen is whatever their machine asked for
 */
function ThemeSetting(): JSX.Element {
  const [, setScheme] = useColorScheme();
  const showing = usePreferredColorScheme();

  return (
    <Switch
      label={m.settings_dark_mode()}
      description={m.settings_dark_mode_description()}
      checked={showing() === 'dark'}
      onChange={(dark) => {
        setScheme(dark ? 'dark' : 'light');
      }}
    />
  );
}

/**
 * Each language, named in itself so a player who cannot read the
 * current one can still find theirs. The note is in the language too
 */
const LANGUAGES: { value: Locale; label: string; description?: string }[] = [
  { value: 'en', label: 'English' },
  {
    value: 'ja',
    label: '日本語',
    description: 'まだ ほんやくされていない がめんは えいごで ひょうじされます。',
  },
  {
    value: 'es',
    label: 'Español',
    description: 'Las pantallas que aún no están traducidas se muestran en inglés.',
  },
];

/**
 * The language the game is drawn in. Choosing one reloads the page,
 * since everything on it was rendered in the old one
 */
function LanguageSetting(): JSX.Element {
  return (
    <RadioGroup
      label={m.settings_language()}
      value={currentLocale()}
      options={LANGUAGES}
      onChange={(locale) => {
        if (locale !== currentLocale()) {
          chooseLocale(locale);
        }
      }}
    />
  );
}

function readClocks(): { value: ClockFormat; label: string; description: string }[] {
  return [
    { value: '24h', label: m.settings_clock_24h(), description: m.settings_clock_24h_description() },
    { value: '12h', label: m.settings_clock_12h(), description: m.settings_clock_12h_description() },
  ];
}

function readBoardEdges(): { value: BoardEdge; label: string; description: string }[] {
  return [
    { value: 'haze', label: m.settings_edge_haze(), description: m.settings_edge_haze_description() },
    { value: 'full', label: m.settings_edge_full(), description: m.settings_edge_full_description() },
    {
      value: 'plain',
      label: m.settings_edge_plain(),
      description: m.settings_edge_plain_description(),
    },
  ];
}

function readBoxWidths(): { value: BoxColumns; label: string; description: string }[] {
  return [
    { value: 5, label: m.settings_box_five(), description: m.settings_box_five_description() },
    { value: 6, label: m.settings_box_six(), description: m.settings_box_six_description() },
    { value: 8, label: m.settings_box_eight(), description: m.settings_box_eight_description() },
  ];
}

/** What each direction does where it is used, said once */
const CONTROL_NOTES: Record<GameAction, () => string> = {
  up: m.settings_control_up,
  down: m.settings_control_down,
  left: m.settings_control_left,
  right: m.settings_control_right,
  interact: m.settings_control_interact,
  menu: m.settings_control_menu,
};

/**
 * Bind a key, and hand whatever had it the key it displaced.
 *
 * Two actions on one key is one of them doing nothing, and which one
 * is not something a player can see. Swapping keeps every action bound
 * to something without asking anybody to clear one first
 */
function bindKey(action: GameAction, key: string): void {
  const binds = settings().keys;

  if (binds[action] === key) {
    return;
  }

  const next = { ...binds, [action]: key };

  for (const one of ACTION_ORDER) {
    if (binds[one] === key) {
      next[one] = binds[action];
      break;
    }
  }
  setSetting('keys', next);
}

function DisplayPane(): JSX.Element {
  return (
    <Card>
      <LanguageSetting />
      <ThemeSetting />
      <Switch
        label={m.settings_reduce_motion()}
        description={m.settings_reduce_motion_description()}
        checked={settings().reduceMotion}
        onChange={(on) => {
          setSetting('reduceMotion', on);
        }}
      />
      <RadioGroup
        label={m.settings_clock()}
        value={settings().clock}
        options={readClocks()}
        onChange={(clock) => {
          setSetting('clock', clock);
        }}
      />
    </Card>
  );
}

function ControlsPane(): JSX.Element {
  return (
    <Card>
      <Note>{m.settings_controls_note()}</Note>
      <For each={ACTION_ORDER}>
        {(action) => (
          <KeyBind
            label={ACTION_NAMES[action]()}
            description={CONTROL_NOTES[action]()}
            value={settings().keys[action]}
            onChange={(key) => {
              bindKey(action, key);
            }}
          />
        )}
      </For>
    </Card>
  );
}

function WorldPane(): JSX.Element {
  return (
    <Card>
      <Switch
        label={m.settings_grid_lines()}
        description={m.settings_grid_lines_description()}
        checked={settings().gridLines}
        onChange={(on) => {
          setSetting('gridLines', on);
        }}
      />
      <Switch
        label={m.settings_chunk_lines()}
        description={m.settings_chunk_lines_description()}
        checked={settings().chunkLines}
        onChange={(on) => {
          setSetting('chunkLines', on);
        }}
      />
      <Switch
        label={m.settings_map_grid()}
        description={m.settings_map_grid_description()}
        checked={settings().mapGrid}
        onChange={(on) => {
          setSetting('mapGrid', on);
        }}
      />
      <Switch
        label={m.settings_flat_board()}
        description={m.settings_flat_board_description()}
        checked={settings().flatBoard}
        onChange={(on) => {
          setSetting('flatBoard', on);
        }}
      />
      <RadioGroup
        label={m.settings_board_edge()}
        value={settings().boardEdge}
        options={readBoardEdges()}
        onChange={(edge) => {
          setSetting('boardEdge', edge);
        }}
      />
      <Switch
        label={m.settings_detailed_map()}
        description={m.settings_detailed_map_description()}
        checked={settings().detailedMap}
        onChange={(on) => {
          setSetting('detailedMap', on);
        }}
      />
    </Card>
  );
}

function PlayPane(): JSX.Element {
  return (
    <Card>
      <Switch
        label={m.settings_keep_ball()}
        description={m.settings_keep_ball_description()}
        checked={settings().keepBall}
        onChange={(on) => {
          setSetting('keepBall', on);
        }}
      />
      <RadioGroup
        label={m.settings_box_width()}
        value={settings().boxColumns}
        options={readBoxWidths()}
        onChange={(columns) => {
          setSetting('boxColumns', columns);
        }}
      />
    </Card>
  );
}

function AudioPane(): JSX.Element {
  return (
    <Card>
      <Note>{m.settings_audio_note()}</Note>
      <Slider
        label={m.settings_sound()}
        description={m.settings_sound_description()}
        value={settings().sound}
        onChange={(level) => {
          setSetting('sound', level);
        }}
      />
      <Slider
        label={m.settings_music()}
        value={settings().music}
        onChange={(level) => {
          setSetting('music', level);
        }}
      />
    </Card>
  );
}

function DevelopmentPane(): JSX.Element {
  return (
    <Card>
      <Switch
        label={m.settings_step_highlight()}
        description={m.settings_step_highlight_description()}
        checked={settings().stepHighlight}
        onChange={(on) => {
          setSetting('stepHighlight', on);
        }}
      />
      <Switch
        label={m.settings_shiny_boost()}
        description={m.settings_shiny_boost_description()}
        checked={settings().devShinyBoost}
        onChange={(on) => {
          setSetting('devShinyBoost', on);
        }}
      />
    </Card>
  );
}

/** How far the dex reaches, counted off the registry so it cannot go stale */
function dexLine(): string {
  let count = 0;
  let newest = 0;

  for (const species of getBaseForms()) {
    const region = getSpeciesRegion(species);

    if (region !== Regions.Unknown) {
      count += 1;
      // A region's place in the list is its generation
      newest = Math.max(newest, REGIONS.indexOf(region));
    }
  }
  return m.settings_about_dex({ newest, count });
}

/** One line of the about page: what it is, and what it says */
function Line(props: { label: string; children: JSX.Element }): JSX.Element {
  return (
    <div class="flex flex-col gap-0.5">
      <span class="text-[10px] font-bold tracking-wide text-muted uppercase">{props.label}</span>
      <span class="text-sm">{props.children}</span>
    </div>
  );
}

function AboutPane(): JSX.Element {
  return (
    <Panel>
      <Card title="Overwander">
        <p class="max-w-prose text-sm">{m.settings_about_game()}</p>
        <Line label={m.settings_about_written_by()}>Alexis H. Munsayac</Line>
        <Line label={m.settings_about_dex_label()}>{dexLine()}</Line>
        <Line label={m.settings_about_source()}>{m.settings_about_license()}</Line>
      </Card>

      <CreditsCard />

      <Card title={m.settings_about_not_title()}>
        <p class="max-w-prose text-sm">{m.settings_about_not()}</p>
      </Card>
    </Panel>
  );
}

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
 * One section at a time, down the side from `md` up and along a bar
 * on a phone. Tabs are numbered, so a section's tab value is its place
 * in `SETTINGS_PANES`, and the open one is remembered per device
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
      class="flex flex-col gap-3 md:flex-row md:items-start md:gap-4"
    >
      <TabBar class="md:sticky md:top-0 md:w-36 md:shrink-0 md:flex-col md:overflow-visible">
        <For each={shownPanes()}>
          {(pane) => (
            <>
              {/* About is what the game is, not how it is set up */}
              <Show when={pane === 'about'}>
                <span aria-hidden="true" class="mx-2 my-1 hidden h-0.5 bg-line-soft md:block" />
              </Show>
              <TabButton value={SETTINGS_PANES.indexOf(pane)} class="md:justify-start">
                {PANE_LABELS[pane]()}
              </TabButton>
            </>
          )}
        </For>
      </TabBar>

      <div class="min-w-0 grow">
        <For each={shownPanes()}>
          {(pane) => (
            <TabPane value={SETTINGS_PANES.indexOf(pane)}>
              <Dynamic component={PANE_BODIES[pane]} />
            </TabPane>
          )}
        </For>
      </div>
    </TabGroup>
  );
}
