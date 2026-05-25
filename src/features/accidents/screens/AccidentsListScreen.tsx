import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { FAB, Text } from 'react-native-paper';
import type { SettingsStackParamList } from '@app/navigation/types';
import { colors, spacing, typography, shadows, radius } from '@app/theme';
import { formatCurrency } from '@core/utils/currency';
import { formatDate } from '@core/helpers/date';
import { useCustomerStore } from '@features/customers/store/useCustomerStore';
import { useCarStore } from '@features/cars/store/useCarStore';
import { ScreenLayout } from '@shared/layouts/ScreenLayout';
import { useAccidentStore } from '../store/useAccidentStore';

export const AccidentsListScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const accidents = useAccidentStore(s => s.accidents);
  const customers = useCustomerStore(s => s.customers);
  const cars = useCarStore(s => s.cars);

  return (
    <View style={styles.container}>
      <ScreenLayout scrollable>
        {accidents.map(acc => {
          const customer = customers.find(c => c.id === acc.customerId);
          const car = cars.find(c => c.id === acc.carId);
          return (
            <Pressable
              key={acc.id}
              style={[styles.card, shadows.sm]}
              onPress={() => navigation.navigate('AccidentForm', { accidentId: acc.id })}
            >
              <Text style={typography.h4}>{acc.description}</Text>
              <Text style={typography.bodySmall}>
                {customer?.name} · {car?.name}
              </Text>
              <Text style={typography.caption}>
                {formatDate(acc.accidentDate)} · {formatCurrency(acc.damageCost)}
              </Text>
            </Pressable>
          );
        })}
      </ScreenLayout>
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('AccidentForm', {})}
        color={colors.textInverse}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  fab: { position: 'absolute', right: spacing.lg, bottom: spacing.lg, backgroundColor: colors.primary },
});
