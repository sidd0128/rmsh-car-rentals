import React, { memo, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { spacing, typography } from '@app/theme';
import { useThemeContext } from '@contextApis/theme/useThemeContext';
import { formatDateTimeAmPm } from '@core/helpers/date';
import { computeCarTotalPaid, getNextRentDueForCar } from '@core/helpers/rentalPayments';
import { formatCurrency } from '@core/utils/currency';
import type { Car } from '@core/types/domain';
import { usePaymentStore } from '@features/payments/store/usePaymentStore';
import { useRentalStore } from '@features/rentals/store/useRentalStore';
import { useTranslation } from '@core/i18n';

interface CarDetailsPaymentInfoProps {
  car: Car;
}

/** Next rent / installments line for an active assignment. */
export const CarDetailsAssignmentPaymentLines = memo<CarDetailsPaymentInfoProps>(({ car }) => {
  const { t } = useTranslation();
  const payments = usePaymentStore(s => s.payments);
  const { colors } = useThemeContext();

  const nextRentDue = useMemo(
    () => getNextRentDueForCar(car, payments),
    [car, payments],
  );

  if (nextRentDue) {
    return (
      <Text style={[styles.nextRent, { color: colors.warning }]}>
        {t('cars.nextRentPaymentDue', {
          amount: formatCurrency(nextRentDue.amount),
          date: formatDateTimeAmPm(nextRentDue.dueDate),
        })}
      </Text>
    );
  }

  return <Text style={typography.bodySmall}>{t('cars.allInstallmentsReceived')}</Text>;
});

/** Total received for the car across all rentals. */
export const CarDetailsTotalReceived = memo<CarDetailsPaymentInfoProps>(({ car }) => {
  const { t } = useTranslation();
  const { colors } = useThemeContext();
  const rentals = useRentalStore(s => s.rentals);
  const payments = usePaymentStore(s => s.payments);

  const totalPaid = useMemo(
    () => computeCarTotalPaid(car.id, rentals, payments),
    [car.id, rentals, payments],
  );

  return (
    <Text style={[styles.earnings, { color: colors.primary }]}>
      {t('cars.totalReceived', { amount: formatCurrency(totalPaid) })}
    </Text>
  );
});

const styles = StyleSheet.create({
  nextRent: {
    ...typography.bodySmall,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  earnings: {
    ...typography.h4,
    marginTop: spacing.sm,
  },
});
