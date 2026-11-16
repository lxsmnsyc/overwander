import { For, type JSX } from 'solid-js';
import { useColorScheme, usePreferredColorScheme } from 'terracotta';
import settings, { setSetting } from '../../app/settings';
import Regions from '../../../data/ids/regions';
import { getBaseForms } from '../../../data/species';
import { REGIONS, getSpeciesRegion } from '../../../data/species/regions';
import { ACTION_NAMES, ACTION_ORDER } from '../../app/keys';
import { KeyBind, RadioGroup, Slider, Switch } from '../../styled';
import { SettingCard, SettingChoice, SettingLine, SettingNote } from '../setting-card';
import {
  CONTROL_NOTES,
  LANGUAGES,
  bindKey,
  readBoardEdges,
  readBoxWidths,
  readClocks,
} from './choices';
import CreditsCard from '../CreditsCard';
import { chooseLocale, currentLocale } from '../../../i18n/locale';
import { m } from '../../../i18n/paraglide/messages.js';

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
      row
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
 * The language the game is drawn in. Choosing one reloads the page,
 * since everything on it was rendered in the old one
 */
function LanguageSetting(): JSX.Element {
  return (
    <SettingChoice>
      <RadioGroup
        cards
        named
        columns={3}
        label={m.settings_language()}
        value={currentLocale()}
        options={LANGUAGES}
        onChange={(locale) => {
          if (locale !== currentLocale()) {
            chooseLocale(locale);
          }
        }}
      />
    </SettingChoice>
  );
}

export function DisplayPane(): JSX.Element {
  return (
    <SettingCard>
      <ThemeSetting />
      <LanguageSetting />
      <Switch
        row
        label={m.settings_reduce_motion()}
        description={m.settings_reduce_motion_description()}
        checked={settings().reduceMotion}
        onChange={(on) => {
          setSetting('reduceMotion', on);
        }}
      />
      <SettingChoice>
        <RadioGroup
          cards
          named
          label={m.settings_clock()}
          value={settings().clock}
          options={readClocks()}
          onChange={(clock) => {
            setSetting('clock', clock);
          }}
        />
      </SettingChoice>
    </SettingCard>
  );
}

export function ControlsPane(): JSX.Element {
  return (
    <SettingCard>
      <SettingNote>{m.settings_controls_note()}</SettingNote>
      <For each={ACTION_ORDER}>
        {(action) => (
          <KeyBind
            row
            label={ACTION_NAMES[action]()}
            description={CONTROL_NOTES[action]()}
            value={settings().keys[action]}
            onChange={(key) => {
              bindKey(action, key);
            }}
          />
        )}
      </For>
    </SettingCard>
  );
}

export function WorldPane(): JSX.Element {
  return (
    <SettingCard>
      <Switch
        row
        label={m.settings_grid_lines()}
        description={m.settings_grid_lines_description()}
        checked={settings().gridLines}
        onChange={(on) => {
          setSetting('gridLines', on);
        }}
      />
      <Switch
        row
        label={m.settings_chunk_lines()}
        description={m.settings_chunk_lines_description()}
        checked={settings().chunkLines}
        onChange={(on) => {
          setSetting('chunkLines', on);
        }}
      />
      <Switch
        row
        label={m.settings_map_grid()}
        description={m.settings_map_grid_description()}
        checked={settings().mapGrid}
        onChange={(on) => {
          setSetting('mapGrid', on);
        }}
      />
      <Switch
        row
        label={m.settings_flat_board()}
        description={m.settings_flat_board_description()}
        checked={settings().flatBoard}
        onChange={(on) => {
          setSetting('flatBoard', on);
        }}
      />
      <Switch
        row
        label={m.settings_detailed_map()}
        description={m.settings_detailed_map_description()}
        checked={settings().detailedMap}
        onChange={(on) => {
          setSetting('detailedMap', on);
        }}
      />
      <SettingChoice>
        <RadioGroup
          cards
          named
          columns={3}
          label={m.settings_board_edge()}
          value={settings().boardEdge}
          options={readBoardEdges()}
          onChange={(edge) => {
            setSetting('boardEdge', edge);
          }}
        />
      </SettingChoice>
    </SettingCard>
  );
}

export function PlayPane(): JSX.Element {
  return (
    <SettingCard>
      <Switch
        row
        label={m.settings_keep_ball()}
        description={m.settings_keep_ball_description()}
        checked={settings().keepBall}
        onChange={(on) => {
          setSetting('keepBall', on);
        }}
      />
      <SettingChoice>
        <RadioGroup
          cards
          named
          columns={3}
          label={m.settings_box_width()}
          value={settings().boxColumns}
          options={readBoxWidths()}
          onChange={(columns) => {
            setSetting('boxColumns', columns);
          }}
        />
      </SettingChoice>
    </SettingCard>
  );
}

export function AudioPane(): JSX.Element {
  return (
    <SettingCard>
      <SettingNote>{m.settings_audio_note()}</SettingNote>
      <Slider
        row
        label={m.settings_sound()}
        description={m.settings_sound_description()}
        value={settings().sound}
        onChange={(level) => {
          setSetting('sound', level);
        }}
      />
      <Slider
        row
        label={m.settings_music()}
        value={settings().music}
        onChange={(level) => {
          setSetting('music', level);
        }}
      />
    </SettingCard>
  );
}

export function DevelopmentPane(): JSX.Element {
  return (
    <SettingCard>
      <Switch
        row
        label={m.settings_step_highlight()}
        description={m.settings_step_highlight_description()}
        checked={settings().stepHighlight}
        onChange={(on) => {
          setSetting('stepHighlight', on);
        }}
      />
      <Switch
        row
        label={m.settings_shiny_boost()}
        description={m.settings_shiny_boost_description()}
        checked={settings().devShinyBoost}
        onChange={(on) => {
          setSetting('devShinyBoost', on);
        }}
      />
    </SettingCard>
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

export function AboutPane(): JSX.Element {
  return (
    <>
      <SettingCard title="Overwander">
        <SettingNote>{m.settings_about_game()}</SettingNote>
        <SettingLine label={m.settings_about_written_by()}>Alexis H. Munsayac</SettingLine>
        <SettingLine label={m.settings_about_dex_label()}>{dexLine()}</SettingLine>
        <SettingLine label={m.settings_about_source()}>{m.settings_about_license()}</SettingLine>
      </SettingCard>

      <CreditsCard />

      <SettingCard title={m.settings_about_not_title()}>
        <SettingNote>{m.settings_about_not()}</SettingNote>
      </SettingCard>
    </>
  );
}
