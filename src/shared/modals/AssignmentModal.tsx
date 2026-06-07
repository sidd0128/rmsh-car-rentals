import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { SegmentedButtons, Text } from 'react-native-paper';
import { AppBottomSheet, AppBottomSheetRef } from '@shared/bottomSheets/AppBottomSheet';
import { AppButton, AppDropdown, AppInput, AppDatePickerModal, WeekdayPicker } from '@shared/ui';
import { colors, spacing, typography } from '@app/theme';
import { modalFormStyles } from '@shared/modals/modalFormStyles';
import { OPEN_ENDED_RENTAL_END_ISO } from '@core/constants/rental';
import type { BillingFrequency } from '@core/types/domain';
import {
  formatRentDueDaySummary,
  rateFieldLabel,
} from '@core/services/rentalBillingService';
import { useCarStore } from '@features/cars/store/useCarStore';
import { useCustomerStore } from '@features/customers/store/useCustomerStore';
import { useRentalStore } from '@features/rentals/store/useRentalStore';
import {
  getEarliestSelectableHistoryDate,
  getLatestSelectableHistoryDate,
} from '@core/helpers/historyDates';
import { mergeDateAndTime } from '@core/helpers/rentalDisplay';
import { formatDateTimeAmPm } from '@core/helpers/date';
import dayjs from 'dayjs';
import { useTranslation } from '@core/i18n';

export interface AssignmentModalRef {
  open: (carId: string) => void;
  close: () => void;
}

interface AssignmentModalProps {
  onSuccess?: () => void;
  onAddCustomer?: () => void;
}

const defaultRateForFrequency = (
  frequency: BillingFrequency,
  daily: number,
  weekly?: number,
  monthly?: number,
): string => {
  switch (frequency) {
    case 'DAILY':
      return String(daily);
    case 'WEEKLY':
      return String(weekly ?? daily * 7);
    case 'MONTHLY':
      return String(monthly ?? daily * 30);
    default:
      return String(daily);
  }
};

