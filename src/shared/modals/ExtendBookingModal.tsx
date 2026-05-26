import React, { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Switch, Text } from 'react-native-paper';
import dayjs from 'dayjs';
import { AppBottomSheet, AppBottomSheetRef } from '@shared/bottomSheets/AppBottomSheet';
import { AppButton, AppDatePickerModal } from '@shared/ui';
import { colors, spacing, typography } from '@app/theme';
import { modalFormStyles } from '@shared/modals/modalFormStyles';
import { screenStyles } from '@shared/layouts/screenStyles';
import { formatDate } from '@core/helpers/date';
import { getLatestSelectableHistoryDate } from '@core/helpers/historyDates';
import {
  formatExtensionBlockedMessage,
  formatExtensionWindowHint,
  getExtensionAvailability,
} from '@core/services/extensionBookingService';
import {
  billingFrequencyLabel,
  calculateRentalBillingPreview,
  formatRentDueDaySummary,
} from '@core/services/rentalBillingService';
import { formatCurrency } from '@core/utils/currency';
import type { Rental } from '@core/types/domain';
import { useCustomerStore } from '@features/customers/store/useCustomerStore';
import { RentalBillingBreakdown } from '@features/rentals/components/RentalBillingBreakdown';
import { useRentalStore } from '@features/rentals/store/useRentalStore';

export interface ExtendBookingModalRef {
  open: (rental: Rental) => void;
  close: () => void;
}

interface ExtendBookingModalProps {
  onSuccess?: () => void;
}

