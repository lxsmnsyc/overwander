/**
 * A party a player saved under a name, so forming one for a raid or a
 * duel is a press rather than six.
 *
 * It is written apart from the reads in
 * [`team-presets.ts`](team-presets.ts) because the server writes it
 * too, and a server module may not pull the browser's Supabase client
 * in behind it.
 */
export interface TeamPresetRecord {
  name: string;
  /** Catch ids, in the order they were picked */
  catches: string[];
  /** Server-clock milliseconds it was first saved */
  madeAt: number;
}

/**
 * How many a player may keep. Six is a spread of answers (a raid
 * party, a duel three, one for each rule a Frontier Brain sets)
 * without the list becoming something to search
 */
export const TEAM_PRESET_LIMIT = 6;
