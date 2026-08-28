import { describe, expect, it } from 'vitest';
import type { QueryVocabulary } from '../src/core/query';
import { completeQuery, scanQuery, sharedPrefix, splitTerms, typedTerms } from '../src/core/query';

/**
 * Where a term sits in the box, and what the box can offer to finish
 * the word the caret is in. Both are about the string rather than
 * about what is being searched, which is why they are tested here
 * rather than beside a bag or a box of pokemon.
 */

const VOCABULARY: QueryVocabulary = {
  fields: [
    { name: 'type', hint: 'A type it is', values: () => ['Fire', 'Water', 'Flying'] },
    { name: 'is', hint: 'A fact it has', values: () => ['shiny', 'shadow'] },
    { name: 'move', hint: 'A move it knows', values: () => ['Solar Beam', 'Tackle'] },
    { name: 'resists', hint: 'A type it shrugs off', values: () => ['Fire', 'Water'] },
    { name: 'level', hint: 'Its level' },
  ],
};

describe('scanning a query', () => {
  it('says where every term was typed', () => {
    const query = 'pikachu type:fire';
    const [name, kind] = scanQuery(query);

    expect(name.field).toBe('');
    expect(query.slice(name.start, name.end)).toBe('pikachu');
    expect(kind.field).toBe('type');
    expect(query.slice(kind.start, kind.end)).toBe('type:fire');
  });

  it('counts the quotes it drops, so the span still covers the whole word', () => {
    // The quotes are punctuation for the parser and not part of the
    // value, but they are on the screen and a mark drawn over the word
    // has to cover them
    const query = 'move:"Solar Beam"';
    const [term] = scanQuery(query);

    expect(term.value).toBe('Solar Beam');
    expect(query.slice(term.start, term.end)).toBe('move:"Solar Beam"');
  });

  it('leaves a bare word alone, spans and all', () => {
    const query = '  pidgey  ';
    const [term] = scanQuery(query);

    expect(query.slice(term.start, term.end)).toBe('pidgey');
  });
});

describe('finishing a word', () => {
  it('offers the fields while one is being typed', () => {
    const found = completeQuery('ty', 2, VOCABULARY);

    expect(found?.suggestions.map((one) => one.word)).toEqual(['type:']);
    // A field is half a term, so the box stays open on what it takes
    expect(found?.suggestions[0].partial).toBe(true);
    expect(found?.suggestions[0].hint).toBe('A type it is');
  });

  it('puts what a word starts with before what it merely holds', () => {
    // `is` is the field asked for and `resists` merely holds the
    // letters, which is the order somebody typing them means
    const found = completeQuery('is', 2, VOCABULARY);

    expect(found?.suggestions.map((one) => one.word)).toEqual(['is:', 'resists:']);
  });

  it('offers nothing for an empty word, so a space does not open the list', () => {
    expect(completeQuery('type:fire ', 10, VOCABULARY)).toBeNull();
    expect(completeQuery('', 0, VOCABULARY)).toBeNull();
  });

  it('offers the values once the field is named', () => {
    const found = completeQuery('type:f', 6, VOCABULARY);

    expect(found?.suggestions.map((one) => one.word)).toEqual(['type:Fire', 'type:Flying']);
    expect(found?.suggestions[0].partial).toBe(false);
  });

  it('keeps a refusal in front of what it finishes', () => {
    const found = completeQuery('!is:sh', 6, VOCABULARY);

    expect(found?.suggestions.map((one) => one.word)).toEqual(['!is:shiny', '!is:shadow']);
  });

  it('finishes only the alternative the caret is in', () => {
    const found = completeQuery('type:fire|wa', 12, VOCABULARY);

    expect(found?.suggestions.map((one) => one.word)).toEqual(['type:fire|Water']);
  });

  it('quotes a value that carries a space', () => {
    const found = completeQuery('move:sol', 8, VOCABULARY);

    expect(found?.suggestions.map((one) => one.word)).toEqual(['move:"Solar Beam"']);
  });

  it('offers nothing for a field with no list of values', () => {
    expect(completeQuery('level:5', 7, VOCABULARY)).toBeNull();
  });

  it('offers nothing for a field nobody has heard of', () => {
    expect(completeQuery('colour:red', 10, VOCABULARY)).toBeNull();
  });

  it('replaces the word the caret is in and leaves the rest alone', () => {
    const query = 'pikachu ty level:5';
    const found = completeQuery(query, 10, VOCABULARY);

    expect(found?.start).toBe(8);
    expect(found?.end).toBe(10);
    expect(
      `${query.slice(0, found?.start)}${found?.suggestions[0].word}${query.slice(found?.end)}`,
    ).toBe('pikachu type: level:5');
  });
});

describe('sharedPrefix', () => {
  it('is nothing where there is nothing to agree on', () => {
    expect(sharedPrefix([])).toBe('');
  });

  it('is the whole word where there is only one', () => {
    expect(sharedPrefix(['is:shiny'])).toBe('is:shiny');
  });

  it('is how far every word agrees', () => {
    expect(sharedPrefix(['is:shiny', 'is:shadow'])).toBe('is:sh');
  });

  it('ignores case while comparing and keeps the casing of the first', () => {
    expect(sharedPrefix(['type:Water', 'type:water'])).toBe('type:Water');
  });

  it('is nothing where the words start apart', () => {
    expect(sharedPrefix(['is:shiny', 'level:5'])).toBe('');
  });
});

describe('splitTerms', () => {
  it('takes the terms out and leaves the rest', () => {
    expect(splitTerms('pikachu type:fire is:shiny')).toEqual({
      terms: ['type:fire', 'is:shiny'],
      rest: 'pikachu',
    });
  });

  it('takes a quoted value out whole', () => {
    expect(splitTerms('move:"Solar Beam"')).toEqual({ terms: ['move:"Solar Beam"'], rest: '' });
  });

  it('puts back together as the query it came from', () => {
    const query = 'type:fire pikachu !is:shiny';
    const { terms, rest } = splitTerms(query);

    expect([...terms, rest].join(' ')).toBe('type:fire !is:shiny pikachu');
  });

  it('leaves a query with no terms in it alone', () => {
    expect(splitTerms('pikachu')).toEqual({ terms: [], rest: 'pikachu' });
  });
});

describe('typedTerms', () => {
  it('takes a term that has been finished with a space', () => {
    expect(typedTerms('is:shiny ')).toEqual({ terms: ['is:shiny'], rest: '' });
  });

  it('leaves the term still being typed in the box', () => {
    expect(typedTerms('is:s')).toEqual({ terms: [], rest: 'is:s' });
  });

  it('takes the finished term and keeps the word after it', () => {
    expect(typedTerms('is:shiny pik')).toEqual({ terms: ['is:shiny'], rest: 'pik' });
  });

  it('waits for a quote to be closed', () => {
    expect(typedTerms('move:"Solar Bea')).toEqual({ terms: [], rest: 'move:"Solar Bea' });
    expect(typedTerms('move:"Solar Beam" ')).toEqual({ terms: ['move:"Solar Beam"'], rest: '' });
  });

  it('leaves a plain word where it was typed', () => {
    expect(typedTerms('pikachu ')).toEqual({ terms: [], rest: 'pikachu ' });
  });
});
