import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import React, { useCallback, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import type { RentalsStackParamList } from '@app/navigation/types';
import { spacing, typography } from '@app/theme';
import { formatDate } from '@core/helpers/date';
import {
  paymentsForRental,
  paidAmountForRental,
  pendingAmountForRental,
} from '@core/helpers/rentalPayments';
import {
  billingFrequencyLabel,
  formatRentDueDaySummary,
} from '@core/services/rentalBillingService';
import { formatCurrency } from '@core/utils/currency';
import { useCarStore } from '@features/cars/store/useCarStore';
import { useCustomerStore } from '@features/customers/store/useCustomerStore';
import { usePaymentStore } from '@features/payments/store/usePaymentStore';
import { usePaymentInstallmentActions } from '@features/payments/hooks/usePaymentInstallmentActions';
import { useCanExtendRental } from '../hooks/useCanExtendRental';
import { RentalPaymentSchedule } from '../components/RentalPaymentSchedule';
import { useHydrateStores } from '@core/hooks/useHydrateStores';
import { ExtendBookingModal, ExtendBookingModalRef } from '@shared/modals/ExtendBookingModal';
import { ScreenLayout } from '@shared/layouts/ScreenLayout';
import { ScreenSection } from '@shared/layouts/ScreenSection';
import { AppButton, StatusBadge } from '@shared/ui';
import { useRentalStore } from '../store/useRentalStore';
import { useTranslation } from '@core/i18n';

export const RentalDetailsScreen = () => {
  const { t } = useTranslation();
  const route = useRoute<RouteProp<RentalsStackParamList, 'RentalDetails'>>();
  const rental = useRentalStore(s => s.rentals.find(r => r.id === route.params.rentalId));
  const canExtend = useCanExtendRental(rental);
  const cars = useCarStore(s => s.cars);
  const customers = useCustomerStore(s => s.customers);
  const payments = usePaymentStore(s => s.payments);
  const { actingId, actingKind, runAction } = usePaymentInstallmentActions();
  const extendRef = useRef<ExtendBookingModalRef>(null);
  const { hydrateAll } = useHydrateStores();

  const onMarkReceived = useCallback(
    (paymentId: string) => {
      void runAction(paymentId, 'received');
    },
    [runAction],
  );

  const onMarkNotPaid = useCallback(
    (paymentId: string) => {
      void runAction(paymentId, 'not_paid');
    },
    [runAction],
  );

  if (!rental) {
    return (
      <ScreenLayout>
        <Text>{t('rentals.notFound')}</Text>
      </ScreenLayout>
    );
  }

  const car = cars.find(c => c.id === rental.carId);
  const customer = customers.find(c => c.id === rental.customerId);
  const rentalPayments = paymentsForRental(rental.id, payments);
  const paid = paidAmountForRental(rental, payments);
  const pending = pendingAmountForRental(rental, payments);

  return (
    <View style={styles.screen}>
    <ScreenLayout>
      <View style={styles.hero}>
        <Text style={typography.h2}>{car?.name ?? t('rentals.rentalFallback')}</Text>
        <Text style={typography.body}>{customer?.name ?? t('common.customer')}</Text>
        <View style={styles.badges}>
          <StatusBadge label={rental.status} variant="on_rent" />
          <StatusBadge
            label={rental.paymentStatus}
            variant={rental.paymentStatus === 'DONE' ? 'done' : 'pending'}
          />
        </View>
      </View>

      <ScreenSection title={t('rentals.schedule')} first showDivider>
        <Text style={typography.body}>
          {formatDate(rental.startDate)} – {formatDate(rental.endDate)}
        </Text>
        {rental.billingFrequency ? (
          <Text style={typography.bodySmall}>
            {billingFrequencyLabel(rental.billingFrequency)}
            {rental.rateAmount != null
              ? t('rentals.rateAt', { amount: formatCurrency(rental.rateAmount) })
              : ''}
            {' · '}
            {formatRentDueDaySummary(
              rental.billingFrequency,
              rental.rentDueWeekday,
              rental.rentDueDayOfMonth,
            )}
            {rental.collectFirstPaymentOnAssignment
              ? ` · ${t('billing.firstCollectedOnAssignment')}`
              : ''}
          </Text>
        ) : null}
        {canExtend ? (
          <AppButton
            label={t('rentals.extendBooking')}
            variant="outline"
            onPress={() => extendRef.current?.open(rental)}
            fullWidth
            style={styles.extendBtn}
          />
        ) : null}
      </ScreenSection>

      <ScreenSection title={t('rentals.contractValue')}>
        <Text style={typography.h3}>{formatCurrency(rental.agreedPrice)}</Text>
        <Text style={typography.bodySmall}>
          {t('rentals.receivedOutstanding', {
            received: formatCurrency(paid),
            outstanding: formatCurrency(pending),
          })}
        </Text>
        {rental.notes ? <Text style={typography.bodySmall}>{rental.notes}</Text> : null}
      </ScreenSection>

      <ScreenSection title={t('rentals.paymentBreakdown')}>
        <RentalPaymentSchedule
          rental={rental}
          payments={rentalPayments}
          onMarkReceived={onMarkReceived}
          onMarkNotPaid={onMarkNotPaid}
          markingId={actingId}
          markingAction={actingKind}
        />
      </ScreenSection>
    </ScreenLayout>

      <ExtendBookingModal ref={extendRef} onSuccess={hydrateAll} />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  hero: {
    gap: spacing.sm,
  },
  badges: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  extendBtn: {
    marginTop: spacing.sm,
    marginVertical: 0,
  },
});
