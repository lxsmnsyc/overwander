/**
 * Whether a row answers what was typed.
 *
 * Every word has to appear somewhere in the row's own description, in
 * any order — "shiny 30" finds a level 30 shiny without the player
 * having to know which way round the game writes it, and "potion 2"
 * finds two potions the same way. An empty search matches everything,
 * which is what makes clearing the box the way back to the whole list.
 *
 * It matches against the line the list already shows, so anything a
 * player can read they can search for, and nothing can be searched for
 * that they cannot see the result of
 */
export default function matches(text: string, query: string): boolean {
  const haystack = text.toLowerCase();

  for (const term of query.toLowerCase().split(/\s+/)) {
    if (term !== '' && !haystack.includes(term)) {
      return false;
    }
  }
  return true;
}
