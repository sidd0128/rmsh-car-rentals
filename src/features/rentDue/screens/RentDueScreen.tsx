import React, { useCallback, useMemo, useState } from 'react';
import { SectionList, StyleSheet, View } from 'react-native';
import { Checkbox, Text } from 'react-native-paper';
import { spacing, typography } from '@app/theme';
import { useThemeContext } from '@contextApis/theme/useThemeContext';
import { useDeviceLayout } from '@core/hooks/useDeviceLayout';
import { useHydrateStores } from '@core/hooks/useHydrateStores';
import { useTranslation } from '@core/i18n';
import { useCustomerStore } from '@features/customers/store/useCustomerStore';
import { usePaymentInstallmentActions } from '@features/payments/hooks/usePaymentInstallmentActions';
import { usePaymentStore } from '@features/payments/store/usePaymentStore';
import { useRentalStore } from '@features/rentals/store/useRentalStore';
import { LIST_BOTTOM_INSET, screenStyles } from '@shared/layouts/screenStyles';
import { AppButton } from '@shared/ui';
import {
  groupRentRosterByWeekday,
  type RentDueDaySection,
  type RentDueRosterItem,
} from '../helpers/rentDueSections';

type RentDueListSection = RentDueDaySection & {
  data: RentDueRosterItem[];
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
  const { actingId, runReceived, runBulkReceived, bulkActingIds } =
    usePaymentInstallmentActions();
  const [selectedPaymentIds, setSelectedPaymentIds] = useState<string[]>([]);

  const sections = useMemo<RentDueListSection[]>(
    () =>
      groupRentRosterByWeekday(rentals, payments).map(section => ({
        ...section,
        data: section.items,
      })),
    [payments, rentals],
  );

  const rosterCount = useMemo(
    () => sections.reduce((sum, section) => sum + section.data.length, 0),
    [sections],
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
      runReceived(paymentId)
        .then(() => {
          setSelectedPaymentIds(current => current.filter(id => id !== paymentId));
        })
        .catch(() => undefined);
    },
    [runReceived],
  );

  const markSelectedReceived = useCallback(async () => {
    if (selectedPaymentIds.length === 0) {
      return;
    }
    await runBulkReceived(selectedPaymentIds);
    setSelectedPaymentIds([]);
  }, [runBulkReceived, selectedPaymentIds]);

  const renderItem = useCallback(
    ({ item }: { item: RentDueRosterItem }) => {
      const paymentId = item.nextPayment?.id;
      const customer = customers.find(c => c.id === item.rental.customerId);
      const selected = paymentId ? selectedIdSet.has(paymentId) : false;
      const busy = paymentId ? bulkActingIds.includes(paymentId) : false;
      const cannotReceive = !paymentId || busy;

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
              onPress={() => {
                if (paymentId) {
                  togglePayment(paymentId);
                }
              }}
              disabled={cannotReceive}
            />
            <Text style={[typography.h4, styles.customerName]}>
              {customer?.name ?? t('common.customer')}
            </Text>
            <AppButton
              label={t('common.received')}
              onPress={() => {
                if (paymentId) {
                  onReceived(paymentId);
                }
              }}
              disabled={!paymentId}
              loading={
                paymentId != null &&
                (actingId === paymentId || busy)
              }
              style={styles.receivedButton}
            />
          </View>
        </View>
      );
    },
    [
      actingId,
      bulkActingIds,
      colors,
      customers,
      onReceived,
      selectedIdSet,
      t,
      togglePayment,
    ],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: RentDueListSection }) => {
      const sectionPaymentIds = section.data
        .map(item => item.nextPayment?.id)
        .filter((id): id is string => Boolean(id));
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
              {t('rentDue.sectionMeta', { count: section.data.length })}
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
          {t('rentDue.title')}
        </Text>
        <Text style={[screenStyles.earningsHint, { color: colors.textSecondary }]}>
          {t('rentDue.hint')}
        </Text>
        <Text style={[screenStyles.earningsMeta, { color: colors.textMuted }]}>
          {t('rentDue.rosterCount', { count: rosterCount })}
        </Text>
      </View>
    ),
    [colors, rosterCount, t],
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { paddingHorizontal: horizontalPadding }]}>
        {listHeader}
        <View style={styles.bulkBar}>
          <Text style={[styles.bulkTitle, { color: colors.text }]}>
            {t('rentDue.selectedCount', { count: selectedPaymentIds.length })}
          </Text>
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
        keyExtractor={item => item.rental.id}
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
  bulkTitle: {
    ...typography.label,
    flex: 1,
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
  customerName: {
    flex: 1,
    minWidth: 0,
  },
  receivedButton: {
    minWidth: 112,
  },
});
