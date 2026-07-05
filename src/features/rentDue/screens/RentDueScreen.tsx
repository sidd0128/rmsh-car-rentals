import React, { useCallback, useMemo, useState } from 'react';
import { SectionList, StyleSheet, View } from 'react-native';
import { Checkbox, Text } from 'react-native-paper';
import { radius, spacing, typography } from '@app/theme';
import { useThemeContext } from '@contextApis/theme/useThemeContext';
import { formatDateTimeAmPm } from '@core/helpers/date';
import { formatRentalEndDisplay } from '@core/helpers/rentalDisplay';
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
const CARD_CONTENT_INDENT = 88;

const initialsForName = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join('') || '?';

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
      const customerName = customer?.name ?? t('common.customer');
      const rentalPayments = payments.filter(
        payment => payment.rentalId === item.rental.id,
      );
      const hasPayments = rentalPayments.length > 0;
      const selected = paymentId ? selectedIdSet.has(paymentId) : false;
      const busy = paymentId ? bulkActingIds.includes(paymentId) : false;
      const cannotReceive = !paymentId || busy;
      const statusLabel = paymentId
        ? t('rentDue.readyToMark')
        : hasPayments
          ? t('rentDue.paymentComplete')
          : t('rentDue.noPendingPayment');
      const buttonLabel = paymentId
        ? t('rentDue.markReceived')
        : hasPayments
          ? t('rentDue.paymentComplete')
          : t('rentDue.noPaymentButton');
      const rentalPeriod = t('rentDue.agreedPeriod', {
        start: formatDateTimeAmPm(item.rental.startDate),
        end: formatRentalEndDisplay(item.rental.endDate),
      });

      return (
        <View
          style={[
            screenStyles.surfaceCard,
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: selected ? colors.primaryLight : colors.borderLight,
              shadowColor: colors.shadow,
            },
          ]}
        >
          <View style={styles.identityRow}>
            <Checkbox.Android
              status={selected ? 'checked' : 'unchecked'}
              onPress={() => {
                if (paymentId) {
                  togglePayment(paymentId);
                }
              }}
              disabled={cannotReceive}
            />
            <View
              style={[
                styles.avatar,
                {
                  backgroundColor: selected ? colors.primary : colors.infoBg,
                },
              ]}
            >
              <Text
                style={[
                  styles.avatarText,
                  { color: selected ? colors.textInverse : colors.primary },
                ]}
              >
                {initialsForName(customerName)}
              </Text>
            </View>
            <Text style={[styles.customerName, { color: colors.text }]} numberOfLines={2}>
              {customerName}
            </Text>
          </View>
          <View style={styles.cardDetails}>
            <Text
              style={[styles.rentalPeriod, { color: colors.textSecondary }]}
              numberOfLines={3}
            >
              {rentalPeriod}
            </Text>
            <View
              style={[
                styles.statusPill,
                {
                  backgroundColor: paymentId ? colors.successBg : colors.borderLight,
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: paymentId ? colors.success : colors.textMuted },
                ]}
                numberOfLines={1}
              >
                {statusLabel}
              </Text>
            </View>
          </View>
          <View style={styles.cardActions}>
            <AppButton
              label={buttonLabel}
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
              contentStyle={styles.compactButtonContent}
              labelStyle={styles.compactButtonLabel}
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
      payments,
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
            contentStyle={styles.compactButtonContent}
            labelStyle={styles.compactButtonLabel}
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
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderLight,
              shadowColor: colors.shadow,
            },
          ]}
        >
          <Text style={[styles.heroTitle, { color: colors.primary }]}>
            {t('rentDue.title')}
          </Text>
          <Text style={[styles.heroHint, { color: colors.textSecondary }]}>
            {t('rentDue.hint')}
          </Text>
          <Text style={[styles.heroMeta, { color: colors.textMuted }]}>
            {t('rentDue.rosterCount', { count: rosterCount })}
          </Text>
        </View>
      </View>
    ),
    [colors, rosterCount, t],
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { paddingHorizontal: horizontalPadding }]}>
        {listHeader}
        <View
          style={[
            styles.bulkBar,
            { backgroundColor: colors.surface, borderColor: colors.borderLight },
          ]}
        >
          <View style={styles.bulkCopy}>
            <Text style={[styles.bulkTitle, { color: colors.text }]}>
              {t('rentDue.selectedCount', { count: selectedPaymentIds.length })}
            </Text>
            <Text style={[styles.bulkHint, { color: colors.textMuted }]}>
              {t('rentDue.selectedHint')}
            </Text>
          </View>
          {selectedPaymentIds.length > 0 ? (
            <AppButton
              label={t('rentDue.markSelectedPaid')}
              onPress={markSelectedReceived}
              contentStyle={styles.compactButtonContent}
              labelStyle={styles.compactButtonLabel}
              style={styles.bulkButton}
            />
          ) : null}
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
  heroCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  heroTitle: {
    ...typography.h3,
    fontWeight: '700',
  },
  heroHint: {
    ...typography.bodySmall,
    lineHeight: 21,
  },
  heroMeta: {
    ...typography.caption,
  },
  bulkBar: {
    alignItems: 'stretch',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  bulkCopy: {
    flex: 1,
    minWidth: 0,
  },
  bulkTitle: {
    ...typography.label,
  },
  bulkHint: {
    ...typography.caption,
    marginTop: spacing.xxs,
  },
  bulkButton: {
    alignSelf: 'stretch',
  },
  compactButtonContent: {
    minHeight: 42,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  compactButtonLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    marginVertical: 0,
    marginHorizontal: 0,
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
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
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
    minWidth: 132,
    maxWidth: 160,
  },
  sectionSpacer: {
    height: spacing.md,
  },
  card: {
    marginBottom: spacing.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    minHeight: 168,
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...typography.label,
    fontWeight: '700',
  },
  customerName: {
    ...typography.h4,
    flex: 1,
    minWidth: 0,
  },
  cardDetails: {
    marginLeft: CARD_CONTENT_INDENT,
    gap: spacing.sm,
  },
  rentalPeriod: {
    ...typography.bodySmall,
    lineHeight: 20,
  },
  statusPill: {
    alignSelf: 'flex-start',
    maxWidth: 130,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '600',
  },
  cardActions: {
    marginLeft: CARD_CONTENT_INDENT,
  },
  receivedButton: {
    alignSelf: 'stretch',
  },
});
