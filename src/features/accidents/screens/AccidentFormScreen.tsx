import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Menu, Switch, Text } from 'react-native-paper';
import { spacing } from '@app/theme';
import { currencyFieldLabel } from '@core/constants/app';
import {
  getEarliestSelectableHistoryDate,
  getLatestSelectableHistoryDate,
} from '@core/helpers/historyDates';
import { resolveCustomerCarId } from '@features/customers/helpers/resolveCustomerCarId';
import { useCarStore } from '@features/cars/store/useCarStore';
import { useCustomerStore } from '@features/customers/store/useCustomerStore';
import { useRentalStore } from '@features/rentals/store/useRentalStore';
import { ScreenLayout } from '@shared/layouts/ScreenLayout';
import { screenStyles } from '@shared/layouts/screenStyles';
import { AppButton, AppInput, AppDatePickerModal, ReadOnlyFormField } from '@shared/ui';
import { MediaUploader } from '@shared/media';
import { useAccidentStore } from '../store/useAccidentStore';
import dayjs from 'dayjs';

export const AccidentFormScreen = () => {
  const navigation = useNavigation();
  const addAccident = useAccidentStore(s => s.addAccident);
  const updateCustomer = useCustomerStore(s => s.updateCustomer);
  const customers = useCustomerStore(s => s.customers);
  const cars = useCarStore(s => s.cars);
  const rentals = useRentalStore(s => s.rentals);

  const [customerId, setCustomerId] = useState('');
  const [carId, setCarId] = useState('');
  const [description, setDescription] = useState('');
  const [damageCost, setDamageCost] = useState('');
  const [notes, setNotes] = useState('');
  const [proofImages, setProofImages] = useState<string[]>([]);
  const [blacklist, setBlacklist] = useState(false);
  const [accidentDate, setAccidentDate] = useState(new Date());
  const [showDate, setShowDate] = useState(false);
  const [customerMenu, setCustomerMenu] = useState(false);

  const selectedCustomer = customers.find(c => c.id === customerId);
  const selectedCar = cars.find(c => c.id === carId);

  useEffect(() => {
    if (!customerId) {
      setCarId('');
      return;
    }
    setCarId(resolveCustomerCarId(customerId, rentals) ?? '');
  }, [customerId, rentals]);

  const onSelectCustomer = (id: string) => {
    const linkedCarId = resolveCustomerCarId(id, rentals);
    if (!linkedCarId) {
      Alert.alert(
        'No car linked',
        'This customer has no active or past rental. Assign a car first.',
      );
      setCustomerMenu(false);
      return;
    }
    setCustomerId(id);
    setCustomerMenu(false);
  };

  const onSubmit = async () => {
    if (!customerId || !carId || !description || !damageCost) {
      Alert.alert('Fill all required fields');
      return;
    }

    await addAccident({
      customerId,
      carId,
      description,
      damageCost: Number(damageCost),
      accidentDate: accidentDate.toISOString(),
      proofImages,
      notes,
    });

    if (blacklist) {
      const customer = customers.find(c => c.id === customerId);
      if (customer) {
        await updateCustomer({ ...customer, isBlacklisted: true });
      }
    }

    navigation.goBack();
  };

  return (
    <ScreenLayout contentStyle={screenStyles.formStack}>
      <MediaUploader images={proofImages} onChange={setProofImages} maxImages={4} />
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
          <Menu.Item key={c.id} title={c.name} onPress={() => onSelectCustomer(c.id)} />
        ))}
      </Menu>

      <ReadOnlyFormField
        label="Car (from customer rental)"
        value={
          selectedCar?.name ??
          (customerId ? 'No car linked to this customer' : 'Select a customer first')
        }
        meta={
          selectedCar
            ? `${selectedCar.brand} ${selectedCar.model} · ${selectedCar.numberPlate}`
            : undefined
        }
      />

      <AppInput label="Description" value={description} onChangeText={setDescription} multiline />
      <AppInput
        label={currencyFieldLabel('Damage cost')}
        value={damageCost}
        onChangeText={setDamageCost}
        keyboardType="numeric"
      />
      <AppInput label="Notes" value={notes} onChangeText={setNotes} multiline />
      <View style={styles.switchRow}>
        <Text>Blacklist customer</Text>
        <Switch value={blacklist} onValueChange={setBlacklist} />
      </View>
      <AppButton
        label={`Date: ${dayjs(accidentDate).format('DD MMM YYYY')}`}
        variant="outline"
        onPress={() => setShowDate(true)}
      />
      <AppButton label="Save Record" onPress={onSubmit} fullWidth />
      <AppDatePickerModal
        open={showDate}
        date={accidentDate}
        minimumDate={getEarliestSelectableHistoryDate()}
        maximumDate={getLatestSelectableHistoryDate()}
        onConfirm={d => {
          setShowDate(false);
          setAccidentDate(d);
        }}
        onCancel={() => setShowDate(false)}
      />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
});
