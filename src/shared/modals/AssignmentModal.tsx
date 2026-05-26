import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Menu, SegmentedButtons, Switch, Text } from 'react-native-paper';
import { AppBottomSheet, AppBottomSheetRef } from '@shared/bottomSheets/AppBottomSheet';
import { AppButton, AppInput, AppDatePickerModal, WeekdayPicker } from '@shared/ui';
import { colors, spacing, typography } from '@app/theme';
import { modalFormStyles } from '@shared/modals/modalFormStyles';
import type { BillingFrequency } from '@core/types/domain';
import {
  calculateRentalBillingPreview,
  formatRentDueDaySummary,
  rateFieldLabel,
} from '@core/services/rentalBillingService';
import { formatCurrency } from '@core/utils/currency';
import { useCarStore } from '@features/cars/store/useCarStore';
import { useCustomerStore } from '@features/customers/store/useCustomerStore';
import { RentalBillingBreakdown } from '@features/rentals/components/RentalBillingBreakdown';
import { useRentalStore } from '@features/rentals/store/useRentalStore';
import {
  getEarliestSelectableHistoryDate,
  getLatestSelectableHistoryDate,
} from '@core/helpers/historyDates';
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
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(dayjs().add(7, 'day').toDate());
    const [rentDueWeekday, setRentDueWeekday] = useState<number>(() => dayjs().day());
    const [rentDueDayOfMonth, setRentDueDayOfMonth] = useState(() =>
      Math.min(dayjs().date(), 28),
    );
    const [collectFirstOnAssignment, setCollectFirstOnAssignment] = useState(false);
    const [showStart, setShowStart] = useState(false);
    const [showEnd, setShowEnd] = useState(false);
    const [showRentDueDay, setShowRentDueDay] = useState(false);
    const [menuVisible, setMenuVisible] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const customers = useCustomerStore(s => s.customers);
    const car = useCarStore(s => (carId ? s.getCarById(carId) : undefined));
    const assignRental = useRentalStore(s => s.assignRental);
    const selectedCustomer = customers.find(c => c.id === customerId);

    useImperativeHandle(ref, () => ({
      open: id => {
        setCarId(id);
        setCustomerId('');
        setCollectFirstOnAssignment(false);
        const today = new Date();
        setStartDate(today);
        setEndDate(dayjs().add(7, 'day').toDate());
        setRentDueWeekday(dayjs(today).day());
        setRentDueDayOfMonth(Math.min(dayjs(today).date(), 28));
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

    const billingPreview = useMemo(() => {
      const rateAmount = Number(rate);
      if (!Number.isFinite(rateAmount) || rateAmount <= 0) {
        return { installments: [], totalAmount: 0, rentalDayCount: 0 };
      }
      return calculateRentalBillingPreview({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        frequency,
        rateAmount,
        rentDueWeekday: frequency === 'WEEKLY' ? rentDueWeekday : undefined,
        rentDueDayOfMonth: frequency === 'MONTHLY' ? rentDueDayOfMonth : undefined,
      });
    }, [startDate, endDate, frequency, rate, rentDueWeekday, rentDueDayOfMonth]);

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
      if (billingPreview.installments.length === 0) {
        Alert.alert(t('assignment.invalidScheduleTitle'), t('assignment.invalidScheduleMessage'));
        return;
      }

      setSubmitting(true);
      const result = await assignRental({
        carId,
        customerId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        billingFrequency: frequency,
        rateAmount,
        collectFirstPaymentOnAssignment: collectFirstOnAssignment,
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

        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <AppButton
              label={selectedCustomer?.name ?? t('assignment.selectCustomer')}
              variant="outline"
              onPress={() => setMenuVisible(true)}
              fullWidth
            />
          }
        >
          {customers.map(c => (
            <Menu.Item
              key={c.id}
              title={c.name}
              onPress={() => {
                setCustomerId(c.id);
                setMenuVisible(false);
              }}
            />
          ))}
          <Menu.Item
            title={t('assignment.addNewCustomer')}
            onPress={() => {
              setMenuVisible(false);
              sheetRef.current?.close();
              onAddCustomer?.();
            }}
          />
        </Menu>

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

        <View style={styles.dateRow}>
          <AppButton
            label={t('common.startDateButton', {
              date: dayjs(startDate).format('DD MMM YYYY'),
            })}
            variant="outline"
            onPress={() => setShowStart(true)}
            fullWidth
          />
          <AppButton
            label={t('common.endDateButton', {
              date: dayjs(endDate).format('DD MMM YYYY'),
            })}
            variant="outline"
            onPress={() => setShowEnd(true)}
            fullWidth
          />
        </View>

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

        <View style={modalFormStyles.switchRow}>
          <View style={modalFormStyles.switchText}>
            <Text style={typography.body}>{t('assignment.collectFirstToday')}</Text>
            <Text style={modalFormStyles.switchHint}>{t('assignment.collectFirstHint')}</Text>
          </View>
          <Switch value={collectFirstOnAssignment} onValueChange={setCollectFirstOnAssignment} />
        </View>

        <RentalBillingBreakdown
          installments={billingPreview.installments}
          totalAmount={billingPreview.totalAmount}
          rentalDayCount={billingPreview.rentalDayCount}
          collectFirstOnAssignment={collectFirstOnAssignment}
        />

        <AppButton
          label={
            billingPreview.totalAmount > 0
              ? t('assignment.confirmTotal', {
                  amount: formatCurrency(billingPreview.totalAmount),
                })
              : t('assignment.confirmAssignment')
          }
          onPress={handleAssign}
          loading={submitting}
          fullWidth
          disabled={billingPreview.installments.length === 0}
        />

        <AppDatePickerModal
          open={showStart}
          date={startDate}
          minimumDate={getEarliestSelectableHistoryDate()}
          maximumDate={getLatestSelectableHistoryDate()}
          onConfirm={d => {
            setShowStart(false);
            setStartDate(d);
            if (dayjs(endDate).isBefore(dayjs(d), 'day')) {
              setEndDate(d);
            }
          }}
          onCancel={() => setShowStart(false)}
        />
        <AppDatePickerModal
          open={showEnd}
          date={endDate}
          minimumDate={startDate}
          maximumDate={getLatestSelectableHistoryDate()}
          onConfirm={d => {
            setShowEnd(false);
            setEndDate(d);
          }}
          onCancel={() => setShowEnd(false)}
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
});
