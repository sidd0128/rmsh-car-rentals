import dayjs, { type Dayjs } from 'dayjs';
import type { Rental } from '@core/types/domain';
import { formatDate } from '@core/helpers/date';
import i18n from '@core/i18n';
/** Next booking must start more than this many days after extension start. */
const MIN_DAYS_BEFORE_NEXT_BOOKING = 2;

export interface ExtensionAvailability {
  canExtend: boolean;
  extensionStart: Dayjs;
  /** Last selectable extension end (inclusive); null when no upcoming booking caps the range. */
  maxEndDate: Dayjs | null;
  /** Rental that limits or blocks the extension. */
  blockingRental?: Rental;
}

const otherCarRentals = (source: Rental, rentals: Rental[]): Rental[] =>
  rentals.filter(
    r =>
      r.carId === source.carId &&
      r.id !== source.id &&
      r.status !== 'COMPLETED',
  );

/** Earliest upcoming rental on the same car after the current contract end. */
export const findNextCarRental = (
  source: Rental,
  rentals: Rental[],
): Rental | undefined => {
  const extensionStart = dayjs(source.endDate).startOf('day');
  return otherCarRentals(source, rentals)
    .filter(r => dayjs(r.startDate).startOf('day').isAfter(extensionStart, 'day'))
    .sort((a, b) => dayjs(a.startDate).valueOf() - dayjs(b.startDate).valueOf())[0];
};

export const getExtensionAvailability = (
  source: Rental,
  rentals: Rental[],
): ExtensionAvailability => {
  const extensionStart = dayjs(source.endDate).startOf('day');
  const others = otherCarRentals(source, rentals);

  const coversExtensionStart = others.find(r => {
    const start = dayjs(r.startDate).startOf('day');
    const end = dayjs(r.endDate).startOf('day');
    return (
      !extensionStart.isBefore(start, 'day') && !extensionStart.isAfter(end, 'day')
    );
  });
  if (coversExtensionStart) {
    return {
      canExtend: false,
      extensionStart,
      maxEndDate: null,
      blockingRental: coversExtensionStart,
    };
  }

  const next = findNextCarRental(source, rentals);
  if (!next) {
    return { canExtend: true, extensionStart, maxEndDate: null };
  }

  const nextStart = dayjs(next.startDate).startOf('day');
  const daysUntilNext = nextStart.diff(extensionStart, 'day');
  const maxEndDate = nextStart.subtract(1, 'day');

  if (daysUntilNext <= MIN_DAYS_BEFORE_NEXT_BOOKING) {
    return {
      canExtend: false,
      extensionStart,
      maxEndDate,
      blockingRental: next,
    };
  }

  return { canExtend: true, extensionStart, maxEndDate, blockingRental: next };
};

export const formatExtensionBlockedMessage = (
  customerName: string,
  rental: Rental,
): string =>
  i18n.t('extension.blockedByBooking', {
    customerName,
    startDate: formatDate(rental.startDate),
    endDate: formatDate(rental.endDate),
  });

export const rentalHasExtendableBilling = (rental: Rental): boolean =>
  rental.status !== 'COMPLETED' &&
  rental.billingFrequency != null &&
  rental.rateAmount != null;

/** Whether the extend action should appear (billing + calendar room). */
export const canOfferExtensionUi = (source: Rental, rentals: Rental[]): boolean =>
  rentalHasExtendableBilling(source) && getExtensionAvailability(source, rentals).canExtend;

type ExtensionValidationFailure = Extract<
  ReturnType<typeof validateExtensionEndDate>,
  { ok: false }
>;

export const resolveExtensionValidationError = (
  validation: ExtensionValidationFailure,
  customerName: string,
): string => {
  if (validation.error === 'EXTENSION_BLOCKED' && validation.blockingRental) {
    return formatExtensionBlockedMessage(customerName, validation.blockingRental);
  }
  return validation.error;
};

export const formatExtensionWindowHint = (
  extensionStart: Dayjs,
  maxEndDate: Dayjs | null,
  nextRental?: Rental,
): string => {
  if (!maxEndDate) {
    return i18n.t('extension.windowFromOnward', {
      from: extensionStart.format('D MMM YYYY'),
    });
  }
  const through = maxEndDate.format('D MMM YYYY');
  const from = extensionStart.format('D MMM YYYY');
  if (nextRental) {
    return i18n.t('extension.windowWithNext', {
      from,
      through,
      nextStart: formatDate(nextRental.startDate),
    });
  }
  return i18n.t('extension.windowRange', { from, through });
};

export const validateExtensionEndDate = (
  source: Rental,
  rentals: Rental[],
  newEndDate: string | Date,
): { ok: true } | { ok: false; error: string; blockingRental?: Rental } => {
  const availability = getExtensionAvailability(source, rentals);
  if (!availability.canExtend) {
    return {
      ok: false,
      error: 'EXTENSION_BLOCKED',
      blockingRental: availability.blockingRental,
    };
  }

  const end = dayjs(newEndDate).startOf('day');
  if (!end.isAfter(availability.extensionStart, 'day') && !end.isSame(availability.extensionStart, 'day')) {
    return {
      ok: false,
      error: 'New end date must be on or after the current booking end date',
    };
  }

  if (availability.maxEndDate && end.isAfter(availability.maxEndDate, 'day')) {
    return {
      ok: false,
      error: `Extension cannot go past ${availability.maxEndDate.format('D MMM YYYY')} because of the next booking`,
      blockingRental: availability.blockingRental,
    };
  }

  return { ok: true };
};
