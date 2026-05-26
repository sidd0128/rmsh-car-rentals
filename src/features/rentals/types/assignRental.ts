import type { BillingFrequency } from '@core/types/domain';

export interface AssignRentalInput {
  carId: string;
  customerId: string;
  startDate: string;
  endDate: string;
  billingFrequency: BillingFrequency;
  rateAmount: number;
  collectFirstPaymentOnAssignment: boolean;
  rentDueWeekday?: number;
  rentDueDayOfMonth?: number;
  notes?: string;
}
