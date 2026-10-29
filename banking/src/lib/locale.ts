/** Locale identifiers may use either BCP 47 hyphens or legacy underscores. */
export const isPersianLocaleCode = (locale: string = '') => /^fa(?:[-_]|$)/i.test(locale);
