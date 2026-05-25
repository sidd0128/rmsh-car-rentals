import React, { memo, useEffect, useState } from 'react';
import { Modal, Platform, StyleSheet, View } from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Text } from 'react-native-paper';
import { colors, spacing, radius, typography } from '@app/theme';
import { AppButton } from './AppButton';

export interface AppDatePickerModalProps {
  open: boolean;
  date: Date;
  mode?: 'date' | 'time' | 'datetime';
  minimumDate?: Date;
  maximumDate?: Date;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
}

/**
 * Modal date picker compatible with New Architecture (RN 0.85+).
 * Replaces react-native-date-picker which crashes with RCTModuleProvider on iOS.
 */
export const AppDatePickerModal = memo<AppDatePickerModalProps>(
  ({ open, date, mode = 'date', minimumDate, maximumDate, onConfirm, onCancel }) => {
    const [tempDate, setTempDate] = useState(date);

    useEffect(() => {
      if (open) {
        setTempDate(date);
      }
    }, [open, date]);

    if (!open) {
      return null;
    }

    if (Platform.OS === 'android') {
      return (
        <DateTimePicker
          value={date}
          mode={mode === 'datetime' ? 'date' : mode}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
            if (event.type === 'dismissed') {
              onCancel();
              return;
            }
            if (selectedDate) {
              onConfirm(selectedDate);
            }
          }}
        />
      );
    }

    return (
      <Modal visible transparent animationType="slide" onRequestClose={onCancel}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={typography.h3}>Select date</Text>
            <DateTimePicker
              value={tempDate}
              mode={mode === 'datetime' ? 'date' : mode}
              display="spinner"
              minimumDate={minimumDate}
              maximumDate={maximumDate}
              onChange={(_, selected) => {
                if (selected) {
                  setTempDate(selected);
                }
              }}
              style={styles.picker}
            />
            <View style={styles.actions}>
              <AppButton label="Cancel" variant="outline" onPress={onCancel} style={styles.btn} />
              <AppButton
                label="Confirm"
                onPress={() => onConfirm(tempDate)}
                style={styles.btn}
              />
            </View>
          </View>
        </View>
      </Modal>
    );
  },
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  picker: { height: 200 },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  btn: { flex: 1 },
});
