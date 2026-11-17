import type { BoardEdge, BoxColumns, ClockFormat } from '../../app/settings';
import settings, { setSetting } from '../../app/settings';
import { ACTION_ORDER, type GameAction } from '../../app/keys';
import type { Locale } from '../../../i18n/locale';
import { m } from '../../../i18n/paraglide/messages.js';

/**
 * Each language, named in itself so a player who cannot read the
 * current one can still find theirs. The note is in the language too
 */
export const LANGUAGES: { value: Locale; label: string; description?: string }[] = [
  { value: 'en', label: 'English', description: 'Language of the game' },
  { value: 'ja', label: '日本語', description: 'ゲームの言語' },
  { value: 'es', label: 'Español', description: 'Idioma del juego' },
];

export function readClocks(): { value: ClockFormat; label: string; description: string }[] {
  return [
    {
      value: '24h',
      label: m.settings_clock_24h(),
      description: m.settings_clock_24h_description(),
    },
    {
      value: '12h',
      label: m.settings_clock_12h(),
      description: m.settings_clock_12h_description(),
    },
  ];
}

export function readBoardEdges(): { value: BoardEdge; label: string; description: string }[] {
  return [
    {
      value: 'haze',
      label: m.settings_edge_haze(),
      description: m.settings_edge_haze_description(),
    },
    {
      value: 'full',
      label: m.settings_edge_full(),
      description: m.settings_edge_full_description(),
    },
    {
      value: 'plain',
      label: m.settings_edge_plain(),
      description: m.settings_edge_plain_description(),
    },
  ];
}

export function readBoxWidths(): { value: BoxColumns; label: string; description: string }[] {
  return [
    { value: 5, label: m.settings_box_five(), description: m.settings_box_five_description() },
    { value: 6, label: m.settings_box_six(), description: m.settings_box_six_description() },
    { value: 8, label: m.settings_box_eight(), description: m.settings_box_eight_description() },
  ];
}

/** What each direction does where it is used, said once */
export const CONTROL_NOTES: Record<GameAction, () => string> = {
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
export function bindKey(action: GameAction, key: string): void {
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
