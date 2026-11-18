import { type Locale, baseLocale, currentLocale } from '../i18n/locale';

/**
 * A registry's text files that are fetched, not bundled with it.
 *
 * The browser shows one language per page (a change of locale
 * reloads), so it fetches English, which every other locale is laid
 * over, and the active locale's files, and no other. The glob that
 * builds `files` leaves English out, since English is imported
 * statically beside it.
 */
export type LazyText = Record<string, () => Promise<unknown>>;

/** The locale a text file's path sits under: `.../text/<locale>/...` */
function localeOf(path: string): string | undefined {
  return /(?:^|\/)text\/([^/]+)\//.exec(path)?.[1];
}

/** The files of the active locale, read; empty when that is English */
export async function readActiveText(
  files: LazyText,
  locale: Locale = currentLocale(),
): Promise<Record<string, unknown>> {
  const read: Record<string, unknown> = {};

  if (locale === baseLocale) {
    return read;
  }

  const loading: Promise<void>[] = [];

  for (const [path, load] of Object.entries(files)) {
    if (localeOf(path) === locale) {
      loading.push(
        load().then((file) => {
          read[path] = file;
        }),
      );
    }
  }
  await Promise.all(loading);
  return read;
}
