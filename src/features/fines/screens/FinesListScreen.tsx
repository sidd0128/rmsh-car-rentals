import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { FAB, Text } from 'react-native-paper';
import type { SettingsStackParamList } from '@app/navigation/types';
import { colors, spacing, typography, shadows, radius } from '@app/theme';
import { formatCurrency } from '@core/utils/currency';
import { formatDate } from '@core/helpers/date';
import { useDeviceLayout } from '@core/hooks/useDeviceLayout';
import { useCustomerStore } from '@features/customers/store/useCustomerStore';
import { useCarStore } from '@features/cars/store/useCarStore';
import { ScreenLayout } from '@shared/layouts/ScreenLayout';
import { EmptyState, StatusBadge } from '@shared/ui';
import { useFineStore } from '../store/useFineStore';
import { useTranslation } from '@core/i18n';

export const FinesListScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const fines = useFineStore(s => s.fines);
  const customers = useCustomerStore(s => s.customers);
  const cars = useCarStore(s => s.cars);
  const { horizontalPadding } = useDeviceLayout();

  return (
    <View style={styles.container}>
      <ScreenLayout scrollable>
        {fines.length === 0 ? (
          <EmptyState
            title={t('fines.listEmptyTitle')}
            description={t('fines.listEmptyDescription')}
          />
        ) : (
          fines.map(fine => {
            const customer = customers.find(c => c.id === fine.customerId);
            const car = cars.find(c => c.id === fine.carId);
            return (
              <Pressable
                key={fine.id}
                style={[styles.card, shadows.sm]}
                onPress={() => navigation.navigate('FineDetails', { fineId: fine.id })}
              >
                <View style={styles.row}>
                  <Text style={typography.h4}>{formatCurrency(fine.amount)}</Text>
                  <StatusBadge
                    label={fine.paidStatus ? t('common.paid') : t('common.unpaid')}
                    variant={fine.paidStatus ? 'done' : 'pending'}
                  />
                </View>
                <Text style={typography.bodySmall}>{fine.reason}</Text>
                <Text style={typography.caption}>
                  {customer?.name} · {car?.name} · {formatDate(fine.fineDate)}
                </Text>
              </Pressable>
            );
          })
        )}
      </ScreenLayout>
      <FAB
        icon="plus"
        style={[styles.fab, { right: horizontalPadding }]}
        onPress={() => navigation.navigate('FineForm', {})}
        color={colors.textInverse}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
    backgroundColor: colors.primary,
  },
});
