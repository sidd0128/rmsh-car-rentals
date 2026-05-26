import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
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

interface CustomerFormValues {
  name: string;
  age: string;
  phone: string;
  address: string;
}

export const CustomerFormScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<CustomersStackParamList>>();
  const route = useRoute<RouteProp<CustomersStackParamList, 'CustomerForm'>>();
  const customerId = route.params?.customerId;
  const getCustomerById = useCustomerStore(s => s.getCustomerById);
  const addCustomer = useCustomerStore(s => s.addCustomer);
  const updateCustomer = useCustomerStore(s => s.updateCustomer);
  const existing = customerId ? getCustomerById(customerId) : undefined;

  const { control, handleSubmit, reset } = useForm<CustomerFormValues>({
    defaultValues: { name: '', age: '', phone: '', address: '' },
  });

  const [licenseImages, setLicenseImages] = useState<string[]>([]);
  const [documents, setDocuments] = useState<string[]>([]);
  const [isBlacklisted, setBlacklisted] = useState(false);

  useEffect(() => {
    if (existing) {
      reset({
        name: existing.name,
        age: String(existing.age),
        phone: existing.phone,
        address: existing.address,
      });
      setLicenseImages(existing.drivingLicenseImages);
      setDocuments(existing.documents);
      setBlacklisted(existing.isBlacklisted);
    }
  }, [existing, reset]);

  const onSubmit = handleSubmit(async values => {
    const payload: CreateCustomerPayload = {
      name: values.name.trim(),
      age: Number(values.age),
      phone: values.phone.trim(),
      address: values.address.trim(),
      drivingLicenseImages: licenseImages,
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
      <MediaUploader images={licenseImages} onChange={setLicenseImages} maxImages={2} />
      <Text variant="titleMedium">{t('customers.documents')}</Text>
      <MediaUploader images={documents} onChange={setDocuments} maxImages={4} />
      <View style={styles.form}>
        <ControlledAppInput name="name" control={control} label={t('customers.fullName')} />
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
          name="address"
          control={control}
          label={t('customers.address')}
          multiline
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
});
