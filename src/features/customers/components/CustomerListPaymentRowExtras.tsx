import React, { memo } from 'react';
import { Text } from 'react-native-paper';
import { typography } from '@app/theme';
import { customerHasNotPaidInstallment } from '@core/helpers/customerPaymentStatus';
import {
  formatInstallmentDueLabel,
  nextPendingInstallmentForCustomer,
} from '@core/helpers/paymentInstallment';
import { formatRentalEndDisplay } from '@core/helpers/rentalDisplay';
import type { Car, Rental } from '@core/types/domain';
import { usePaymentStore } from '@features/payments/store/usePaymentStore';
import { StatusBadge } from '@shared/ui';
import { useTranslation } from '@core/i18n';

interface CustomerListPaymentRowProps {
  customerId: string;
  activeRental?: Rental;
  car?: Car;
}

/** Payment status badge for the customers list (only mounted when payments UI is on). */
export const CustomerListPaymentBadge = memo<CustomerListPaymentRowProps>(
  ({ customerId, activeRental }) => {
    const { t } = useTranslation();
    const payments = usePaymentStore(s => s.payments);
    const missedRent = customerHasNotPaidInstallment(customerId, payments);

    if (missedRent) {
      return <StatusBadge label={t('customers.notPaid')} variant="not_paid" />;
    }

    return (
      <StatusBadge
        label={activeRental?.paymentStatus ?? t('common.notAvailable')}
        variant={activeRental?.paymentStatus === 'DONE' ? 'done' : 'pending'}
      />
    );
  },
);

/** Payment-aware subtitle for the customers list (only mounted when payments UI is on). */
export const CustomerListPaymentSubtitle = memo<CustomerListPaymentRowProps>(
  ({ customerId, activeRental, car }) => {
    const { t } = useTranslation();
    const payments = usePaymentStore(s => s.payments);
    const nextDue = nextPendingInstallmentForCustomer(customerId, payments);

    if (!car) {
      return <Text style={typography.bodySmall}>{t('customers.noActiveRental')}</Text>;
    }

    return (
      <Text style={typography.bodySmall}>
        {car.name}
        {nextDue
          ? ` · ${formatInstallmentDueLabel(nextDue)}`
          : activeRental
            ? ` · ${t('customers.until', {
                date: formatRentalEndDisplay(activeRental.endDate),
              })}`
            : ''}
      </Text>
    );
  },
);
