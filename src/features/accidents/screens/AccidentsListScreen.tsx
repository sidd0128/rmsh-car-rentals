import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { FAB, Text } from 'react-native-paper';
import type { SettingsStackParamList } from '@app/navigation/types';
import { spacing, typography, shadows, radius } from '@app/theme';
import { useThemeContext } from '@contextApis/theme/useThemeContext';
import { formatCurrency } from '@core/utils/currency';
import { formatDate } from '@core/helpers/date';
import { useDeviceLayout } from '@core/hooks/useDeviceLayout';
import { useCustomerStore } from '@features/customers/store/useCustomerStore';
import { useCarStore } from '@features/cars/store/useCarStore';
import { ScreenLayout } from '@shared/layouts/ScreenLayout';
import { EmptyState } from '@shared/ui';
import { useAccidentStore } from '../store/useAccidentStore';
import { useTranslation } from '@core/i18n';

export const AccidentsListScreen = () => {
  const { t } = useTranslation();
  const { colors } = useThemeContext();
  const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const accidents = useAccidentStore(s => s.accidents);
  const customers = useCustomerStore(s => s.customers);
  const cars = useCarStore(s => s.cars);
  const { horizontalPadding } = useDeviceLayout();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenLayout scrollable>
        {accidents.length === 0 ? (
          <EmptyState
            title={t('accidents.listEmptyTitle')}
            description={t('accidents.listEmptyDescription')}
          />
        ) : (
          accidents.map(acc => {
            const customer = customers.find(c => c.id === acc.customerId);
            const car = cars.find(c => c.id === acc.carId);
            return (
              <Pressable
                key={acc.id}
                style={[styles.card, shadows.sm, { backgroundColor: colors.surface }]}
                onPress={() =>
                  navigation.navigate('AccidentDetails', { accidentId: acc.id })
                }
              >
                <Text style={typography.h4}>{acc.description}</Text>
                <Text style={[typography.bodySmall, styles.cardLine]}>
                  {customer?.name} · {car?.name}
                </Text>
                <Text style={typography.caption}>
                  {formatDate(acc.accidentDate)} · {formatCurrency(acc.damageCost)}
                </Text>
              </Pressable>
            );
          })
        )}
      </ScreenLayout>
      <FAB
        icon="plus"
        style={[styles.fab, { right: horizontalPadding, backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('AccidentForm')}
        color={colors.textInverse}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: {
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  cardLine: {
    marginTop: spacing.xxs,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
  },
});
