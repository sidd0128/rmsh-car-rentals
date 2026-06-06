import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Menu, Switch, Text } from 'react-native-paper';
import { spacing } from '@app/theme';
import { colors } from '@app/theme';
import { currencyFieldLabel } from '@core/constants/app';
import {
  getEarliestSelectableHistoryDate,
  getLatestSelectableHistoryDate,
} from '@core/helpers/historyDates';
import { resolveCustomerCarId } from '@features/customers/helpers/resolveCustomerCarId';
import { customerLicenseLabel } from '@features/customers/helpers/customerLicenseDisplay';
import { useCarStore } from '@features/cars/store/useCarStore';
import { useCustomerStore } from '@features/customers/store/useCustomerStore';
import { useRentalStore } from '@features/rentals/store/useRentalStore';
import { ScreenLayout } from '@shared/layouts/ScreenLayout';
import { screenStyles } from '@shared/layouts/screenStyles';
import { AppButton, AppInput, AppDatePickerModal, ReadOnlyFormField } from '@shared/ui';
import { MediaUploader } from '@shared/media';
import { useAccidentStore } from '../store/useAccidentStore';
import dayjs from 'dayjs';
import { useTranslation } from '@core/i18n';
import { useToastStore } from '@zustand/useToastStore';

export const AccidentFormScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const addAccident = useAccidentStore(s => s.addAccident);
  const updateCustomer = useCustomerStore(s => s.updateCustomer);
  const showToast = useToastStore(s => s.showToast);
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
  const selectedCustomerLicenseLabel = customerLicenseLabel(selectedCustomer);

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
      showToast(t('fines.noCarLinkedMessage'), { type: 'warning' });
      setCustomerMenu(false);
      return;
    }
    setCustomerId(id);
    setCustomerMenu(false);
  };

  const onSubmit = async () => {
    if (!customerId || !carId || !description || !damageCost) {
      showToast(t('accidents.fillRequired'), { type: 'warning' });
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
          <View>
            <AppButton
              label={selectedCustomer?.name ?? t('fines.selectCustomer')}
              variant="outline"
              onPress={() => setCustomerMenu(true)}
            />
            {selectedCustomerLicenseLabel ? (
              <Text style={styles.customerLicenseText}>{selectedCustomerLicenseLabel}</Text>
            ) : null}
          </View>
        }
      >
        {customers.map(c => (
          <Menu.Item
            key={c.id}
            title={
              <View>
                <Text>{c.name}</Text>
                {customerLicenseLabel(c) ? (
                  <Text style={styles.menuLicenseText}>{customerLicenseLabel(c)}</Text>
                ) : null}
              </View>
            }
            style={styles.customerMenuItem}
            onPress={() => onSelectCustomer(c.id)}
          />
        ))}
      </Menu>

      <ReadOnlyFormField
        label={t('fines.carFromRental')}
        value={
          selectedCar?.name ??
          (customerId ? t('fines.noCarLinked') : t('fines.selectCustomerFirst'))
        }
        meta={
          selectedCar
            ? `${selectedCar.brand} ${selectedCar.model} · ${selectedCar.numberPlate}`
            : undefined
        }
      />

      <AppInput
        label={t('accidents.description')}
        value={description}
        onChangeText={setDescription}
        multiline
      />
      <AppInput
        label={currencyFieldLabel(t('accidents.damageCost'))}
        value={damageCost}
        onChangeText={setDamageCost}
        keyboardType="numeric"
      />
      <AppInput label={t('common.notes')} value={notes} onChangeText={setNotes} multiline />
      <View style={styles.switchRow}>
        <Text>{t('accidents.blacklistCustomer')}</Text>
        <Switch value={blacklist} onValueChange={setBlacklist} />
      </View>
      <AppButton
        label={t('common.dateButton', { date: dayjs(accidentDate).format('DD MMM YYYY') })}
        variant="outline"
        onPress={() => setShowDate(true)}
      />
      <AppButton label={t('accidents.saveRecord')} onPress={onSubmit} fullWidth />
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
  customerLicenseText: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  customerMenuItem: {
    minHeight: 56,
  },
  menuLicenseText: {
    color: colors.textSecondary,
    marginTop: 2,
  },
});
