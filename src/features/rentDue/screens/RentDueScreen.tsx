import React, { useCallback, useMemo, useState } from 'react';
import { SectionList, StyleSheet, View } from 'react-native';
import { Checkbox, Text } from 'react-native-paper';
import { spacing, typography } from '@app/theme';
import { useThemeContext } from '@contextApis/theme/useThemeContext';
import { formatDate } from '@core/helpers/date';
import { formatInstallmentDueLabel } from '@core/helpers/paymentInstallment';
import { useDeviceLayout } from '@core/hooks/useDeviceLayout';
import { useHydrateStores } from '@core/hooks/useHydrateStores';
import { useTranslation } from '@core/i18n';
import type { PaymentRecord } from '@core/types/domain';
import { formatCurrency } from '@core/utils/currency';
import { useCarStore } from '@features/cars/store/useCarStore';
import { useCustomerStore } from '@features/customers/store/useCustomerStore';
import { usePaymentInstallmentActions } from '@features/payments/hooks/usePaymentInstallmentActions';
import { usePaymentStore } from '@features/payments/store/usePaymentStore';
import { useRentalStore } from '@features/rentals/store/useRentalStore';
import { LIST_BOTTOM_INSET, screenStyles } from '@shared/layouts/screenStyles';
import { AppButton, PaymentInstallmentActions } from '@shared/ui';
import {
  computeDueRentTotal,
  groupDueRentPaymentsByWeekday,
  type RentDueDaySection,
} from '../helpers/rentDueSections';

type RentDueListSection = RentDueDaySection & {
  data: PaymentRecord[];
};

const SectionSpacer = () => <View style={styles.sectionSpacer} />;

