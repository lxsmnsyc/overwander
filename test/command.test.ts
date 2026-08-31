import { describe, expect, it } from 'vitest';
import type { CommandVocabulary } from '../src/core/command';
import parseCommand, { commandFor, completeCommand, everyGiven, given } from '../src/core/command';

/**
 * What a typed line is asking, and what the bar can offer to finish
 * the word being typed. Both are about the string rather than about
 * what any command does, which is why they are tested here rather
 * than beside the teleport.
 */

const VOCABULARY: CommandVocabulary = {
  commands: [
    {
      name: 'tp',
      hint: 'Move a player',
      parameters: [
        { name: 'player', hint: 'Who moves', values: () => ['self'] },
        { name: 'x', hint: 'Chunk across' },
        { name: 'y', hint: 'Chunk down' },
        { name: 'to', hint: 'Somebody to stand beside', values: () => ['self'] },
      ],
    },
    {
      name: 'give',
      hint: 'Hand something over',
      parameters: [
        { name: 'move', hint: 'One it knows', values: () => ['tackle'], repeatable: true },
        {
          name: 'iv',
          hint: 'One value',
          values: () => ['speed'],
          repeatable: true,
          chained: true,
        },
      ],
    },
    { name: 'time', hint: 'Set the clock', parameters: [{ name: 'hour', hint: 'The hour' }] },
  ],
};

/** What the bar would offer, as the words it would write */
function offered(line: string, caret = line.length): string[] {
  return (completeCommand(line, caret, VOCABULARY)?.suggestions ?? []).map((one) => one.word);
}

describe('reading a command line', () => {
  it('takes the command and its parameters apart', () => {
    const asked = parseCommand('tp player:self x:100 y:-20');

    expect(asked?.name).toBe('tp');
    expect(given(asked!.parameters, 'player')).toBe('self');
    expect(given(asked!.parameters, 'x')).toBe('100');
    expect(given(asked!.parameters, 'y')).toBe('-20');
  });

  it('refuses a line that names no command', () => {
    // The bar wears the mark, so the first word is the command
    // itself: a line that opens with a parameter began in the middle
    expect(parseCommand('player:self')).toBeNull();
    expect(parseCommand('')).toBeNull();
    expect(parseCommand('   ')).toBeNull();
  });

  it('reads the command whatever case it was typed in', () => {
    expect(parseCommand('TP')?.name).toBe('tp');
  });

  it('reads a line somebody typed the mark on anyway', () => {
    expect(parseCommand('/tp x:1')?.name).toBe('tp');
  });

  it('keeps a value that carries a space, quoted', () => {
    const asked = parseCommand('tp player:"one two"');

    expect(given(asked!.parameters, 'player')).toBe('one two');
  });

  it('keeps every value a parameter was given, and reads the last as the one', () => {
    const asked = parseCommand('give move:tackle move:growl');

    expect(everyGiven(asked!.parameters, 'move')).toEqual(['tackle', 'growl']);
    // A parameter that only takes one value is corrected by repeating it
    expect(given(parseCommand('tp x:1 x:2')!.parameters, 'x')).toBe('2');
  });

  it('leaves a second colon inside the value', () => {
    expect(everyGiven(parseCommand('give iv:speed:31')!.parameters, 'iv')).toEqual(['speed:31']);
  });

  it('ignores a word with nothing given to it', () => {
    const asked = parseCommand('tp player');

    expect(asked?.name).toBe('tp');
    expect(asked?.parameters.size).toBe(0);
  });

  it('names the command a line is running', () => {
    expect(commandFor('tp x:1', VOCABULARY)?.name).toBe('tp');
    expect(commandFor('nothing', VOCABULARY)).toBeNull();
  });
});

describe('finishing a command line', () => {
  it('offers the commands on the first word', () => {
    // What starts with the letters comes before what merely holds them
    expect(offered('t')).toEqual(['tp', 'time']);
    expect(offered('ti')).toEqual(['time']);
    // The mark is not required, and a line carrying one still reads
    expect(offered('/t')).toEqual(['tp', 'time']);
  });

  it('offers the parameters the command takes', () => {
    // Every one of them on the space after the command: a bar is
    // asked what a command takes, where a search box is not
    expect(offered('tp ')).toEqual(['player:', 'x:', 'y:', 'to:']);
    expect(offered('tp p')).toEqual(['player:']);
    expect(offered('tp x')).toEqual(['x:']);
  });

  it('lists every command on an empty bar', () => {
    expect(offered('')).toEqual(['tp', 'give', 'time']);
  });

  it('stops offering a parameter already given', () => {
    expect(offered('tp x:1 ')).toEqual(['player:', 'y:', 'to:']);
    // `player` holds a y, and the box this grammar borrows from ranks
    // what starts with the typed letters above what merely holds them
    expect(offered('tp x:1 y')).toEqual(['y:', 'player:']);
    // `x` is spent, so the only thing left holding an x is nothing
    expect(offered('tp x:1 x')).toEqual([]);
  });

  it('offers the values a parameter is known to take', () => {
    expect(offered('tp player:')).toEqual(['player:self']);
    expect(offered('tp player:s')).toEqual(['player:self']);
  });

  it('offers nothing for a parameter that is free text', () => {
    expect(offered('tp x:')).toEqual([]);
  });

  it('keeps offering a parameter that may be given more than once', () => {
    expect(offered('give move:tackle ')).toEqual(['move:', 'iv:']);
  });

  it('leaves a chained value unfinished, since its number is still to come', () => {
    const offer = completeCommand('give iv:sp', 10, VOCABULARY)?.suggestions ?? [];

    expect(offer.map((one) => one.word)).toEqual(['iv:speed:']);
    expect(offer[0].partial).toBe(true);
  });

  it('offers nothing for a command it does not know', () => {
    expect(completeCommand('nothing here', 12, VOCABULARY)).toBeNull();
  });

  it('finishes the word the caret is in rather than the last one', () => {
    // The caret sits in `pl`, with a finished term after it
    const line = 'tp pl x:1';

    expect(offered(line, 5)).toEqual(['player:']);
  });
});
