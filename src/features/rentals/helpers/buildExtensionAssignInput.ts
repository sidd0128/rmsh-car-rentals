import dayjs from 'dayjs';
import { formatDate } from '@core/helpers/date';
import type { Rental } from '@core/types/domain';
import type { AssignRentalInput } from '../types/assignRental';

export const buildExtensionAssignInput = (
  source: Rental,
  newEndDate: string | Date,
  collectFirstPaymentOnExtension?: boolean,
): AssignRentalInput => ({
  carId: source.carId,
  customerId: source.customerId,
  startDate: dayjs(source.endDate).startOf('day').toISOString(),
  endDate: dayjs(newEndDate).startOf('day').toISOString(),
  billingFrequency: source.billingFrequency!,
  rateAmount: source.rateAmount!,
  collectFirstPaymentOnAssignment: collectFirstPaymentOnExtension ?? false,
  rentDueWeekday: source.rentDueWeekday,
  rentDueDayOfMonth: source.rentDueDayOfMonth,
  notes: `Extension from ${formatDate(source.startDate)} – ${formatDate(source.endDate)}`,
});