export const RentDueScreen = () => {
  const { t } = useTranslation();
  const { colors } = useThemeContext();
  const { horizontalPadding } = useDeviceLayout();
  const { hydrateAll } = useHydrateStores();
  const payments = usePaymentStore(s => s.payments);
  const rentals = useRentalStore(s => s.rentals);
  const customers = useCustomerStore(s => s.customers);
  const cars = useCarStore(s => s.cars);
  const { actingId, actingKind, runAction, runBulkReceived, bulkActingIds } =
    usePaymentInstallmentActions();
  const [selectedPaymentIds, setSelectedPaymentIds] = useState<string[]>([]);

  const sections = useMemo<RentDueListSection[]>(
    () =>
      groupDueRentPaymentsByWeekday(payments).map(section => ({
        ...section,
        data: section.payments,
      })),
    [payments],
  );

  const dueTotal = useMemo(() => computeDueRentTotal(payments), [payments]);
  const dueCount = useMemo(
    () => sections.reduce((sum, section) => sum + section.data.length, 0),
    [sections],
  );
  const selectedTotal = useMemo(
    () =>
      payments
        .filter(payment => selectedPaymentIds.includes(payment.id))
        .reduce((sum, payment) => sum + payment.amount, 0),
    [payments, selectedPaymentIds],
  );

  const selectedIdSet = useMemo(
    () => new Set(selectedPaymentIds),
    [selectedPaymentIds],
  );

  const onRefresh = useCallback(() => hydrateAll(), [hydrateAll]);

  const togglePayment = useCallback((paymentId: string) => {
    setSelectedPaymentIds(current =>
      current.includes(paymentId)
        ? current.filter(id => id !== paymentId)
        : [...current, paymentId],
    );
  }, []);

  const selectSection = useCallback((paymentIds: string[]) => {
    setSelectedPaymentIds(current => {
      const currentSet = new Set(current);
      const allSelected = paymentIds.every(id => currentSet.has(id));
      if (allSelected) {
        return current.filter(id => !paymentIds.includes(id));
      }
      paymentIds.forEach(id => currentSet.add(id));
      return Array.from(currentSet);
    });
  }, []);

  const onReceived = useCallback(
    (paymentId: string) => {
      runAction(paymentId, 'received')
        .then(() => {
          setSelectedPaymentIds(current => current.filter(id => id !== paymentId));
        })
        .catch(() => undefined);
    },
    [runAction],
  );

  const onNotPaid = useCallback(
    (paymentId: string) => {
      runAction(paymentId, 'not_paid')
        .then(() => {
          setSelectedPaymentIds(current => current.filter(id => id !== paymentId));
        })
        .catch(() => undefined);
    },
    [runAction],
  );

  const markSelectedReceived = useCallback(async () => {
    const idsToMark = selectedPaymentIds.filter(id =>
      payments.some(payment => payment.id === id && payment.status === 'PENDING'),
    );
    if (idsToMark.length === 0) {
      return;
    }
    await runBulkReceived(idsToMark);
    setSelectedPaymentIds(current => current.filter(id => !idsToMark.includes(id)));
  }, [payments, runBulkReceived, selectedPaymentIds]);

  const renderItem = useCallback(
    ({ item }: { item: PaymentRecord }) => {
      const rental = rentals.find(r => r.id === item.rentalId);
      const customer = customers.find(c => c.id === item.customerId);
      const car = cars.find(c => c.id === item.carId);
      const selected = selectedIdSet.has(item.id);
      const busy = bulkActingIds.includes(item.id);

      return (
        <View
          style={[
            screenStyles.surfaceCard,
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.borderLight },
          ]}
        >
          <View style={styles.cardHeader}>
            <Checkbox.Android
              status={selected ? 'checked' : 'unchecked'}
              onPress={() => togglePayment(item.id)}
              disabled={busy}
            />
            <View style={styles.cardTitle}>
              <Text style={typography.h4}>
                {customer?.name ?? t('common.customer')}
              </Text>
              <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
                {car?.name ?? t('common.car')}
              </Text>
            </View>
            <Text style={[styles.amount, { color: colors.primary }]}>
              {formatCurrency(item.amount)}
            </Text>
          </View>
          <Text style={[styles.installment, { color: colors.textSecondary }]}>
            {item.label ?? t('rentDue.installmentFallback')}
          </Text>
          <Text style={[styles.dueLine, { color: colors.primary }]}>
            {formatInstallmentDueLabel(item)}
          </Text>
          {rental ? (
            <Text style={typography.caption}>
              {t('rentDue.contractLine', {
                amount: formatCurrency(rental.agreedPrice),
                startDate: formatDate(rental.startDate),
                endDate: formatDate(rental.endDate),
              })}
            </Text>
          ) : null}
          <PaymentInstallmentActions
            status={item.status}
            paymentId={item.id}
            actingId={busy ? item.id : actingId}
            actingKind={busy ? 'received' : actingKind}
            onReceived={onReceived}
            onNotPaid={onNotPaid}
          />
        </View>
      );
    },
    [
      actingId,
      actingKind,
      bulkActingIds,
      cars,
      colors,
      customers,
      onNotPaid,
      onReceived,
      rentals,
      selectedIdSet,
      t,
      togglePayment,
    ],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: RentDueListSection }) => {
      const sectionPaymentIds = section.data.map(payment => payment.id);
      const selectedCount = sectionPaymentIds.filter(id =>
        selectedIdSet.has(id),
      ).length;
      const allSelected =
        sectionPaymentIds.length > 0 && selectedCount === sectionPaymentIds.length;

      return (
        <View
          style={[
            styles.sectionHeader,
            { backgroundColor: colors.background, borderBottomColor: colors.border },
          ]}
        >
          <View style={styles.sectionTitleGroup}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>
              {section.title}
            </Text>
            <Text style={[styles.sectionMeta, { color: colors.textSecondary }]}>
              {t('rentDue.sectionMeta', {
                count: section.data.length,
                amount: formatCurrency(section.totalAmount),
              })}
            </Text>
          </View>
          <AppButton
            label={allSelected ? t('rentDue.clearDay') : t('rentDue.selectAllDay')}
            variant="outline"
            onPress={() => selectSection(sectionPaymentIds)}
            disabled={sectionPaymentIds.length === 0}
            style={styles.sectionButton}
          />
        </View>
      );
    },
    [colors, selectSection, selectedIdSet, t],
  );

  const listHeader = useMemo(
    () => (
      <View style={screenStyles.earningsHeader}>
        <Text style={[screenStyles.earningsLead, { color: colors.primary }]}>
          {t('rentDue.totalDue', { amount: formatCurrency(dueTotal) })}
        </Text>
        <Text style={[screenStyles.earningsHint, { color: colors.textSecondary }]}>
          {t('rentDue.hint')}
        </Text>
        <Text style={[screenStyles.earningsMeta, { color: colors.textMuted }]}>
          {t('rentDue.duePaymentCount', { count: dueCount })}
        </Text>
      </View>
    ),
    [colors, dueCount, dueTotal, t],
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { paddingHorizontal: horizontalPadding }]}>
        {listHeader}
        <View style={styles.bulkBar}>
          <View style={styles.bulkCopy}>
            <Text style={[styles.bulkTitle, { color: colors.text }]}>
              {t('rentDue.selectedCount', { count: selectedPaymentIds.length })}
            </Text>
            <Text style={[styles.bulkAmount, { color: colors.textSecondary }]}>
              {formatCurrency(selectedTotal)}
            </Text>
          </View>
          <AppButton
            label={t('rentDue.markSelectedPaid')}
            onPress={markSelectedReceived}
            disabled={selectedPaymentIds.length === 0}
            style={styles.bulkButton}
          />
        </View>
      </View>
      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        stickySectionHeadersEnabled
        SectionSeparatorComponent={SectionSpacer}
        onRefresh={onRefresh}
        refreshing={false}
        contentContainerStyle={[
          styles.listContent,
          { paddingHorizontal: horizontalPadding },
        ]}
        ListEmptyComponent={
          <Text style={[screenStyles.emptyHint, { color: colors.textMuted }]}>
            {t('rentDue.noDuePayments')}
          </Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.md,
  },
  bulkBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  bulkCopy: {
    flex: 1,
    minWidth: 0,
  },
  bulkTitle: {
    ...typography.label,
  },
  bulkAmount: {
    ...typography.caption,
    marginTop: spacing.xxs,
  },
  bulkButton: {
    minWidth: 150,
  },
  listContent: {
    paddingTop: spacing.sm,
    paddingBottom: LIST_BOTTOM_INSET,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionTitleGroup: {
    flex: 1,
    minWidth: 0,
  },
  sectionTitle: {
    ...typography.h4,
  },
  sectionMeta: {
    ...typography.caption,
    marginTop: spacing.xxs,
  },
  sectionButton: {
    minWidth: 118,
  },
  sectionSpacer: {
    height: spacing.md,
  },
  card: {
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardTitle: {
    flex: 1,
    minWidth: 0,
  },
  installment: {
    ...typography.bodySmall,
    marginTop: spacing.xs,
  },
  dueLine: {
    ...typography.label,
  },
  amount: {
    ...typography.h4,
  },
});
