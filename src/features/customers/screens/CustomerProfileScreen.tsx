import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, Image, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import type { CustomersStackParamList } from '@app/navigation/types';
import { radius, spacing, typography } from '@app/theme';
import { useThemeContext } from '@contextApis/theme/useThemeContext';
import { formatDate, formatDateTimeAmPm } from '@core/helpers/date';
import { sortPaymentsByDueDate } from '@core/helpers/paymentInstallment';
import { computeCustomerTotalPaid } from '@core/helpers/rentalPayments';
import { rentalIsCurrent } from '@core/helpers/rentalStatus';
import { SHOW_PAYMENTS_UI } from '@core/constants/features';
import { formatCurrency } from '@core/utils/currency';
import { formatRentalEndDisplay } from '@core/helpers/rentalDisplay';
import type { Rental } from '@core/types/domain';
import { useAccidentStore } from '@features/accidents/store/useAccidentStore';
import { useFineStore } from '@features/fines/store/useFineStore';
import { usePaymentStore } from '@features/payments/store/usePaymentStore';
import { useRentalStore } from '@features/rentals/store/useRentalStore';
import { useCarStore } from '@features/cars/store/useCarStore';
import { ScreenLayout } from '@shared/layouts/ScreenLayout';
import { ScreenSection } from '@shared/layouts/ScreenSection';
import { screenStyles } from '@shared/layouts/screenStyles';
import {
  AppButton,
  AppDatePickerModal,
  AppDialog,
  TimelineView,
  WeekdayPicker,
} from '@shared/ui';
import { ImageSlider } from '@shared/media';
import { reportImageLoadError } from '@shared/media/reportImageLoadError';
import {
  AssignmentModal,
  AssignmentModalRef,
} from '@shared/modals/AssignmentModal';
import { CustomerAccidentHistory } from '../components/CustomerAccidentHistory';
import { CustomerFineHistory } from '../components/CustomerFineHistory';
import { CustomerPaymentHistory } from '../components/CustomerPaymentHistory';
import { useCustomerStore } from '../store/useCustomerStore';
import { useHydrateStores } from '@core/hooks/useHydrateStores';
import { SignedRentalAgreementDocuments } from '@features/rentals/components/SignedRentalAgreementDocuments';
import { SecureDeleteDialog } from '@features/security/components/SecureDeleteDialog';
import dayjs from 'dayjs';
import { useTranslation } from '@core/i18n';
import {
  billingFrequencyLabel,
  formatRentDueDaySummary,
} from '@core/services/rentalBillingService';

