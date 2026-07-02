import { repositories } from '@core/database/repositoryRegistry';
import { todayISO } from '@core/helpers/date';
import {
  getCurrentFirebaseUser,
  reauthenticateCurrentUserWithPassword,
} from '@core/firebase/auth/services/firebaseAuthService';
import type {
  AccidentRecord,
  BookingRequest,
  Car,
  Customer,
  DeletedRecordCounts,
  DeletionTargetType,
  Fine,
  PaymentRecord,
  Rental,
} from '@core/types/domain';

export interface DeletionImpactSummary {
  targetType: DeletionTargetType;
  targetId: string;
  targetLabel: string;
  counts: DeletedRecordCounts;
  linkedRecordCount: number;
  requiresReauthentication: boolean;
}

export interface SecureDeletionInput {
  targetType: DeletionTargetType;
  targetId: string;
  password?: string;
  reason?: string;
}

interface DeletionImpact extends DeletionImpactSummary {
  targetSnapshot: Record<string, unknown>;
  carsToDelete: Car[];
  customersToDelete: Customer[];
  rentalsToDelete: Rental[];
  paymentsToDelete: PaymentRecord[];
  finesToDelete: Fine[];
  accidentsToDelete: AccidentRecord[];
  bookingRequestsToDelete: BookingRequest[];
}

const emptyCounts = (): DeletedRecordCounts => ({
  cars: 0,
  customers: 0,
  rentals: 0,
  payments: 0,
  fines: 0,
  accidents: 0,
  bookingRequests: 0,
});

const buildTargetSnapshot = (entity: Car | Customer): Record<string, unknown> =>
  JSON.parse(JSON.stringify(entity)) as Record<string, unknown>;

const getLinkedRecordCount = (counts: DeletedRecordCounts): number =>
  counts.rentals +
  counts.payments +
  counts.fines +
  counts.accidents +
  counts.bookingRequests;

const withRiskMetadata = <
  T extends Omit<
    DeletionImpact,
    'linkedRecordCount' | 'requiresReauthentication'
  >,
>(
  impact: T,
): DeletionImpact => {
  const linkedRecordCount = getLinkedRecordCount(impact.counts);
  return {
    ...impact,
    linkedRecordCount,
    requiresReauthentication: linkedRecordCount > 0,
  };
};

const buildCarImpact = async (carId: string): Promise<DeletionImpact> => {
  const [car, rentals, payments, fines, accidents, bookingRequests] =
    await Promise.all([
      repositories.cars.getCarById(carId),
      repositories.rentals.getRentals(),
      repositories.payments.getPayments(),
      repositories.fines.getFines(),
      repositories.accidents.getAccidents(),
      repositories.bookingRequests.getBookingRequests(),
    ]);

  if (!car) {
    throw new Error('This car was not found.');
  }

  const linkedRentals = rentals.filter(rental => rental.carId === car.id);
  const linkedPayments = payments.filter(payment => payment.carId === car.id);
  const linkedFines = fines.filter(fine => fine.carId === car.id);
  const linkedAccidents = accidents.filter(
    accident => accident.carId === car.id,
  );
  const linkedBookingRequests = bookingRequests.filter(
    request => request.carId === car.id,
  );

  return withRiskMetadata({
    targetType: 'CAR',
    targetId: car.id,
    targetLabel: `${car.name} (${car.numberPlate})`,
    targetSnapshot: buildTargetSnapshot(car),
    carsToDelete: [car],
    customersToDelete: [],
    rentalsToDelete: linkedRentals,
    paymentsToDelete: linkedPayments,
    finesToDelete: linkedFines,
    accidentsToDelete: linkedAccidents,
    bookingRequestsToDelete: linkedBookingRequests,
    counts: {
      ...emptyCounts(),
      cars: 1,
      rentals: linkedRentals.length,
      payments: linkedPayments.length,
      fines: linkedFines.length,
      accidents: linkedAccidents.length,
      bookingRequests: linkedBookingRequests.length,
    },
  });
};

