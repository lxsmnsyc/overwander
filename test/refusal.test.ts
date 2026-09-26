import { AuthError } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';
import authRefusal from '../src/auth/refusal';

describe('a sign-in refusal', () => {
  it('says what the player can do about a refusal it knows', () => {
    const refused = new AuthError('Invalid login credentials', 400, 'invalid_credentials');

    expect(authRefusal(refused).message).toBe('That email and password do not match.');
  });

  it('never passes the service’s own words on', () => {
    const refused = new AuthError(
      'relation "auth.users" violates something',
      500,
      'unexpected_failure',
    );

    expect(authRefusal(refused).message).toBe('Could not sign you in just now.');
    expect(authRefusal(refused, 'Could not sign you out just now.').message).toBe(
      'Could not sign you out just now.',
    );
  });
});
