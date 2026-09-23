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
      label="Dark mode"
      description="Draws the game in its night colours. Follows your machine until you choose."
      checked={showing() === 'dark'}
      onChange={(dark) => {
        setScheme(dark ? 'dark' : 'light');
      }}
    />
  );
}

const CLOCKS: { value: ClockFormat; label: string; description: string }[] = [
  { value: '24h', label: '24-hour', description: 'Twenty past eight in the evening is 20:20.' },
  { value: '12h', label: '12-hour', description: 'The same hour is 8:20 pm.' },
];

const BOARD_EDGES: { value: BoardEdge; label: string; description: string }[] = [
  { value: 'haze', label: 'Haze', description: 'The country fades into the sky toward the edge.' },
  {
    value: 'full',
    label: 'Full board',
    description: 'The ground reaches every corner of the screen. Heavier to draw.',
  },
  {
    value: 'plain',
    label: 'Plain',
    description: 'The board stops at its edge, with the sky past it.',
  },
];

const BOX_WIDTHS: { value: BoxColumns; label: string; description: string }[] = [
  { value: 5, label: 'Five wide', description: '25 to a box, and the largest squares.' },
  { value: 6, label: 'Six wide', description: '30 to a box, the way the games lay one out.' },
  { value: 8, label: 'Eight wide', description: '40 to a box, for sweeping a long collection.' },
];

/** What each direction does where it is used, said once */
const CONTROL_NOTES: Record<GameAction, string> = {
  up: 'North on the board.',
  down: 'South on the board.',
  left: 'West on the board.',
  right: 'East on the board.',
  interact: 'Whatever the player is facing.',
  menu: 'Puts the keyboard on the bar along the bottom.',
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
      <ThemeSetting />
      <Switch
        label="Reduce motion"
        description="Holds the decoration still: fades, transitions, and the idle a pokemon
          breathes at. Walking, battles and eggs still move."
        checked={settings().reduceMotion}
        onChange={(on) => {
          setSetting('reduceMotion', on);
        }}
      />
      <RadioGroup
        label="Clock"
        value={settings().clock}
        options={CLOCKS}
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
      <Note>
        The arrows always walk, whatever these say. Read while nothing else on the page has the
        keyboard, so a key typed into a search box is a key typed into a search box.
      </Note>
      <For each={ACTION_ORDER}>
        {(action) => (
          <KeyBind
            label={ACTION_NAMES[action]}
            description={CONTROL_NOTES[action]}
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
        label="Grid lines"
        description="Rules a line round every cell of the board."
        checked={settings().gridLines}
        onChange={(on) => {
          setSetting('gridLines', on);
        }}
      />
      <Switch
        label="Flat board"
        description="Draws the board flat from straight above on a wide screen too, the way an
          upright screen always shows it."
        checked={settings().flatBoard}
        onChange={(on) => {
          setSetting('flatBoard', on);
        }}
      />
      <RadioGroup
        label="Board edge"
        value={settings().boardEdge}
        options={BOARD_EDGES}
        onChange={(edge) => {
          setSetting('boardEdge', edge);
        }}
      />
      <Switch
        label="Detailed world map"
        description="Draws water, cliffs, towns and routes on the map, and takes a moment to fill
          in. Off, the map shows each chunk's country at once, with towns picked out."
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
        label="Keep the last ball"
        description="A meeting opens on whatever ball you last threw, where you still carry
          one. Off, every meeting opens on a Poke Ball."
        checked={settings().keepBall}
        onChange={(on) => {
          setSetting('keepBall', on);
        }}
      />
      <RadioGroup
        label="Box width"
        value={settings().boxColumns}
        options={BOX_WIDTHS}
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
      <Note>Music is kept for when there is some. Sound is what the world does now.</Note>
      <Slider
        label="Sound"
        description="What the world says in passing, a shiny sparkling among it."
        value={settings().sound}
        onChange={(level) => {
          setSetting('sound', level);
        }}
      />
      <Slider
        label="Music"
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
        label="Highlight cliffs and seams"
        description="Tints cliff tiles red and seamed tiles green on the board."
        checked={settings().stepHighlight}
        onChange={(on) => {
          setSetting('stepHighlight', on);
        }}
      />
      <Switch
        label="Boosted shiny odds"
        description="Rolls about half of all spawns shiny. Off, spawns roll at the real odds."
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
  return `Gens 1 to ${newest}, ${count} species, with the newest rules wherever generations disagree`;
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
        <p class="max-w-prose text-sm">
          A Pokemon-style overworld you walk through, generated as you go. The map is never stored:
          one seed produces the climate, the climate sorts into biomes, and each chunk rolls its own
          landmarks, spawns, stashes and raids from that seed plus the clock. Two players standing
          in the same place at the same time compute the same world without exchanging any of it.
        </p>
        <Line label="Written by">Alexis H. Munsayac</Line>
        <Line label="Dex">{dexLine()}</Line>
        <Line label="Source">MIT licensed, except the art and the names</Line>
      </Card>

      <CreditsCard />

      <Card title="What this is not">
        <p class="max-w-prose text-sm">
          Overwander is a fan project. Pokemon is a trademark of Nintendo, Creatures Inc. and GAME
          FREAK Inc., and The Pokemon Company owns the franchise. None of them is affiliated with
          this project, has endorsed it, or has seen it. The species, moves, abilities, items and
          type chart are theirs. Nothing here is sold, and nothing here is offered as an official
          product.
        </p>
      </Card>
    </Panel>
  );
}

/** Each section's label, in the order the list shows them */
const PANE_LABELS: Record<SettingsPane, string> = {
  display: 'Display',
  controls: 'Controls',
  world: 'World',
  play: 'Play',
  audio: 'Audio',
  about: 'About',
  development: 'Development',
};

const PANE_BODIES: Record<SettingsPane, () => JSX.Element> = {
  display: DisplayPane,
  controls: ControlsPane,
  world: WorldPane,
  play: PlayPane,
  audio: AudioPane,
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
                {PANE_LABELS[pane]}
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
