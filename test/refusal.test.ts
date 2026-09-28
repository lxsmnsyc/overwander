import { describe, expect, it } from 'vitest';
import authRefusal from '../src/auth/refusal';

describe('a sign-in refusal', () => {
  it('says what the player can do about a refusal it knows', () => {
    expect(authRefusal({ code: 'INVALID_EMAIL_OR_PASSWORD', status: 401 }).message).toBe(
      'That email and password do not match.',
    );
    expect(authRefusal({ status: 429 }).message).toBe(
      'Too many tries. Wait a moment and try again.',
    );
  });

  it('names a malformed email, which comes back as a generic validation error', () => {
    const refused = {
      code: 'VALIDATION_ERROR',
      status: 400,
      message: '[body.email] Invalid email address',
    };

    expect(authRefusal(refused).message).toBe('That is not an email address.');
    // Some other field's validation still falls back
    expect(authRefusal({ ...refused, message: '[body.name] Required' }).message).toBe(
      'Could not sign you in just now.',
    );
  });

  it('never passes the service’s own words on', () => {
    const refused = { code: 'FAILED_TO_CREATE_USER', status: 500 };

    expect(authRefusal(refused).message).toBe('Could not sign you in just now.');
    expect(authRefusal(refused, 'Could not sign you out just now.').message).toBe(
      'Could not sign you out just now.',
    );
  });
});
