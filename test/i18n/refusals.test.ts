import { describe, expect, it } from 'vitest';
import { getQuestData } from '../../src/data/quests';
import registerGameData from '../../src/data/index';
import describeGiftReason from '../../src/i18n/gift-reasons';
import describeFailure from '../../src/i18n/refusals';
import { readGiftReason, writeGiftReason } from '../../src/model/gift-reason';
import { readRefusal, refuse } from '../../src/model/refusal';

/**
 * The server answers with a code and its parameters, and the browser
 * says it in the player's language. English is the only locale served,
 * so these are the sentences the server used to send itself.
 */

registerGameData();

describe('a refusal', () => {
  it('crosses as an error and reads back as its code and parameters', () => {
    expect(readRefusal(refuse('nobody-answers', { name: 'Ash' }))).toEqual({
      code: 'nobody-answers',
      params: { name: 'Ash' },
    });
  });

  it('is said in the player language', () => {
    expect(describeFailure(refuse('friends-full'))).toBe('Your friends list is full');
    expect(describeFailure(refuse('nobody-answers', { name: 'Ash' }))).toBe(
      'Nobody answers to Ash.',
    );
    expect(describeFailure(refuse('maintenance'))).toBe(
      'The game is closed for maintenance. Try again soon.',
    );
  });

  it('shows the staff words a closed switch carries, as written', () => {
    expect(describeFailure(refuse('closed', { message: 'Back at noon.' }))).toBe('Back at noon.');
  });

  it('leaves any other failure in its own words', () => {
    expect(readRefusal(new Error('Something broke'))).toBeNull();
    expect(describeFailure(new Error('Something broke'))).toBe('Something broke');
    expect(describeFailure('plain')).toBe('plain');
  });

  it('ignores a code this build does not know', () => {
    expect(readRefusal(new Error('refusal:{"code":"from-the-future","params":{}}'))).toBeNull();
  });
});

describe('a gift reason', () => {
  it('is said in the player language when the game wrote it', () => {
    expect(describeGiftReason(writeGiftReason('starter'))).toBe(
      'A first partner, for a trainer with none.',
    );
    expect(describeGiftReason(writeGiftReason('daily', { name: 'Daily Stroll' }))).toBe(
      'Daily: Daily Stroll.',
    );
  });

  it('names a written quest in the player language', () => {
    const first = getQuestData(1);

    expect(first).not.toBeNull();
    expect(describeGiftReason(writeGiftReason('quest', { quest: '1' }))).toBe(
      `Quest: ${first?.name ?? ''}.`,
    );
  });

  it('shows a reason the staff wrote, or a row from before the codes, as written', () => {
    expect(readGiftReason('Quest: First Steps.')).toBeNull();
    expect(describeGiftReason('Quest: First Steps.')).toBe('Quest: First Steps.');
    expect(describeGiftReason('By hand.')).toBe('By hand.');
  });
});