const buildCustomerImpact = async (
  customerId: string,
): Promise<DeletionImpact> => {
  const [customer, rentals, payments, fines, accidents, bookingRequests] =
    await Promise.all([
      repositories.customers.getCustomerById(customerId),
      repositories.rentals.getRentals(),
      repositories.payments.getPayments(),
      repositories.fines.getFines(),
      repositories.accidents.getAccidents(),
      repositories.bookingRequests.getBookingRequests(),
    ]);

  if (!customer) {
    throw new Error('This customer was not found.');
  }

  const linkedRentals = rentals.filter(
    rental => rental.customerId === customer.id,
  );
  const linkedPayments = payments.filter(
    payment => payment.customerId === customer.id,
  );
  const linkedFines = fines.filter(fine => fine.customerId === customer.id);
  const linkedAccidents = accidents.filter(
    accident => accident.customerId === customer.id,
  );
  const linkedBookingRequests = bookingRequests.filter(
    request => request.customerId === customer.id,
  );

  return withRiskMetadata({
    targetType: 'CUSTOMER',
    targetId: customer.id,
    targetLabel: customer.name,
    targetSnapshot: buildTargetSnapshot(customer),
    carsToDelete: [],
    customersToDelete: [customer],
    rentalsToDelete: linkedRentals,
    paymentsToDelete: linkedPayments,
    finesToDelete: linkedFines,
    accidentsToDelete: linkedAccidents,
    bookingRequestsToDelete: linkedBookingRequests,
    counts: {
      ...emptyCounts(),
      customers: 1,
      rentals: linkedRentals.length,
      payments: linkedPayments.length,
      fines: linkedFines.length,
      accidents: linkedAccidents.length,
      bookingRequests: linkedBookingRequests.length,
    },
  });
};

const buildImpact = (targetType: DeletionTargetType, targetId: string) =>
  targetType === 'CAR'
    ? buildCarImpact(targetId)
    : buildCustomerImpact(targetId);

const deleteImpactRecords = async (impact: DeletionImpact): Promise<void> => {
  await Promise.all([
    ...impact.paymentsToDelete.map(payment =>
      repositories.payments.deletePayment(payment.id),
    ),
    ...impact.finesToDelete.map(fine => repositories.fines.deleteFine(fine.id)),
    ...impact.accidentsToDelete.map(accident =>
      repositories.accidents.deleteAccident(accident.id),
    ),
    ...impact.bookingRequestsToDelete.map(request =>
      repositories.bookingRequests.deleteBookingRequest(request.id),
    ),
    ...impact.rentalsToDelete.map(rental =>
      repositories.rentals.deleteRental(rental.id),
    ),
    ...impact.carsToDelete.map(car => repositories.cars.deleteCar(car.id)),
    ...impact.customersToDelete.map(customer =>
      repositories.customers.deleteCustomer(customer.id),
    ),
  ]);
};

export const secureDeletionService = {
  getImpactSummary: async (
    targetType: DeletionTargetType,
    targetId: string,
  ): Promise<DeletionImpactSummary> => {
    const impact = await buildImpact(targetType, targetId);
    return {
      targetType: impact.targetType,
      targetId: impact.targetId,
      targetLabel: impact.targetLabel,
      counts: impact.counts,
      linkedRecordCount: impact.linkedRecordCount,
      requiresReauthentication: impact.requiresReauthentication,
    };
  },

  deleteWithAudit: async ({
    targetType,
    targetId,
    password,
    reason,
  }: SecureDeletionInput): Promise<void> => {
    const impact = await buildImpact(targetType, targetId);
    const trimmedReason = reason?.trim() ?? '';

    if (impact.requiresReauthentication && !trimmedReason) {
      throw new Error('Please enter a reason for this deletion.');
    }

    if (impact.requiresReauthentication && !password?.trim()) {
      throw new Error('Please enter your password to confirm this deletion.');
    }

    const user = impact.requiresReauthentication
      ? await reauthenticateCurrentUserWithPassword(password ?? '')
      : getCurrentFirebaseUser();
    const deletedAt = todayISO();

    await repositories.deletionAuditLogs.addDeletionAuditLog({
      targetType: impact.targetType,
      targetId: impact.targetId,
      targetLabel: impact.targetLabel,
      reason:
        trimmedReason ||
        'Deleted without linked history; password and reason were not required.',
      deletedByUid: user?.uid,
      deletedByEmail: user?.email ?? undefined,
      deletedAt,
      deletedCounts: impact.counts,
      targetSnapshot: impact.targetSnapshot,
    });

    await deleteImpactRecords(impact);
  },
};
