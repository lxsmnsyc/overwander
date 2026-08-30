import { For, type JSX } from 'solid-js';
import { useColorScheme, usePreferredColorScheme } from 'terracotta';
import settings, {
  type BoxColumns,
  type ClockFormat,
  type WorldTimeFace,
  setSetting,
} from '../app/settings';
import {
  Card,
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

/**
 * How the game is set up for this player, and what it is made of.
 *
 * It is the one panel that is not about the world: nothing here is
 * earned, spent or lost, and nothing in it is worth a round trip. What
 * a player changes here changes their own copy of the game.
 */

const enum SettingsPane {
  General = 0,
  About = 1,
}

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

const WORLD_TIMES: { value: WorldTimeFace; label: string; description: string }[] = [
  {
    value: 'period',
    label: 'Period',
    description: 'Dawn, Day, Dusk or Night: what actually decides what walks about.',
  },
  { value: 'clock', label: 'Clock', description: 'The hour itself. The period is on hover.' },
];

const BOX_WIDTHS: { value: BoxColumns; label: string; description: string }[] = [
  { value: 5, label: 'Five wide', description: '25 to a box, and the largest squares.' },
  { value: 6, label: 'Six wide', description: '30 to a box, the way the games lay one out.' },
  { value: 8, label: 'Eight wide', description: '40 to a box, for sweeping a long collection.' },
];

function GeneralPane(): JSX.Element {
  return (
    <Panel>
      <Card title="Appearance">
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
      </Card>

      <Card title="The box">
        <RadioGroup
          label="Box width"
          value={settings().boxColumns}
          options={BOX_WIDTHS}
          onChange={(columns) => {
            setSetting('boxColumns', columns);
          }}
        />
      </Card>

      <Card title="Time">
        <RadioGroup
          label="Clock"
          value={settings().clock}
          options={CLOCKS}
          onChange={(clock) => {
            setSetting('clock', clock);
          }}
        />
        <RadioGroup
          label="What the bar shows"
          value={settings().worldTime}
          options={WORLD_TIMES}
          onChange={(face) => {
            setSetting('worldTime', face);
          }}
        />
      </Card>

      <Card title="Audio">
        <Note>Nothing makes a sound yet. These are kept for when something does.</Note>
        <Slider
          label="Sound"
          description="Throws, hits, and everything the world does in passing."
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
    </Panel>
  );
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

/**
 * Where a credit points. The docs are markdown in the repository
 * rather than pages of the game, so the links leave it
 */
interface Source {
  what: string;
  who: string;
  href: string;
  terms: string;
}

const SOURCES: Source[] = [
  {
    what: 'Pokemon sprites',
    who: 'PMDCollab / SpriteCollab',
    href: 'https://github.com/PMDCollab/SpriteCollab',
    terms: 'CC BY-NC, non-commercial',
  },
  {
    what: 'Item icons',
    who: 'msikma / pokesprite',
    href: 'https://github.com/msikma/pokesprite',
    terms: 'Images © Nintendo / Creatures Inc. / GAME FREAK Inc.',
  },
  {
    what: 'Overworld characters',
    who: 'The Pokengine community',
    href: 'https://pokengine.org',
    terms: 'Used with credit; rights stay with each artist',
  },
  {
    what: 'Rendering and routing',
    who: 'Solid and SolidStart',
    href: 'https://solidjs.com',
    terms: 'MIT',
  },
];

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
        <Line label="Dex">Gen 1, 151 species, with the modern rules wherever the two disagree</Line>
        <Line label="Source">MIT licensed, except the art and the names</Line>
      </Card>

      <Card title="Credits">
        <p class="max-w-prose text-sm text-muted">
          The art, the rules and the libraries are other people's work. This is the short list; the
          full one ships with the source.
        </p>
        <ul class="m-0 flex list-none flex-col gap-2 p-0">
          <For each={SOURCES}>
            {(source) => (
              <li class="flex flex-col gap-0.5 border-b border-line-soft pb-2 last:border-b-0">
                <span class="text-sm font-semibold">{source.what}</span>
                <a
                  href={source.href}
                  target="_blank"
                  rel="noreferrer"
                  class="text-sm text-tide-dark underline"
                >
                  {source.who}
                </a>
                <span class="text-xs text-muted">{source.terms}</span>
              </li>
            )}
          </For>
        </ul>
      </Card>

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

export default function SettingsTab(): JSX.Element {
  return (
    <TabGroup defaultValue={SettingsPane.General} class="flex flex-col gap-4">
      <TabBar>
        <TabButton value={SettingsPane.General}>General</TabButton>
        <TabButton value={SettingsPane.About}>About</TabButton>
      </TabBar>

      <TabPane value={SettingsPane.General}>
        <GeneralPane />
      </TabPane>
      <TabPane value={SettingsPane.About}>
        <AboutPane />
      </TabPane>
    </TabGroup>
  );
}