export const CustomerProfileScreen = () => {
  const { t } = useTranslation();
  const { colors } = useThemeContext();
  const route =
    useRoute<RouteProp<CustomersStackParamList, 'CustomerProfile'>>();
  const navigation =
    useNavigation<NativeStackNavigationProp<CustomersStackParamList>>();
  const customer = useCustomerStore(s =>
    s.getCustomerById(route.params.customerId),
  );
  const rentals = useRentalStore(s => s.rentals);
  const payments = usePaymentStore(s => s.payments);
  const fines = useFineStore(s => s.fines);
  const accidents = useAccidentStore(s => s.accidents);
  const cars = useCarStore(s => s.cars);
  const setRentalEndDate = useRentalStore(s => s.setRentalEndDate);
  const updateRentalRentDueDay = useRentalStore(s => s.updateRentalRentDueDay);
  const { hydrateAll } = useHydrateStores();
  const assignmentRef = useRef<AssignmentModalRef>(null);
  const [endingRentalId, setEndingRentalId] = useState<string | null>(null);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [rentDueDialogRental, setRentDueDialogRental] = useState<Rental | null>(
    null,
  );
  const [selectedRentDueWeekday, setSelectedRentDueWeekday] = useState<number>(
    dayjs().day(),
  );
  const [selectedRentDueDayOfMonth, setSelectedRentDueDayOfMonth] = useState(
    Math.min(dayjs().date(), 28),
  );
  const [rentDueDayPickerVisible, setRentDueDayPickerVisible] = useState(false);
  const [savingRentDueDay, setSavingRentDueDay] = useState(false);

  useFocusEffect(
    useCallback(() => {
      hydrateAll().catch(() => undefined);
    }, [hydrateAll]),
  );

  const carsById = useMemo(() => new Map(cars.map(c => [c.id, c])), [cars]);

  const customerRentals = useMemo(
    () => rentals.filter(r => r.customerId === route.params.customerId),
    [rentals, route.params.customerId],
  );

  const activeRentals = useMemo(
    () =>
      customerRentals
        .filter(r => rentalIsCurrent(r))
        .sort(
          (a, b) => dayjs(b.startDate).valueOf() - dayjs(a.startDate).valueOf(),
        ),
    [customerRentals],
  );

  const customerPayments = useMemo(
    () =>
      sortPaymentsByDueDate(
        payments.filter(p => p.customerId === route.params.customerId),
      ).reverse(),
    [payments, route.params.customerId],
  );
  const totalRentals = customerRentals.length;
  const totalSpent = computeCustomerTotalPaid(
    route.params.customerId,
    rentals,
    payments,
  );
  const customerFines = useMemo(
    () =>
      fines
        .filter(f => f.customerId === route.params.customerId)
        .sort(
          (a, b) => dayjs(b.fineDate).valueOf() - dayjs(a.fineDate).valueOf(),
        ),
    [fines, route.params.customerId],
  );

  const customerAccidents = useMemo(
    () =>
      accidents
        .filter(a => a.customerId === route.params.customerId)
        .sort(
          (a, b) =>
            dayjs(b.accidentDate).valueOf() - dayjs(a.accidentDate).valueOf(),
        ),
    [accidents, route.params.customerId],
  );

  const availableCarCount = useMemo(
    () => cars.filter(candidate => candidate.status !== 'ON_RENT').length,
    [cars],
  );

  const handleAssignNewCar = useCallback(() => {
    if (!customer) {
      return;
    }
    if (customer.isBlacklisted) {
      Alert.alert(
        t('customers.assignBlockedBlacklistedTitle'),
        t('customers.assignBlockedBlacklistedMessage'),
      );
      return;
    }
    if (availableCarCount === 0) {
      Alert.alert(
        t('customers.noAvailableCarsTitle'),
        t('customers.noAvailableCarsMessage'),
      );
      return;
    }
    assignmentRef.current?.openForCustomer(customer.id);
  }, [availableCarCount, customer, t]);

  const handleEndCurrentRentalNow = useCallback(
    (rental: Rental, carName: string) => {
      Alert.alert(
        t('customers.endCurrentRentalTitle'),
        t('customers.endCurrentRentalMessage', {
          car: carName,
        }),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.confirm'),
            style: 'destructive',
            onPress: async () => {
              const endDate = new Date().toISOString();
              setEndingRentalId(rental.id);
              const result = await setRentalEndDate(rental.id, endDate)
                .catch(error => ({
                  success: false as const,
                  error:
                    error instanceof Error
                      ? error.message
                      : t('common.notAvailable'),
                }))
                .finally(() => {
                  setEndingRentalId(null);
                });

              if (!result.success) {
                Alert.alert(
                  t('customers.endCurrentRentalFailedTitle'),
                  result.error,
                );
                return;
              }

              Alert.alert(
                t('customers.endCurrentRentalSuccessTitle'),
                t('customers.endCurrentRentalSuccessMessage', {
                  datetime: formatDateTimeAmPm(endDate),
                }),
              );
              hydrateAll().catch(() => undefined);
            },
          },
        ],
      );
    },
    [hydrateAll, setRentalEndDate, t],
  );

  const openRentDueDialog = useCallback((rental: Rental) => {
    setRentDueDialogRental(rental);
    setSelectedRentDueWeekday(rental.rentDueWeekday ?? dayjs().day());
    setSelectedRentDueDayOfMonth(
      rental.rentDueDayOfMonth ?? Math.min(dayjs().date(), 28),
    );
  }, []);

  const closeRentDueDialog = useCallback(() => {
    if (savingRentDueDay) {
      return;
    }
    setRentDueDialogRental(null);
    setRentDueDayPickerVisible(false);
  }, [savingRentDueDay]);

  const handleSaveRentDueDay = useCallback(async () => {
    if (!rentDueDialogRental) {
      return;
    }

    setSavingRentDueDay(true);
    const result = await updateRentalRentDueDay(rentDueDialogRental.id, {
      rentDueWeekday:
        rentDueDialogRental.billingFrequency === 'WEEKLY'
          ? selectedRentDueWeekday
          : undefined,
      rentDueDayOfMonth:
        rentDueDialogRental.billingFrequency === 'MONTHLY'
          ? selectedRentDueDayOfMonth
          : undefined,
    })
      .catch(error => ({
        success: false as const,
        error:
          error instanceof Error ? error.message : t('common.notAvailable'),
      }))
      .finally(() => {
        setSavingRentDueDay(false);
      });

    if (!result.success) {
      Alert.alert(t('customers.updateRentDueDayFailedTitle'), result.error);
      return;
    }

    setRentDueDialogRental(null);
    hydrateAll().catch(() => undefined);
  }, [
    hydrateAll,
    rentDueDialogRental,
    selectedRentDueDayOfMonth,
    selectedRentDueWeekday,
    t,
    updateRentalRentDueDay,
  ]);

  if (!customer) {
    return (
      <ScreenLayout>
        <Text>{t('customers.notFound')}</Text>
      </ScreenLayout>
    );
  }

  const timeline = customerRentals.map(r => {
    const rentalCar = cars.find(c => c.id === r.carId);
    return {
      id: r.id,
      title: rentalCar?.name ?? t('common.car'),
      subtitle: SHOW_PAYMENTS_UI ? formatCurrency(r.agreedPrice) : r.status,
      date: `${formatDate(r.startDate)} – ${formatDate(r.endDate)}`,
      meta: r.status,
    };
  });

  return (
    <View style={styles.screen}>
      <ScreenLayout onRefresh={hydrateAll}>
        <View style={styles.profileHeader}>
          {customer.photo ? (
            <Image
              source={{ uri: customer.photo }}
              style={styles.avatar}
              onError={() =>
                reportImageLoadError(
                  customer.photo ?? '',
                  'CustomerProfileScreen',
                )
              }
            />
          ) : (
            <View
              style={[
                styles.avatar,
                styles.avatarPlaceholder,
                { backgroundColor: colors.infoBg },
              ]}
            >
              <Text style={[styles.avatarInitials, { color: colors.primary }]}>
                {customer.name
                  .split(' ')
                  .map(p => p[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.profileText}>
            <Text style={typography.h2}>{customer.name}</Text>
            <Text style={typography.bodySmall}>
              {t('customers.yearsOld', { age: customer.age })} ·{' '}
              {customer.phone}
            </Text>
            {customer.email ? (
              <Text style={typography.bodySmall}>{customer.email}</Text>
            ) : null}
            <Text style={typography.bodySmall}>{customer.address}</Text>
            {customer.isBlacklisted ? (
              <Text style={[styles.blacklist, { color: colors.error }]}>
                {t('customers.blacklisted')}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={screenStyles.statsRow}>
          <View
            style={[
              screenStyles.statCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderLight,
              },
            ]}
          >
            <Text style={[screenStyles.statValue, { color: colors.primary }]}>
              {totalRentals}
            </Text>
            <Text
              style={[screenStyles.statLabel, { color: colors.textSecondary }]}
            >
              {t('customers.rentals')}
            </Text>
          </View>
          {SHOW_PAYMENTS_UI ? (
            <View
              style={[
                screenStyles.statCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.borderLight,
                },
              ]}
            >
              <Text style={[screenStyles.statValue, { color: colors.primary }]}>
                {formatCurrency(totalSpent)}
              </Text>
              <Text
                style={[
                  screenStyles.statLabel,
                  { color: colors.textSecondary },
                ]}
              >
                {t('customers.totalSpent')}
              </Text>
            </View>
          ) : null}
        </View>

        <ScreenSection
          title={
            activeRentals.length > 1
              ? t('customers.currentRentals')
              : t('customers.currentRental')
          }
          showDivider
        >
          {activeRentals.length > 0 ? (
            activeRentals.map(rental => {
              const rentalCar = carsById.get(rental.carId);
              const carName = rentalCar?.name ?? t('common.car');
              const canEditRentDueDay =
                rental.billingFrequency === 'WEEKLY' ||
                rental.billingFrequency === 'MONTHLY';

              return (
                <View
                  key={rental.id}
                  style={[
                    screenStyles.insetPanel,
                    styles.activeRentalCard,
                    {
                      backgroundColor: colors.surfaceElevated,
                      borderColor: colors.borderLight,
                    },
                  ]}
                >
                  <Text style={typography.body}>
                    {t('customers.rentalUntil', {
                      car: carName,
                      date: formatRentalEndDisplay(rental.endDate),
                    })}
                  </Text>
                  <Text
                    style={[
                      typography.bodySmall,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {t('cars.sinceUntilDateTime', {
                      start: formatDateTimeAmPm(rental.startDate),
                      end: formatRentalEndDisplay(rental.endDate),
                    })}
                  </Text>
                  {rental.billingFrequency ? (
                    <View
                      style={[
                        styles.rentDueSummary,
                        {
                          backgroundColor: colors.infoBg,
                          borderColor: colors.borderLight,
                        },
                      ]}
                    >
                      <Text
                        style={[styles.rentDueLabel, { color: colors.primary }]}
                      >
                        {t('customers.rentDueSchedule')}
                      </Text>
                      <Text style={[typography.body, { color: colors.text }]}>
                        {billingFrequencyLabel(rental.billingFrequency)} ·{' '}
                        {formatRentDueDaySummary(
                          rental.billingFrequency,
                          rental.rentDueWeekday,
                          rental.rentDueDayOfMonth,
                        )}
                      </Text>
                    </View>
                  ) : null}
                  {canEditRentDueDay ? (
                    <AppButton
                      label={t('customers.editRentDueDay')}
                      variant="outline"
                      onPress={() => openRentDueDialog(rental)}
                      fullWidth
                    />
                  ) : null}
                  <AppButton
                    label={t('customers.endThisRentalNow')}
                    variant="danger"
                    onPress={() => handleEndCurrentRentalNow(rental, carName)}
                    loading={endingRentalId === rental.id}
                    fullWidth
                  />
                </View>
              );
            })
          ) : (
            <Text style={typography.bodySmall}>
              {t('customers.noActiveRental')}
            </Text>
          )}
          <View style={styles.rentalActions}>
            <AppButton
              label={t('customers.assignNewCar')}
              onPress={handleAssignNewCar}
              fullWidth
            />
          </View>
        </ScreenSection>

        <ScreenSection title={t('customers.drivingLicense')}>
          <ImageSlider
            images={customer.drivingLicenseImages}
            imageHeight={140}
          />
        </ScreenSection>

        <ScreenSection title={t('customers.documents')}>
          <ImageSlider images={customer.documents} imageHeight={140} />
        </ScreenSection>

        <ScreenSection title={t('customers.rentalHistory')}>
          <TimelineView items={timeline} />
        </ScreenSection>

        <ScreenSection title={t('rentalAgreements.signedRentalAgreements')}>
          {customerRentals.some(
            rental => rental.rentalAgreement?.signedDocuments?.length,
          ) ? (
            customerRentals.map(rental => {
              const signedDocuments =
                rental.rentalAgreement?.signedDocuments ?? [];
              if (!signedDocuments.length) {
                return null;
              }

              const rentalCar = carsById.get(rental.carId);
              return (
                <View
                  key={rental.id}
                  style={[
                    screenStyles.insetPanel,
                    styles.signedAgreementCard,
                    {
                      backgroundColor: colors.surfaceElevated,
                      borderColor: colors.borderLight,
                    },
                  ]}
                >
                  <Text style={typography.body}>
                    {rentalCar?.name ?? t('common.car')}
                  </Text>
                  <Text
                    style={[
                      typography.bodySmall,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {t('history.rentalLinePeriod', {
                      start: formatDateTimeAmPm(rental.startDate),
                      end: formatRentalEndDisplay(rental.endDate),
                    })}
                  </Text>
                  <SignedRentalAgreementDocuments documents={signedDocuments} />
                </View>
              );
            })
          ) : (
            <Text
              style={[typography.bodySmall, { color: colors.textSecondary }]}
            >
              {t('rentalAgreements.noSignedDocuments')}
            </Text>
          )}
        </ScreenSection>

        {SHOW_PAYMENTS_UI ? (
          <ScreenSection title={t('customers.paymentHistory')}>
            <CustomerPaymentHistory payments={customerPayments} />
          </ScreenSection>
        ) : null}

        <ScreenSection
          title={t('common.sectionCount', {
            title: t('customers.fines'),
            count: customerFines.length,
          })}
          showDivider
        >
          <CustomerFineHistory
            fines={customerFines}
            carsById={carsById}
            onFinePress={fineId =>
              navigation.navigate('FineDetails', { fineId })
            }
          />
        </ScreenSection>

        <ScreenSection
          title={t('common.sectionCount', {
            title: t('customers.accidents'),
            count: customerAccidents.length,
          })}
        >
          <CustomerAccidentHistory
            accidents={customerAccidents}
            carsById={carsById}
            onAccidentPress={accidentId =>
              navigation.navigate('AccidentDetails', { accidentId })
            }
          />
        </ScreenSection>

        <AppButton
          label={t('customers.editProfile')}
          variant="outline"
          onPress={() =>
            navigation.navigate('CustomerForm', { customerId: customer.id })
          }
          fullWidth
          style={styles.editBtn}
        />
        <AppButton
          label={t('customers.deleteCustomer')}
          variant="danger"
          onPress={() => setDeleteDialogVisible(true)}
          fullWidth
        />
      </ScreenLayout>

      <AssignmentModal
        ref={assignmentRef}
        onSuccess={() => {
          hydrateAll().catch(() => undefined);
        }}
      />
      <AppDialog
        visible={Boolean(rentDueDialogRental)}
        title={t('customers.editRentDueDayTitle')}
        onDismiss={closeRentDueDialog}
        dismissOnBackdrop
        actions={
          <View style={styles.dialogActions}>
            <AppButton
              label={t('common.cancel')}
              variant="outline"
              onPress={closeRentDueDialog}
              disabled={savingRentDueDay}
              style={styles.dialogActionButton}
            />
            <AppButton
              label={t('common.save')}
              onPress={handleSaveRentDueDay}
              loading={savingRentDueDay}
              style={styles.dialogActionButton}
            />
          </View>
        }
      >
        <View style={styles.rentDueDialogContent}>
          <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
            {t('customers.editRentDueDayDescription')}
          </Text>
          {rentDueDialogRental?.billingFrequency === 'WEEKLY' ? (
            <>
              <Text style={styles.dialogFieldLabel}>
                {t('assignment.rentPaidOn')}
              </Text>
              <WeekdayPicker
                value={selectedRentDueWeekday}
                onChange={setSelectedRentDueWeekday}
              />
              <Text style={[styles.rentDueHint, { color: colors.textMuted }]}>
                {formatRentDueDaySummary('WEEKLY', selectedRentDueWeekday)}
              </Text>
            </>
          ) : null}
          {rentDueDialogRental?.billingFrequency === 'MONTHLY' ? (
            <>
              <Text style={styles.dialogFieldLabel}>
                {t('assignment.rentDueDayOfMonth')}
              </Text>
              <AppButton
                label={t('common.dayOfMonthButton', {
                  day: selectedRentDueDayOfMonth,
                })}
                variant="outline"
                onPress={() => setRentDueDayPickerVisible(true)}
                fullWidth
              />
              <Text style={[styles.rentDueHint, { color: colors.textMuted }]}>
                {formatRentDueDaySummary(
                  'MONTHLY',
                  undefined,
                  selectedRentDueDayOfMonth,
                )}
              </Text>
            </>
          ) : null}
          <View
            style={[
              styles.rentDueNote,
              {
                backgroundColor: colors.background,
                borderColor: colors.borderLight,
              },
            ]}
          >
            <Text style={[typography.caption, { color: colors.textMuted }]}>
              {t('customers.editRentDueDayNote')}
            </Text>
          </View>
        </View>
      </AppDialog>
      <AppDatePickerModal
        open={rentDueDayPickerVisible}
        date={dayjs().date(selectedRentDueDayOfMonth).toDate()}
        onConfirm={date => {
          setRentDueDayPickerVisible(false);
          setSelectedRentDueDayOfMonth(Math.min(dayjs(date).date(), 28));
        }}
        onCancel={() => setRentDueDayPickerVisible(false)}
      />
      <SecureDeleteDialog
        visible={deleteDialogVisible}
        targetType="CUSTOMER"
        targetId={customer.id}
        onCancel={() => setDeleteDialogVisible(false)}
        onDeleted={async () => {
          setDeleteDialogVisible(false);
          await hydrateAll();
          navigation.goBack();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    gap: spacing.lg,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    ...typography.h3,
  },
  profileText: {
    flex: 1,
    gap: spacing.xs,
  },
  blacklist: {
    marginTop: spacing.xs,
    fontWeight: '600',
    fontSize: 13,
  },
  editBtn: {
    marginTop: spacing.xl,
  },
  rentalActions: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  activeRentalCard: {
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  rentDueSummary: {
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  rentDueLabel: {
    ...typography.caption,
    fontWeight: '600',
  },
  signedAgreementCard: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  dialogActions: {
    flexDirection: 'column',
    gap: spacing.sm,
    width: '100%',
  },
  dialogActionButton: {
    width: '100%',
  },
  rentDueDialogContent: {
    gap: spacing.md,
  },
  dialogFieldLabel: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  rentDueNote: {
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.md,
  },
  rentDueHint: {
    ...typography.caption,
  },
});