export const AssignmentModal = forwardRef<AssignmentModalRef, AssignmentModalProps>(
  ({ onSuccess, onAddCustomer }, ref) => {
    const { t } = useTranslation();
    const sheetRef = useRef<AppBottomSheetRef>(null);
    const frequencyOptions = useMemo(
      (): { value: BillingFrequency; label: string }[] => [
        { value: 'DAILY', label: t('assignment.frequencyDaily') },
        { value: 'WEEKLY', label: t('assignment.frequencyWeekly') },
        { value: 'MONTHLY', label: t('assignment.frequencyMonthly') },
      ],
      [t],
    );
    const [carId, setCarId] = useState('');
    const [customerId, setCustomerId] = useState('');
    const [frequency, setFrequency] = useState<BillingFrequency>('WEEKLY');
    const [rate, setRate] = useState('');
    const [startDatePart, setStartDatePart] = useState(new Date());
    const [startTimePart, setStartTimePart] = useState(new Date());
    const [endDatePart, setEndDatePart] = useState(dayjs().add(7, 'day').toDate());
    const [endTimePart, setEndTimePart] = useState(dayjs().add(7, 'day').toDate());
    const [endDateUnset, setEndDateUnset] = useState(false);
    const [rentDueWeekday, setRentDueWeekday] = useState<number>(() => dayjs().day());
    const [rentDueDayOfMonth, setRentDueDayOfMonth] = useState(() =>
      Math.min(dayjs().date(), 28),
    );
    const [showStartDate, setShowStartDate] = useState(false);
    const [showStartTime, setShowStartTime] = useState(false);
    const [showEndDate, setShowEndDate] = useState(false);
    const [showEndTime, setShowEndTime] = useState(false);
    const [showRentDueDay, setShowRentDueDay] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const customers = useCustomerStore(s => s.customers);
    const car = useCarStore(s => (carId ? s.getCarById(carId) : undefined));
    const assignRental = useRentalStore(s => s.assignRental);
    const selectedCustomer = customers.find(c => c.id === customerId);
    const customerOptions = useMemo(
      () => customers.map(c => ({ label: c.name, value: c.id })),
      [customers],
    );

    const startDateTime = useMemo(
      () => mergeDateAndTime(startDatePart, startTimePart),
      [startDatePart, startTimePart],
    );
    const endDateTime = useMemo(
      () => mergeDateAndTime(endDatePart, endTimePart),
      [endDatePart, endTimePart],
    );

    useImperativeHandle(ref, () => ({
      open: id => {
        setCarId(id);
        setCustomerId('');
        const now = new Date();
        setStartDatePart(now);
        setStartTimePart(now);
        const weekLater = dayjs().add(7, 'day').toDate();
        setEndDatePart(weekLater);
        setEndTimePart(weekLater);
        setEndDateUnset(false);
        setRentDueWeekday(dayjs(now).day());
        setRentDueDayOfMonth(Math.min(dayjs(now).date(), 28));
        setFrequency('WEEKLY');
        sheetRef.current?.open();
      },
      close: () => sheetRef.current?.close(),
    }));

    useEffect(() => {
      const cfg = car?.priceConfigurations[0];
      if (!cfg) {
        return;
      }
      setRate(
        defaultRateForFrequency(
          frequency,
          cfg.dailyRate,
          cfg.weeklyRate,
          cfg.monthlyRate,
        ),
      );
    }, [car, frequency]);

    const handleAssign = async () => {
      if (!customerId) {
        Alert.alert(t('assignment.selectCustomerAlert'));
        return;
      }
      const rateAmount = Number(rate);
      if (!Number.isFinite(rateAmount) || rateAmount <= 0) {
        Alert.alert(t('assignment.invalidRate'));
        return;
      }
      if (!endDateUnset && dayjs(endDateTime).isBefore(dayjs(startDateTime))) {
        Alert.alert(t('assignment.invalidScheduleTitle'), t('assignment.endBeforeStart'));
        return;
      }

      setSubmitting(true);
      const result = await assignRental({
        carId,
        customerId,
        startDate: startDateTime.toISOString(),
        endDate: endDateUnset ? OPEN_ENDED_RENTAL_END_ISO : endDateTime.toISOString(),
        openEnded: endDateUnset,
        billingFrequency: frequency,
        rateAmount,
        collectFirstPaymentOnAssignment: false,
        rentDueWeekday: frequency === 'WEEKLY' ? rentDueWeekday : undefined,
        rentDueDayOfMonth: frequency === 'MONTHLY' ? rentDueDayOfMonth : undefined,
      });
      setSubmitting(false);

      if (!result.success) {
        Alert.alert(t('assignment.failedTitle'), result.error);
        return;
      }
      sheetRef.current?.close();
      onSuccess?.();
    };

    const rentDueMonthDate = useMemo(
      () => dayjs().date(rentDueDayOfMonth).toDate(),
      [rentDueDayOfMonth],
    );

    return (
      <AppBottomSheet ref={sheetRef} scrollable>
        <Text style={typography.h3}>{t('assignment.title')}</Text>
        <Text style={modalFormStyles.subtitle}>{t('assignment.subtitle')}</Text>

        <AppDropdown
          label={selectedCustomer?.name ?? t('assignment.selectCustomer')}
          options={customerOptions}
          onSelect={setCustomerId}
          fullWidth
          actions={[
            {
              label: t('assignment.addNewCustomer'),
              onPress: () => {
                sheetRef.current?.close();
                onAddCustomer?.();
              },
            },
          ]}
        />

        <Text style={modalFormStyles.fieldLabel}>{t('assignment.rentFrequency')}</Text>
        <SegmentedButtons
          value={frequency}
          onValueChange={v => setFrequency(v as BillingFrequency)}
          buttons={frequencyOptions}
          style={styles.segment}
        />

        <AppInput
          label={rateFieldLabel(frequency)}
          value={rate}
          onChangeText={setRate}
          keyboardType="numeric"
        />

        <Text style={modalFormStyles.fieldLabel}>{t('assignment.startDateTime')}</Text>
        <View style={styles.dateRow}>
          <AppButton
            label={t('assignment.startDateButton', {
              date: dayjs(startDatePart).format('DD MMM YYYY'),
            })}
            variant="outline"
            onPress={() => setShowStartDate(true)}
            fullWidth
          />
          <AppButton
            label={t('assignment.startTimeButton', {
              time: dayjs(startTimePart).format('h:mm A'),
            })}
            variant="outline"
            onPress={() => setShowStartTime(true)}
            fullWidth
          />
        </View>
        <Text style={styles.hint}>{formatDateTimeAmPm(startDateTime.toISOString())}</Text>

        <Text style={modalFormStyles.fieldLabel}>{t('assignment.endDateTime')}</Text>
        {endDateUnset ? (
          <Text style={styles.openEndedHint}>{t('assignment.endLeftBlank')}</Text>
        ) : (
          <>
            <View style={styles.dateRow}>
              <AppButton
                label={t('assignment.endDateButton', {
                  date: dayjs(endDatePart).format('DD MMM YYYY'),
                })}
                variant="outline"
                onPress={() => setShowEndDate(true)}
                fullWidth
              />
              <AppButton
                label={t('assignment.endTimeButton', {
                  time: dayjs(endTimePart).format('h:mm A'),
                })}
                variant="outline"
                onPress={() => setShowEndTime(true)}
                fullWidth
              />
            </View>
            <Text style={styles.hint}>{formatDateTimeAmPm(endDateTime.toISOString())}</Text>
          </>
        )}
        <AppButton
          label={
            endDateUnset ? t('assignment.setEndDateTime') : t('assignment.leaveEndBlank')
          }
          variant="outline"
          onPress={() => setEndDateUnset(prev => !prev)}
          fullWidth
        />

        {frequency === 'WEEKLY' ? (
          <View>
            <Text style={modalFormStyles.fieldLabel}>{t('assignment.rentPaidOn')}</Text>
            <WeekdayPicker value={rentDueWeekday} onChange={setRentDueWeekday} />
            <Text style={styles.dueHint}>
              {formatRentDueDaySummary('WEEKLY', rentDueWeekday)}
            </Text>
          </View>
        ) : null}

        {frequency === 'MONTHLY' ? (
          <View>
            <Text style={modalFormStyles.fieldLabel}>{t('assignment.rentDueDayOfMonth')}</Text>
            <AppButton
              label={t('common.dayOfMonthButton', { day: rentDueDayOfMonth })}
              variant="outline"
              onPress={() => setShowRentDueDay(true)}
              fullWidth
            />
            <Text style={styles.dueHint}>
              {formatRentDueDaySummary('MONTHLY', undefined, rentDueDayOfMonth)}
            </Text>
          </View>
        ) : null}

        {frequency === 'DAILY' ? (
          <Text style={styles.dueHint}>{formatRentDueDaySummary('DAILY')}</Text>
        ) : null}

        <AppButton
          label={t('assignment.confirmAssignment')}
          onPress={handleAssign}
          loading={submitting}
          fullWidth
        />

        <AppDatePickerModal
          open={showStartDate}
          date={startDatePart}
          minimumDate={getEarliestSelectableHistoryDate()}
          maximumDate={getLatestSelectableHistoryDate()}
          onConfirm={d => {
            setShowStartDate(false);
            setStartDatePart(d);
          }}
          onCancel={() => setShowStartDate(false)}
        />
        <AppDatePickerModal
          open={showStartTime}
          date={startTimePart}
          mode="time"
          onConfirm={d => {
            setShowStartTime(false);
            setStartTimePart(d);
          }}
          onCancel={() => setShowStartTime(false)}
        />
        <AppDatePickerModal
          open={showEndDate}
          date={endDatePart}
          minimumDate={startDatePart}
          maximumDate={getLatestSelectableHistoryDate()}
          onConfirm={d => {
            setShowEndDate(false);
            setEndDatePart(d);
          }}
          onCancel={() => setShowEndDate(false)}
        />
        <AppDatePickerModal
          open={showEndTime}
          date={endTimePart}
          mode="time"
          onConfirm={d => {
            setShowEndTime(false);
            setEndTimePart(d);
          }}
          onCancel={() => setShowEndTime(false)}
        />
        <AppDatePickerModal
          open={showRentDueDay}
          date={rentDueMonthDate}
          minimumDate={getEarliestSelectableHistoryDate()}
          maximumDate={getLatestSelectableHistoryDate()}
          onConfirm={d => {
            setShowRentDueDay(false);
            setRentDueDayOfMonth(Math.min(dayjs(d).date(), 28));
          }}
          onCancel={() => setShowRentDueDay(false)}
        />
      </AppBottomSheet>
    );
  },
);

const styles = StyleSheet.create({
  segment: {
    marginBottom: spacing.xs,
  },
  dateRow: {
    gap: spacing.sm,
  },
  dueHint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  openEndedHint: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
});
