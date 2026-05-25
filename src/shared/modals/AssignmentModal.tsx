import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Text, Menu } from 'react-native-paper';
import { AppBottomSheet, AppBottomSheetRef } from '@shared/bottomSheets/AppBottomSheet';
import { AppButton, AppInput, AppDatePickerModal } from '@shared/ui';
import { spacing, typography } from '@app/theme';
import { currencyFieldLabel } from '@core/constants/app';
import { useCustomerStore } from '@features/customers/store/useCustomerStore';
import { useRentalStore } from '@features/rentals/store/useRentalStore';
import dayjs from 'dayjs';

export interface AssignmentModalRef {
  open: (carId: string) => void;
  close: () => void;
}

interface AssignmentModalProps {
  onSuccess?: () => void;
  onAddCustomer?: () => void;
}

export const AssignmentModal = forwardRef<AssignmentModalRef, AssignmentModalProps>(
  ({ onSuccess, onAddCustomer }, ref) => {
    const sheetRef = useRef<AppBottomSheetRef>(null);
    const [carId, setCarId] = useState('');
    const [customerId, setCustomerId] = useState('');
    const [price, setPrice] = useState('0');
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(dayjs().add(7, 'day').toDate());
    const [showStart, setShowStart] = useState(false);
    const [showEnd, setShowEnd] = useState(false);
    const [menuVisible, setMenuVisible] = useState(false);

    const customers = useCustomerStore(s => s.customers);
    const assignRental = useRentalStore(s => s.assignRental);
    const selectedCustomer = customers.find(c => c.id === customerId);

    useImperativeHandle(ref, () => ({
      open: id => {
        setCarId(id);
        sheetRef.current?.open();
      },
      close: () => sheetRef.current?.close(),
    }));

    const handleAssign = async () => {
      if (!customerId) {
        Alert.alert('Select customer');
        return;
      }
      const result = await assignRental({
        carId,
        customerId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        agreedPrice: Number(price) || 0,
        paymentStatus: 'PENDING',
        status: 'UPCOMING',
      });
      if (!result.success) {
        Alert.alert('Assignment failed', result.error);
        return;
      }
      sheetRef.current?.close();
      onSuccess?.();
    };

    return (
      <AppBottomSheet ref={sheetRef} snapPoints={['75%']}>
        <Text style={typography.h3}>Assign Customer</Text>
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <AppButton
              label={selectedCustomer?.name ?? 'Select customer'}
              variant="outline"
              onPress={() => setMenuVisible(true)}
              style={styles.menuBtn}
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
            title="+ Add new customer"
            onPress={() => {
              setMenuVisible(false);
              onAddCustomer?.();
            }}
          />
        </Menu>
        <AppInput
          label={currencyFieldLabel('Agreed price')}
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
        />
        <AppButton
          label={`Start: ${dayjs(startDate).format('DD MMM YYYY')}`}
          variant="outline"
          onPress={() => setShowStart(true)}
        />
        <AppButton
          label={`End: ${dayjs(endDate).format('DD MMM YYYY')}`}
          variant="outline"
          onPress={() => setShowEnd(true)}
        />
        <AppButton label="Confirm Assignment" onPress={handleAssign} fullWidth />
        <AppDatePickerModal
          open={showStart}
          date={startDate}
          onConfirm={d => {
            setShowStart(false);
            setStartDate(d);
          }}
          onCancel={() => setShowStart(false)}
        />
        <AppDatePickerModal
          open={showEnd}
          date={endDate}
          minimumDate={startDate}
          onConfirm={d => {
            setShowEnd(false);
            setEndDate(d);
          }}
          onCancel={() => setShowEnd(false)}
        />
      </AppBottomSheet>
    );
  },
);

const styles = StyleSheet.create({
  menuBtn: { marginVertical: spacing.md },
});
