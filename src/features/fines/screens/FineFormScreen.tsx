import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Menu, Switch, Text } from 'react-native-paper';
import type { FineFlowParamList } from '@app/navigation/types';
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
import { useFineStore } from '../store/useFineStore';
import dayjs from 'dayjs';
import { useTranslation } from '@core/i18n';

export const FineFormScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<FineFlowParamList, 'FineForm'>>();
  const addFine = useFineStore(s => s.addFine);
  const updateFine = useFineStore(s => s.updateFine);
  const fines = useFineStore(s => s.fines);
  const existing = route.params?.fineId
    ? fines.find(f => f.id === route.params.fineId)
    : undefined;

  const customers = useCustomerStore(s => s.customers);
  const cars = useCarStore(s => s.cars);
  const rentals = useRentalStore(s => s.rentals);

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
      Alert.alert(t('fines.noCarLinkedTitle'), t('fines.noCarLinkedMessage'));
      setCustomerMenu(false);
      return;
    }
    setCustomerId(id);
    setCustomerMenu(false);
  };

  const onSubmit = async () => {
    if (!customerId || !carId || !amount || !reason) {
      Alert.alert(t('fines.fillRequired'));
      return;
    }

    if (existing) {
      await updateFine({
        ...existing,
        customerId,
        carId,
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
    <ScreenLayout contentStyle={screenStyles.formStack}>
      <MediaUploader images={proofImages} onChange={setProofImages} maxImages={3} />
      <Menu
        visible={customerMenu}
        onDismiss={() => setCustomerMenu(false)}
        anchor={
          <AppButton
            label={selectedCustomer?.name ?? t('fines.selectCustomer')}
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
        label={currencyFieldLabel(t('fines.amount'))}
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
      />
      <AppInput label={t('fines.reason')} value={reason} onChangeText={setReason} />
      <AppInput label={t('common.notes')} value={notes} onChangeText={setNotes} multiline />
      <View style={styles.switchRow}>
        <Text>{t('fines.paidSwitch')}</Text>
        <Switch value={paidStatus} onValueChange={setPaidStatus} />
      </View>
      <AppButton
        label={t('common.dateButton', { date: dayjs(fineDate).format('DD MMM YYYY') })}
        variant="outline"
        onPress={() => setShowDate(true)}
      />
      <AppButton label={t('fines.saveFine')} onPress={onSubmit} fullWidth />
      <AppDatePickerModal
        open={showDate}
        date={fineDate}
        minimumDate={getEarliestSelectableHistoryDate()}
        maximumDate={getLatestSelectableHistoryDate()}
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
});
