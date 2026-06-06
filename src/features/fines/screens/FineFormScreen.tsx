import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Menu, Switch, Text } from 'react-native-paper';
import type { FineFlowParamList } from '@app/navigation/types';
import { colors, spacing } from '@app/theme';
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
import type { MediaUri } from '@core/types/media';
import { ScreenLayout } from '@shared/layouts/ScreenLayout';
import { screenStyles } from '@shared/layouts/screenStyles';
import { AppButton, AppInput, AppDatePickerModal, ReadOnlyFormField } from '@shared/ui';
import { ImageSlider, MediaUploader } from '@shared/media';
import { useFineStore } from '../store/useFineStore';
import { readFineDocumentImage } from '../services/fineDocumentOcrService';
import { resolveRentalForFineDate } from '../services/fineDocumentAutofillService';
import dayjs from 'dayjs';
import { useTranslation } from '@core/i18n';
import { useToastStore } from '@zustand/useToastStore';

export const FineFormScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<FineFlowParamList, 'FineForm'>>();
  const addFine = useFineStore(s => s.addFine);
  const updateFine = useFineStore(s => s.updateFine);
  const fines = useFineStore(s => s.fines);
  const showToast = useToastStore(s => s.showToast);
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
  const [isReadingDocument, setIsReadingDocument] = useState(false);
  const [autofillStatus, setAutofillStatus] = useState('');
  const [detectedNumberPlate, setDetectedNumberPlate] = useState<string | undefined>();

  const selectedCustomer = customers.find(c => c.id === customerId);
  const selectedCar = cars.find(c => c.id === carId);
  const selectedCustomerLicenseLabel = customerLicenseLabel(selectedCustomer);

  useEffect(() => {
    if (!customerId) {
      setCarId('');
      return;
    }
    const fineDateValue = dayjs(fineDate).startOf('day').valueOf();
    const rentalOnFineDate = rentals.find(r => {
      const rentalStart = dayjs(r.startDate).startOf('day').valueOf();
      const rentalEnd = dayjs(r.endDate).endOf('day').valueOf();
      return r.customerId === customerId && fineDateValue >= rentalStart && fineDateValue <= rentalEnd;
    });
    setCarId(rentalOnFineDate?.carId ?? resolveCustomerCarId(customerId, rentals) ?? '');
  }, [customerId, fineDate, rentals]);

  useEffect(() => {
    if (!detectedNumberPlate) {
      return;
    }

    const match = resolveRentalForFineDate({
      fineDate,
      cars,
      customers,
      rentals,
      numberPlate: detectedNumberPlate,
    });

    if (match.customerId) {
      setCustomerId(match.customerId);
    }
    if (match.carId) {
      setCarId(match.carId);
    }
  }, [cars, customers, detectedNumberPlate, fineDate, rentals]);

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

  const handleDocumentImagesAdded = useCallback(
    async (images: MediaUri[]) => {
      const imageUri = images[0];
      if (!imageUri) {
        return;
      }

      setIsReadingDocument(true);
      setAutofillStatus(t('fines.autofillReading'));

      try {
        const extraction = await readFineDocumentImage({
          imageUri,
          cars,
          customers,
          rentals,
        });

        if (extraction.fineDate) {
          setFineDate(extraction.fineDate);
        }
        if (extraction.amount && !amount) {
          setAmount(String(extraction.amount));
        }
        if (extraction.reason && !reason) {
          setReason(extraction.reason);
        }
        if (extraction.numberPlate) {
          setDetectedNumberPlate(extraction.numberPlate);
        }
        if (extraction.customerId) {
          setCustomerId(extraction.customerId);
        }
        if (extraction.carId) {
          setCarId(extraction.carId);
        }

        const didAutofill =
          extraction.amount ||
          extraction.fineDate ||
          extraction.customerId ||
          extraction.carId ||
          extraction.reason;
        setAutofillStatus(
          didAutofill ? t('fines.autofillApplied') : t('fines.autofillNoFieldsFound'),
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : t('fines.autofillFailedMessage');
        setAutofillStatus(t('fines.autofillFailed'));
        showToast(message, { type: 'error' });
      } finally {
        setIsReadingDocument(false);
      }
    },
    [amount, cars, customers, reason, rentals, showToast, t],
  );

  const onSubmit = async () => {
    if (!customerId || !carId || !amount || !reason) {
      showToast(t('fines.fillRequired'), { type: 'warning' });
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
      <MediaUploader
        images={proofImages}
        onChange={setProofImages}
        onImagesAdded={handleDocumentImagesAdded}
        maxImages={3}
      />
      {(isReadingDocument || autofillStatus) ? (
        <View style={styles.autofillStatus}>
          {isReadingDocument ? <ActivityIndicator size="small" color={colors.primary} /> : null}
          <Text style={styles.autofillStatusText}>{autofillStatus}</Text>
        </View>
      ) : null}
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
      {selectedCustomer?.drivingLicenseImages.length ? (
        <View style={styles.licensePreview}>
          <Text variant="titleMedium">{t('customers.drivingLicense')}</Text>
          <ImageSlider images={selectedCustomer.drivingLicenseImages} imageHeight={140} />
        </View>
      ) : null}

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
  autofillStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  autofillStatusText: {
    color: colors.textSecondary,
    flex: 1,
  },
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
  licensePreview: {
    gap: spacing.sm,
  },
});
