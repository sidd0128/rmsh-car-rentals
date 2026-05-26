import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import type { AccidentFlowParamList } from '@app/navigation/types';
import { typography } from '@app/theme';
import { formatDate } from '@core/helpers/date';
import { formatCurrency } from '@core/utils/currency';
import { useCarStore } from '@features/cars/store/useCarStore';
import { useCustomerStore } from '@features/customers/store/useCustomerStore';
import { ImageSlider } from '@shared/media';
import { ScreenLayout } from '@shared/layouts/ScreenLayout';
import { ScreenSection } from '@shared/layouts/ScreenSection';
import { ReadOnlyFormField } from '@shared/ui';
import { useAccidentStore } from '../store/useAccidentStore';
import { useTranslation } from '@core/i18n';

type AccidentDetailsRoute = RouteProp<AccidentFlowParamList, 'AccidentDetails'>;

export const AccidentDetailsScreen = () => {
  const { t } = useTranslation();
  const route = useRoute<AccidentDetailsRoute>();
  const accident = useAccidentStore(s =>
    s.accidents.find(a => a.id === route.params.accidentId),
  );
  const customers = useCustomerStore(s => s.customers);
  const cars = useCarStore(s => s.cars);

  if (!accident) {
    return (
      <ScreenLayout>
        <Text>{t('accidents.notFound')}</Text>
      </ScreenLayout>
    );
  }

  const customer = customers.find(c => c.id === accident.customerId);
  const car = cars.find(c => c.id === accident.carId);

  return (
    <ScreenLayout>
      <View>
        <Text style={typography.h2}>{accident.description}</Text>
        <Text style={[typography.h3, { marginTop: 8 }]}>
          {formatCurrency(accident.damageCost)}
        </Text>
        <Text style={typography.bodySmall}>
          {formatDate(accident.accidentDate)}
        </Text>
      </View>

      <ScreenSection title={t('common.notes')} first showDivider>
        {accident.notes ? (
          <Text style={typography.body}>{accident.notes}</Text>
        ) : (
          <Text style={typography.bodySmall}>{t('common.noNotes')}</Text>
        )}
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

      {accident.proofImages.length > 0 ? (
        <ScreenSection title={t('common.photos')}>
          <ImageSlider images={accident.proofImages} imageHeight={160} />
        </ScreenSection>
      ) : null}
    </ScreenLayout>
  );
};
