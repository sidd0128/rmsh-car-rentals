import type { Customer } from '@core/types/domain';

export const customerLicenseLabel = (customer?: Pick<Customer, 'licenseNumber'>): string | undefined =>
  customer?.licenseNumber?.trim() ? `License ID: ${customer.licenseNumber.trim()}` : undefined;