export const ExtendBookingModal = forwardRef<ExtendBookingModalRef, ExtendBookingModalProps>(
  ({ onSuccess }, ref) => {
    const sheetRef = useRef<AppBottomSheetRef>(null);
    const [sourceRental, setSourceRental] = useState<Rental | null>(null);
    const [newEndDate, setNewEndDate] = useState(new Date());
    const [collectFirstOnExtension, setCollectFirstOnExtension] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const rentals = useRentalStore(s => s.rentals);
    const customers = useCustomerStore(s => s.customers);
    const extendRental = useRentalStore(s => s.extendRental);

    const availability = useMemo(() => {
      if (!sourceRental) {
        return null;
      }
      return getExtensionAvailability(sourceRental, rentals);
    }, [sourceRental, rentals]);

    const extensionStartIso = useMemo(() => {
      if (!availability) {
        return '';
      }
      return availability.extensionStart.toISOString();
    }, [availability]);

    const billingPreview = useMemo(() => {
      if (!sourceRental?.billingFrequency || sourceRental.rateAmount == null || !availability) {
        return { installments: [], totalAmount: 0, rentalDayCount: 0 };
      }
      return calculateRentalBillingPreview({
        startDate: extensionStartIso,
        endDate: newEndDate.toISOString(),
        frequency: sourceRental.billingFrequency,
        rateAmount: sourceRental.rateAmount,
        rentDueWeekday: sourceRental.rentDueWeekday,
        rentDueDayOfMonth: sourceRental.rentDueDayOfMonth,
      });
    }, [sourceRental, extensionStartIso, newEndDate, availability]);

    const minEndDate = useMemo(() => {
      if (!availability) {
        return new Date();
      }
      return availability.extensionStart.toDate();
    }, [availability]);

    const maxEndDate = useMemo(() => {
      if (!availability?.maxEndDate) {
        return getLatestSelectableHistoryDate();
      }
      return availability.maxEndDate.toDate();
    }, [availability]);

    useImperativeHandle(ref, () => ({
      open: rental => {
        const window = getExtensionAvailability(rental, rentals);
        if (!window.canExtend) {
          const blocking = window.blockingRental;
          if (blocking) {
            const name =
              customers.find(c => c.id === blocking.customerId)?.name ?? 'another customer';
            Alert.alert(
              'Extension not available',
              formatExtensionBlockedMessage(name, blocking),
            );
          } else {
            Alert.alert(
              'Extension not available',
              'There is no room to extend this booking on the calendar.',
            );
          }
          return;
        }

        setSourceRental(rental);
        setCollectFirstOnExtension(false);
        const suggestedEnd = dayjs(rental.endDate).add(7, 'day');
        const defaultEnd =
          window.maxEndDate && suggestedEnd.isAfter(window.maxEndDate, 'day')
            ? window.maxEndDate
            : suggestedEnd;
        setNewEndDate(defaultEnd.toDate());
        sheetRef.current?.open();
      },
      close: () => sheetRef.current?.close(),
    }));

    const handleConfirm = async () => {
      if (!sourceRental) {
        return;
      }
      if (billingPreview.installments.length === 0) {
        Alert.alert('Invalid extension', 'Choose an end date within the available extension window.');
        return;
      }

      setSubmitting(true);
      const result = await extendRental({
        rentalId: sourceRental.id,
        newEndDate: newEndDate.toISOString(),
        collectFirstPaymentOnExtension: collectFirstOnExtension,
      });
      setSubmitting(false);

      if (!result.success) {
        Alert.alert('Extension failed', result.error);
        return;
      }
      sheetRef.current?.close();
      onSuccess?.();
    };

    if (!sourceRental || !availability?.canExtend) {
      return null;
    }

    return (
      <AppBottomSheet ref={sheetRef} scrollable>
        <Text style={typography.h3}>Extend booking</Text>
        <Text style={modalFormStyles.subtitle}>
          Creates a new contract from the current end date through your new end date. Billing
          uses the same rate and rent due rules as the original booking.
        </Text>

        <Text style={styles.windowHint}>
          {formatExtensionWindowHint(
            availability.extensionStart,
            availability.maxEndDate,
            availability.blockingRental,
          )}
        </Text>

        <View style={screenStyles.insetPanel}>
          <Text style={styles.summaryLabel}>Current booking</Text>
          <Text style={typography.body}>
            {formatDate(sourceRental.startDate)} – {formatDate(sourceRental.endDate)}
          </Text>
          {sourceRental.billingFrequency ? (
            <Text style={typography.bodySmall}>
              {billingFrequencyLabel(sourceRental.billingFrequency)} at{' '}
              {formatCurrency(sourceRental.rateAmount ?? 0)}
              {' · '}
              {formatRentDueDaySummary(
                sourceRental.billingFrequency,
                sourceRental.rentDueWeekday,
                sourceRental.rentDueDayOfMonth,
              )}
            </Text>
          ) : null}
        </View>

        <View style={screenStyles.insetPanel}>
          <Text style={styles.summaryLabel}>Extension period</Text>
          <Text style={typography.body}>
            {formatDate(extensionStartIso)} – {formatDate(newEndDate.toISOString())}
          </Text>
        </View>

        <AppButton
          label={`New end date: ${dayjs(newEndDate).format('DD MMM YYYY')}`}
          variant="outline"
          onPress={() => setShowEndPicker(true)}
          fullWidth
        />

        <View style={modalFormStyles.switchRow}>
          <View style={modalFormStyles.switchText}>
            <Text style={typography.body}>Collect first extension payment today</Text>
            <Text style={modalFormStyles.switchHint}>
              Turn on if the customer pays the first extension installment now.
            </Text>
          </View>
          <Switch
            value={collectFirstOnExtension}
            onValueChange={setCollectFirstOnExtension}
          />
        </View>

        <RentalBillingBreakdown
          installments={billingPreview.installments}
          totalAmount={billingPreview.totalAmount}
          rentalDayCount={billingPreview.rentalDayCount}
          collectFirstOnAssignment={collectFirstOnExtension}
        />

        <AppButton
          label={
            billingPreview.totalAmount > 0
              ? `Confirm extension · ${formatCurrency(billingPreview.totalAmount)}`
              : 'Confirm extension'
          }
          onPress={handleConfirm}
          loading={submitting}
          fullWidth
          disabled={billingPreview.installments.length === 0}
        />

        <AppDatePickerModal
          open={showEndPicker}
          date={newEndDate}
          minimumDate={minEndDate}
          maximumDate={maxEndDate}
          onConfirm={d => {
            setShowEndPicker(false);
            setNewEndDate(d);
          }}
          onCancel={() => setShowEndPicker(false)}
        />
      </AppBottomSheet>
    );
  },
);

const styles = StyleSheet.create({
  windowHint: {
    ...typography.label,
    color: colors.primary,
    lineHeight: 20,
  },
  summaryLabel: {
    ...typography.label,
    color: colors.textMuted,
  },
});
