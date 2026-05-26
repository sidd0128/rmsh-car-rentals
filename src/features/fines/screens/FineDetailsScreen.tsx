import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import type { CarsStackParamList, FineFlowParamList } from '@app/navigation/types';
import { spacing, typography } from '@app/theme';
import { formatDate } from '@core/helpers/date';
import { formatCurrency } from '@core/utils/currency';
import { useCarStore } from '@features/cars/store/useCarStore';
import { useCustomerStore } from '@features/customers/store/useCustomerStore';
import { ImageSlider } from '@shared/media';
import { ScreenLayout } from '@shared/layouts/ScreenLayout';
import { ScreenSection } from '@shared/layouts/ScreenSection';
import { AppButton, ReadOnlyFormField, StatusBadge } from '@shared/ui';
import { useFineStore } from '../store/useFineStore';
import { useTranslation } from '@core/i18n';

type FineDetailsRoute = RouteProp<FineFlowParamList, 'FineDetails'>;
type FineDetailsNavigation = NativeStackNavigationProp<
  FineFlowParamList & Pick<CarsStackParamList, 'FineDetails'>
>;

export const FineDetailsScreen = () => {
  const { t } = useTranslation();
  const route = useRoute<FineDetailsRoute>();
  const navigation = useNavigation<FineDetailsNavigation>();
  const tabState = navigation.getParent()?.getState();
  const activeTabRoute = tabState?.routes[tabState.index ?? 0];
  const openedFromCarsTab = activeTabRoute?.name === 'CarsTab';
  const fine = useFineStore(s => s.fines.find(f => f.id === route.params.fineId));
  const customers = useCustomerStore(s => s.customers);
  const cars = useCarStore(s => s.cars);

  if (!fine) {
    return (
      <ScreenLayout>
        <Text>{t('fines.notFound')}</Text>
      </ScreenLayout>
    );
  }

  const customer = customers.find(c => c.id === fine.customerId);
  const car = cars.find(c => c.id === fine.carId);

  return (
    <ScreenLayout>
      <View style={styles.hero}>
        <Text style={typography.h2}>{formatCurrency(fine.amount)}</Text>
        <StatusBadge
          label={fine.paidStatus ? t('common.paid') : t('common.unpaid')}
          variant={fine.paidStatus ? 'done' : 'pending'}
        />
      </View>

      <ScreenSection title={t('common.details')} first showDivider>
        <Text style={typography.body}>{fine.reason}</Text>
        <Text style={typography.bodySmall}>
          {t('fines.dateLabel', { date: formatDate(fine.fineDate) })}
        </Text>
        {fine.notes ? (
          <Text style={typography.bodySmall}>
            {t('fines.notesLabel', { notes: fine.notes })}
          </Text>
        ) : null}
      </ScreenSection>

      <ScreenSection title={t('common.customerAndCar')}>
        <ReadOnlyFormField
          label={t('common.customer')}
          value={customer?.name ?? t('common.emDash')}
        />
        <ReadOnlyFormField
          label={t('common.car')}
          value={car?.name ?? t('common.emDash')}
          meta={
            car ? `${car.brand} ${car.model} · ${car.numberPlate}` : undefined
          }
        />
      </ScreenSection>

      {fine.proofImages.length > 0 ? (
        <ScreenSection title={t('common.proof')}>
          <ImageSlider images={fine.proofImages} imageHeight={160} />
        </ScreenSection>
      ) : null}

      <AppButton
        label={t('fines.editFine')}
        variant="outline"
        onPress={() => {
          if (openedFromCarsTab) {
            navigation.getParent()?.navigate('SettingsTab', {
              screen: 'FineForm',
              params: { fineId: fine.id },
            });
            return;
          }
          navigation.navigate('FineForm', { fineId: fine.id });
        }}
        fullWidth
        style={styles.editBtn}
      />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  editBtn: {
    marginTop: spacing.xl,
  },
});
