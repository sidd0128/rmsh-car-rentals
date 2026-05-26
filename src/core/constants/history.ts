/**
 * Rental / fine / payment / accident history retention.
 * `null` means no year cap — records are kept for the full lifetime of the business.
 */
export const HISTORY_RETENTION_YEARS: number | null = null;

/** How far back date pickers allow when retention is unlimited (practical UI bound). */
export const UNLIMITED_HISTORY_PICKER_LOOKBACK_YEARS = 100;

/** How far forward bookings / history dates can be selected. */
export const HISTORY_DATE_FUTURE_YEARS = 20;
