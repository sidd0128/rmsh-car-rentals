import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Menu, Switch, Text } from 'react-native-paper';
import type { SettingsStackParamList } from '@app/navigation/types';
import { spacing } from '@app/theme';
import { currencyFieldLabel } from '@core/constants/app';
import { useCarStore } from '@features/cars/store/useCarStore';
import { useCustomerStore } from '@features/customers/store/useCustomerStore';
import { ScreenLayout } from '@shared/layouts/ScreenLayout';
import { AppButton, AppInput, AppDatePickerModal } from '@shared/ui';
import { MediaUploader } from '@shared/media';
import { useFineStore } from '../store/useFineStore';
import dayjs from 'dayjs';

export const FineFormScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<SettingsStackParamList, 'FineForm'>>();
  const addFine = useFineStore(s => s.addFine);
  const updateFine = useFineStore(s => s.updateFine);
  const fines = useFineStore(s => s.fines);
  const existing = route.params?.fineId
    ? fines.find(f => f.id === route.params.fineId)
    : undefined;

  const customers = useCustomerStore(s => s.customers);
  const cars = useCarStore(s => s.cars);

  const [customerId, setCustomerId] = useState(existing?.customerId ?? '');
  const [carId, setCarId] = useState(existing?.carId ?? '');
  const [amount, setAmount] = useState(String(existing?.amount ?? ''));
  const [reason, setReason] = useState(existing?.reason ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [paidStatus, setPaidStatus] = useState(existing?.paidStatus ?? false);
  const [proofImages, setProofImages] = useState<string[]>(existing?.proofImages ?? []);
  const [fineDate, setFineDate] = useState(
    existing ? new Date(existing.fineDate) : new Date(),
  );
  const [showDate, setShowDate] = useState(false);
  const [customerMenu, setCustomerMenu] = useState(false);
  const [carMenu, setCarMenu] = useState(false);

  const selectedCustomer = customers.find(c => c.id === customerId);
  const selectedCar = cars.find(c => c.id === carId);

  const onSubmit = async () => {
    if (!customerId || !carId || !amount || !reason) {
      Alert.alert('Fill all required fields');
      return;
    }

    if (existing) {
      await updateFine({
        ...existing,
        amount: Number(amount),
        reason,
        notes,
        paidStatus,
        proofImages,
        fineDate: fineDate.toISOString(),
      });
    } else {
      await addFine({
        customerId,
        carId,
        amount: Number(amount),
        reason,
        fineDate: fineDate.toISOString(),
        paidStatus,
        proofImages,
        notes,
      });
    }
    navigation.goBack();
  };

  return (
    <ScreenLayout>
      <MediaUploader images={proofImages} onChange={setProofImages} maxImages={3} />
      <Menu
        visible={customerMenu}
        onDismiss={() => setCustomerMenu(false)}
        anchor={
          <AppButton
            label={selectedCustomer?.name ?? 'Select customer'}
            variant="outline"
            onPress={() => setCustomerMenu(true)}
          />
        }
      >
        {customers.map(c => (
          <Menu.Item key={c.id} title={c.name} onPress={() => { setCustomerId(c.id); setCustomerMenu(false); }} />
        ))}
      </Menu>
      <Menu
        visible={carMenu}
        onDismiss={() => setCarMenu(false)}
        anchor={
          <AppButton
            label={selectedCar?.name ?? 'Select car'}
            variant="outline"
            onPress={() => setCarMenu(true)}
            style={styles.menuBtn}
          />
        }
      >
        {cars.map(c => (
          <Menu.Item key={c.id} title={c.name} onPress={() => { setCarId(c.id); setCarMenu(false); }} />
        ))}
      </Menu>
      <AppInput
        label={currencyFieldLabel('Amount')}
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
      />
      <AppInput label="Reason" value={reason} onChangeText={setReason} />
      <AppInput label="Notes" value={notes} onChangeText={setNotes} multiline />
      <View style={styles.switchRow}>
        <Text>Paid</Text>
        <Switch value={paidStatus} onValueChange={setPaidStatus} />
      </View>
      <AppButton
        label={`Date: ${dayjs(fineDate).format('DD MMM YYYY')}`}
        variant="outline"
        onPress={() => setShowDate(true)}
      />
      <AppButton label="Save Fine" onPress={onSubmit} fullWidth />
      <AppDatePickerModal
        open={showDate}
        date={fineDate}
        onConfirm={d => {
          setShowDate(false);
          setFineDate(d);
        }}
        onCancel={() => setShowDate(false)}
      />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  menuBtn: { marginVertical: spacing.sm },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
});
