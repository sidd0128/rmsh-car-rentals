import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import dayjs from 'dayjs';
import { AppBottomSheet, AppBottomSheetRef } from '@shared/bottomSheets/AppBottomSheet';
import { AppButton, AppDatePickerModal } from '@shared/ui';
import { typography } from '@app/theme';
import { modalFormStyles } from '@shared/modals/modalFormStyles';
import { screenStyles } from '@shared/layouts/screenStyles';
import { formatDateTimeAmPm } from '@core/helpers/date';
import { formatRentalEndDisplay, mergeDateAndTime } from '@core/helpers/rentalDisplay';
import { getLatestSelectableHistoryDate } from '@core/helpers/historyDates';
import type { Rental } from '@core/types/domain';
import { useRentalStore } from '@features/rentals/store/useRentalStore';
import { useTranslation } from '@core/i18n';
import { useThemeContext } from '@contextApis/theme/useThemeContext';

export interface SetRentalEndModalRef {
  open: (rental: Rental) => void;
  close: () => void;
}

interface SetRentalEndModalProps {
  onSuccess?: () => void;
}

export const SetRentalEndModal = forwardRef<SetRentalEndModalRef, SetRentalEndModalProps>(
  ({ onSuccess }, ref) => {
    const { t } = useTranslation();
    const { colors } = useThemeContext();
    const sheetRef = useRef<AppBottomSheetRef>(null);
    const [rental, setRental] = useState<Rental | null>(null);
    const [endDatePart, setEndDatePart] = useState(new Date());
    const [endTimePart, setEndTimePart] = useState(new Date());
    const [showEndDate, setShowEndDate] = useState(false);
    const [showEndTime, setShowEndTime] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const setRentalEndDate = useRentalStore(s => s.setRentalEndDate);

    useImperativeHandle(ref, () => ({
      open: source => {
        setRental(source);
        const defaultEnd = dayjs().add(7, 'day');
        const rentalStart = dayjs(source.startDate);
        const suggested = defaultEnd.isBefore(rentalStart)
          ? rentalStart.add(1, 'day')
          : defaultEnd;
        setEndDatePart(suggested.toDate());
        setEndTimePart(suggested.toDate());
        sheetRef.current?.open();
      },
      close: () => sheetRef.current?.close(),
    }));

    const handleConfirm = async () => {
      if (!rental) {
        return;
      }
      const endIso = mergeDateAndTime(endDatePart, endTimePart).toISOString();
      setSubmitting(true);
      const result = await setRentalEndDate(rental.id, endIso);
      setSubmitting(false);

      if (!result.success) {
        Alert.alert(t('rentals.setEndFailedTitle'), result.error);
        return;
      }
      sheetRef.current?.close();
      onSuccess?.();
    };

    if (!rental) {
      return null;
    }

    const endDateTime = mergeDateAndTime(endDatePart, endTimePart);

    return (
      <AppBottomSheet ref={sheetRef} scrollable>
        <Text style={typography.h3}>{t('rentals.setEndTitle')}</Text>
        <Text style={[modalFormStyles.subtitle, { color: colors.textSecondary }]}>
          {t('rentals.setEndSubtitle')}
        </Text>

        <View
          style={[
            screenStyles.insetPanel,
            { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight },
          ]}
        >
          <Text style={typography.bodySmall}>{t('rentals.currentPeriod')}</Text>
          <Text style={typography.body}>
            {formatDateTimeAmPm(rental.startDate)} – {formatRentalEndDisplay(rental.endDate)}
          </Text>
        </View>

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

        <Text style={styles.preview}>
          {t('rentals.newEndPreview', { datetime: formatDateTimeAmPm(endDateTime.toISOString()) })}
        </Text>

        <AppButton
          label={t('rentals.saveEndDateTime')}
          onPress={handleConfirm}
          loading={submitting}
          fullWidth
        />

        <AppDatePickerModal
          open={showEndDate}
          date={endDatePart}
          minimumDate={dayjs(rental.startDate).toDate()}
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
      </AppBottomSheet>
    );
  },
);

const styles = StyleSheet.create({
  preview: {
    ...typography.bodySmall,
    marginVertical: 12,
  },
});
