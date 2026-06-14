import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Switch, Text } from 'react-native-paper';
import { useForm } from 'react-hook-form';
import type { CustomersStackParamList } from '@app/navigation/types';
import { spacing } from '@app/theme';
import type { CreateCustomerPayload } from '@core/types/domain';
import { ScreenLayout } from '@shared/layouts/ScreenLayout';
import { screenStyles } from '@shared/layouts/screenStyles';
import { AppButton, ControlledAppInput } from '@shared/ui';
import { MediaUploader } from '@shared/media';
import { useCustomerStore } from '../store/useCustomerStore';
import { useTranslation } from '@core/i18n';
import { useToastStore } from '@zustand/useToastStore';
import { readCustomerLicenseImage } from '../services/customerLicenseOcrService';
import type { CustomerLicenseExtraction } from '../services/customerLicenseAutofillService';

interface CustomerFormValues {
  name: string;
  age: string;
  phone: string;
  email: string;
  address: string;
  licenseNumber: string;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const CustomerFormScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<CustomersStackParamList>>();
  const route = useRoute<RouteProp<CustomersStackParamList, 'CustomerForm'>>();
  const customerId = route.params?.customerId;
  const getCustomerById = useCustomerStore(s => s.getCustomerById);
  const addCustomer = useCustomerStore(s => s.addCustomer);
  const updateCustomer = useCustomerStore(s => s.updateCustomer);
  const showToast = useToastStore(s => s.showToast);
  const existing = customerId ? getCustomerById(customerId) : undefined;

  const { control, getValues, handleSubmit, reset, setValue } = useForm<CustomerFormValues>({
    defaultValues: { name: '', age: '', phone: '', email: '', address: '', licenseNumber: '' },
  });

  const [licenseImages, setLicenseImages] = useState<string[]>([]);
  const [documents, setDocuments] = useState<string[]>([]);
  const [isBlacklisted, setBlacklisted] = useState(false);
  const [isReadingLicense, setReadingLicense] = useState(false);

  useEffect(() => {
    if (existing) {
      reset({
        name: existing.name,
        age: String(existing.age),
        phone: existing.phone,
        email: existing.email ?? '',
        address: existing.address,
        licenseNumber: existing.licenseNumber ?? '',
      });
      setLicenseImages(existing.drivingLicenseImages.slice(0, 1));
      setDocuments(existing.documents);
      setBlacklisted(existing.isBlacklisted);
    }
  }, [existing, reset]);

  const applyLicenseAutofill = useCallback(
    (extraction: CustomerLicenseExtraction): boolean => {
      const currentValues = getValues();
      let applied = false;

      if (extraction.name && !currentValues.name.trim()) {
        setValue('name', extraction.name, { shouldDirty: true, shouldValidate: true });
        applied = true;
      }

      if (extraction.age && !currentValues.age.trim()) {
        setValue('age', String(extraction.age), { shouldDirty: true, shouldValidate: true });
        applied = true;
      }

      if (extraction.address && !currentValues.address.trim()) {
        setValue('address', extraction.address, { shouldDirty: true, shouldValidate: true });
        applied = true;
      }

      if (extraction.licenseNumber && !currentValues.licenseNumber.trim()) {
        setValue('licenseNumber', extraction.licenseNumber, {
          shouldDirty: true,
          shouldValidate: true,
        });
        applied = true;
      }

      return applied;
    },
    [getValues, setValue],
  );

  const handleLicenseImagesAdded = useCallback(
    async (images: string[]) => {
      setReadingLicense(true);
      try {
        let hasExtractedFields = false;
        let hasAppliedFields = false;

        for (const imageUri of images) {
          const extraction = await readCustomerLicenseImage({ imageUri });
          const extractedFields = Boolean(
            extraction.name || extraction.age || extraction.address || extraction.licenseNumber,
          );
          hasExtractedFields = hasExtractedFields || extractedFields;
          hasAppliedFields = applyLicenseAutofill(extraction) || hasAppliedFields;
        }

        if (hasAppliedFields) {
          showToast(t('customers.licenseAutofillApplied'), { type: 'success' });
        } else if (hasExtractedFields) {
          showToast(t('customers.licenseAutofillSkipped'), { type: 'info' });
        } else {
          showToast(t('customers.licenseAutofillNoFieldsFound'), { type: 'warning' });
        }
      } catch {
        showToast(t('customers.licenseAutofillFailedMessage'), { type: 'error' });
      } finally {
        setReadingLicense(false);
      }
    },
    [applyLicenseAutofill, showToast, t],
  );

  const onSubmit = handleSubmit(async values => {
    if (!licenseImages.length) {
      showToast(t('customers.drivingLicenseRequired'), { type: 'error' });
      return;
    }

    const payload: CreateCustomerPayload = {
      name: values.name.trim(),
      age: Number(values.age),
      phone: values.phone.trim(),
      email: values.email.trim() || undefined,
      address: values.address.trim(),
      licenseNumber: values.licenseNumber.trim(),
      drivingLicenseImages: licenseImages.slice(0, 1),
      documents,
      isBlacklisted,
      photo: existing?.photo,
    };

    if (existing) {
      await updateCustomer({ ...existing, ...payload });
    } else {
      await addCustomer(payload);
    }
    navigation.goBack();
  });

  return (
    <ScreenLayout contentStyle={screenStyles.formStack}>
      <Text variant="titleMedium">{t('customers.drivingLicense')}</Text>
      <MediaUploader
        images={licenseImages}
        onChange={setLicenseImages}
        onImagesAdded={handleLicenseImagesAdded}
        maxImages={1}
      />
      {isReadingLicense ? (
        <Text style={styles.helperText}>{t('customers.licenseAutofillReading')}</Text>
      ) : null}
      <Text variant="titleMedium">{t('customers.documents')}</Text>
      <MediaUploader images={documents} onChange={setDocuments} maxImages={4} />
      <View style={styles.form}>
        <ControlledAppInput
          name="name"
          control={control}
          label={t('customers.fullName')}
          rules={{
            validate: value => value.trim().length > 0 || t('customers.nameRequired'),
          }}
        />
        <ControlledAppInput
          name="age"
          control={control}
          label={t('customers.age')}
          keyboardType="numeric"
        />
        <ControlledAppInput
          name="phone"
          control={control}
          label={t('customers.phone')}
          keyboardType="phone-pad"
        />
        <ControlledAppInput
          name="email"
          control={control}
          label={t('customers.email')}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          rules={{
            validate: value =>
              !value.trim() || emailPattern.test(value.trim()) || t('customers.invalidEmail'),
          }}
        />
        <ControlledAppInput
          name="licenseNumber"
          control={control}
          label={t('customers.licenseNumber')}
          keyboardType="numeric"
          rules={{
            validate: value => value.trim().length > 0 || t('customers.licenseNumberRequired'),
          }}
        />
        <ControlledAppInput
          name="address"
          control={control}
          label={t('customers.address')}
          multiline
          rules={{
            validate: value => value.trim().length > 0 || t('customers.addressRequired'),
          }}
        />
        <View style={styles.switchRow}>
          <Text>{t('customers.blacklistedLabel')}</Text>
          <Switch value={isBlacklisted} onValueChange={setBlacklisted} />
        </View>
        <AppButton
          label={customerId ? t('common.save') : t('customers.addCustomer')}
          onPress={onSubmit}
          fullWidth
        />
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  form: { marginTop: spacing.lg },
  helperText: {
    marginTop: -spacing.xs,
    marginBottom: spacing.sm,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
});
