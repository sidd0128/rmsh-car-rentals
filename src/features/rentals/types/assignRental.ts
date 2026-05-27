import type { BillingFrequency } from '@core/types/domain';

export interface AssignRentalInput {
  carId: string;
  customerId: string;
  startDate: string;
  endDate: string;
  /** When true, endDate is a placeholder until the user sets a real return date. */
  openEnded?: boolean;
  billingFrequency: BillingFrequency;
  rateAmount: number;
  collectFirstPaymentOnAssignment: boolean;
  rentDueWeekday?: number;
  rentDueDayOfMonth?: number;
  notes?: string;
}
