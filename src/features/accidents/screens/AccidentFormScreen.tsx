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
import { useAccidentStore } from '../store/useAccidentStore';
import dayjs from 'dayjs';

export const AccidentFormScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<SettingsStackParamList, 'AccidentForm'>>();
  const addAccident = useAccidentStore(s => s.addAccident);
  const accidents = useAccidentStore(s => s.accidents);
  const updateCustomer = useCustomerStore(s => s.updateCustomer);
  const customers = useCustomerStore(s => s.customers);
  const cars = useCarStore(s => s.cars);

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
  const [carMenu, setCarMenu] = useState(false);

  const selectedCustomer = customers.find(c => c.id === customerId);
  const selectedCar = cars.find(c => c.id === carId);

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
    <ScreenLayout>
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
  menuBtn: { marginVertical: spacing.sm },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
});
