/**
 * All date/number formatting goes through Intl so every locale gets its own
 * conventions. Never format these by hand.
 */
export function formatDate(
  date: Date | string,
  locale: string,
  options: Intl.DateTimeFormatOptions = { dateStyle: "long" },
): string {
  const value = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, options).format(value);
}

export function formatDateTime(date: Date | string, locale: string): string {
  return formatDate(date, locale, { dateStyle: "medium", timeStyle: "short" });
}

export function formatNumber(
  value: number,
  locale: string,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

/**
 * Currency is a user preference, never inferred from the UI language.
 * Callers must pass an explicit ISO 4217 currency code.
 */
export function formatCurrency(value: number, locale: string, currency: string): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(value);
}
