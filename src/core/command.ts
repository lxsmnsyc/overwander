import {
  type QueryCompletion,
  type QuerySuggestion,
  SUGGESTIONS,
  asValue,
  matching,
  scanQuery,
  wordAround,
} from './query';

/**
 * A line typed at the command bar.
 *
 * The grammar is the search box's with a command in front of it:
 * `tp player:self x:100`. The leading word says what to do and every
 * word after it is one of the search box's `name:value` pairs, so a
 * reader who knows one box knows the other. The bar wears the mark
 * itself, so nobody has to type it, and a line that opens with one
 * anyway is read the same.
 *
 * Two things a search box has no use for. A parameter may be given
 * more than once (`move:tackle move:growl`), so what a line was given
 * is a list per name rather than a value. And a value may carry a
 * colon of its own (`iv:speed:31`), which the grammar leaves whole:
 * only the first colon splits.
 *
 * This only takes the string apart. What a command *means* belongs to
 * whoever runs it.
 */

/**
 * The mark a command line is written with. The bar prints it beside
 * the box rather than asking for it, so this is what is stripped off
 * a line that carries one rather than what is required of one
 */
export const COMMAND_MARK = '/';

export interface CommandParameter {
  /** The word before the colon */
  name: string;
  /** One short line on what it takes, for the suggestion list */
  hint: string;
  /**
   * The values it is usually given, where there is a closed list of
   * them. A parameter with none is free text: a number, an address, a
   * code
   */
  values?: () => string[];
  /**
   * Whether giving it twice means two things rather than a correction.
   * A repeatable parameter keeps being offered after it has been given
   */
  repeatable?: boolean;
  /**
   * Whether its value carries a second colon, as `iv:speed:31` does.
   * Taking one of its values leaves the word unfinished, since the
   * number after it is still to come
   */
  chained?: boolean;
}

export interface CommandSpec {
  /** The word after the mark, lower-cased */
  name: string;
  hint: string;
  parameters: CommandParameter[];
}

export interface CommandVocabulary {
  commands: CommandSpec[];
}

/**
 * What a line was given, by parameter name and in the order it was
 * typed. A name given once is a list of one, so a reader that wants
 * several and a reader that wants one ask the same map
 */
export type CommandArguments = Map<string, string[]>;

/** A line taken apart: what to do, and what it was given */
export interface CommandLine {
  name: string;
  parameters: CommandArguments;
}

/**
 * The one value a parameter carries, which is the last where it was
 * given more than once: repeating a parameter that only takes one
 * value is somebody correcting themselves
 */
export function given(parameters: CommandArguments, name: string): string | undefined {
  return parameters.get(name)?.at(-1);
}

/** Every value a parameter carries, in the order they were typed */
export function everyGiven(parameters: CommandArguments, name: string): string[] {
  return parameters.get(name) ?? [];
}

/** A typed command name, with the mark off it where one was written */
export function commandName(word: string): string {
  const bare = word.startsWith(COMMAND_MARK) ? word.slice(COMMAND_MARK.length) : word;

  return bare.toLowerCase();
}

/**
 * What a line is asking, or null where it is not a command at all.
 *
 * The first word names the command, so a line opening with a
 * parameter is nobody's command: somebody has begun in the middle
 */
export default function parseCommand(line: string): CommandLine | null {
  const tokens = scanQuery(line.trim());
  const head = tokens.at(0);

  if (head?.field !== '' || head.value === '') {
    return null;
  }
  const parameters: CommandArguments = new Map();

  for (const token of tokens.slice(1)) {
    // A word with no colon in it is somebody mid-type, not a
    // parameter: there is nothing to give it to
    if (token.field !== '') {
      parameters.set(token.field, [...(parameters.get(token.field) ?? []), token.value]);
    }
  }
  return { name: commandName(head.value), parameters };
}

/** The command a line names, or null where it names none of them */
export function commandFor(line: string, vocabulary: CommandVocabulary): CommandSpec | null {
  const asked = parseCommand(line);

  return vocabulary.commands.find((one) => one.name === asked?.name) ?? null;
}

/**
 * Which parameters a command still wants, in the order it lists them.
 * A repeatable one is always still wanted, since a second is another
 * rather than a correction of the first
 */
function unasked(spec: CommandSpec, line: string): CommandParameter[] {
  const already = parseCommand(line)?.parameters ?? new Map<string, string[]>();

  return spec.parameters.filter((one) => one.repeatable === true || !already.has(one.name));
}

/**
 * What the bar can offer to finish the word the caret is in.
 *
 * In the first word it offers the commands, and after it the
 * parameters that command takes and the values they are known to
 * take. A parameter already given is not offered again, since
 * repeating one only overwrites it.
 *
 * An empty word offers everything that would fit there, where the
 * search box offers nothing: a box stands over a list somebody can
 * already see, and a bar is the only place its commands are written
 * down
 */
export function completeCommand(
  line: string,
  caret: number,
  vocabulary: CommandVocabulary,
): QueryCompletion | null {
  const { start, end } = wordAround(line, caret);
  const word = line.slice(start, end);
  const heading = line.slice(0, start).trim() === '';

  if (heading) {
    return { start, end, suggestions: commandNames(word, vocabulary) };
  }

  const spec = commandFor(line, vocabulary);

  if (spec == null) {
    return null;
  }
  const colon = word.indexOf(':');

  return colon < 0
    ? { start, end, suggestions: parameterNames(word, spec, line) }
    : { start, end, suggestions: parameterValues(word, colon, spec) };
}

/** The commands, offered on the word that names one */
function commandNames(word: string, vocabulary: CommandVocabulary): QuerySuggestion[] {
  return matching(
    vocabulary.commands.map((one) => one.name),
    commandName(word),
  )
    .slice(0, SUGGESTIONS)
    .map((name) => ({
      word: name,
      label: name,
      hint: vocabulary.commands.find((one) => one.name === name)?.hint,
      // A command is a whole word, so the space that follows it is
      // typed for whoever took it
      partial: false,
    }));
}

/** The parameters this command still wants */
function parameterNames(word: string, spec: CommandSpec, line: string): QuerySuggestion[] {
  const left = unasked(spec, line);

  return matching(
    left.map((one) => one.name),
    word,
  )
    .slice(0, SUGGESTIONS)
    .map((name) => ({
      word: `${name}:`,
      label: `${name}:`,
      hint: left.find((one) => one.name === name)?.hint,
      // Half a term: the bar stays open on the values it takes
      partial: true,
    }));
}

/** The values one parameter is known to take */
function parameterValues(word: string, colon: number, spec: CommandSpec): QuerySuggestion[] {
  const asked = word.slice(0, colon).toLowerCase();
  const parameter = spec.parameters.find((one) => one.name === asked);
  const known = parameter?.values?.();

  if (known == null) {
    return [];
  }
  const chained = parameter?.chained === true;

  return matching(known, word.slice(colon + 1))
    .slice(0, SUGGESTIONS)
    .map((one) => ({
      // A chained value is followed by a colon and the number that
      // belongs to it, so it is written with the colon already there
      word: `${asked}:${asValue(chained ? `${one}:` : one)}`,
      label: one,
      partial: chained,
    }));
}
