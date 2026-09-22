/**
 * Whether the way in offers an address and a password beside the two
 * buttons.
 *
 * The hosted game offers only Google and GitHub: an account it holds a
 * password for is an account it has to keep one safe for. A
 * development build offers the pair as well, since the browser tests
 * make and throw away accounts of their own, and so does any host that
 * sets `VITE_EMAIL_SIGN_IN` to `1` or `true`, which is what a
 * self-hosted game without OAuth apps of its own needs.
 */
export const EMAIL_SIGN_IN =
  import.meta.env.DEV ||
  import.meta.env.VITE_EMAIL_SIGN_IN === '1' ||
  import.meta.env.VITE_EMAIL_SIGN_IN === 'true';
