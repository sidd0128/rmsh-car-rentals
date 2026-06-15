import dayjs from 'dayjs';
import {
  collection,
  doc,
  DocumentReference,
  runTransaction,
  Transaction,
} from 'firebase/firestore';
import { FIRESTORE_COLLECTION_NAMES } from '@core/firebase/constants/firestoreCollectionNames';
import { executeWithFreshFirebaseSession } from '@core/firebase/auth/services/firebaseAuthSessionService';
import { getCurrentFirebaseUser } from '@core/firebase/auth/services/firebaseAuthService';
import { getFirestoreDatabaseOrNull } from '@core/firebase/services/firestoreDatabaseService';
import { findBookingConflict } from '@core/services/bookingConflictService';
import { calculateRentalBillingPreview } from '@core/services/rentalBillingService';
import {
  deriveCarStatus,
  resolveCurrentBookingForCar,
  resolveFutureBookingsForCar,
} from '@core/services/availabilityService';
import type { BookingRequest, Car, PaymentRecord, Rental } from '@core/types/domain';

const nowISO = (): string => new Date().toISOString();

const sanitizeForFirestore = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(item => sanitizeForFirestore(item));
  }

  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>(
      (clean, [key, entry]) => {
        if (entry !== undefined) {
          clean[key] = sanitizeForFirestore(entry);
        }
        return clean;
      },
      {},
    );
  }

  return value;
};

const setWithoutId = <T extends { id: string }>(
  transaction: Transaction,
  ref: DocumentReference,
  entity: T,
): void => {
  const data: Partial<T> = { ...entity };
  delete data.id;
  transaction.set(ref, sanitizeForFirestore(data) as Record<string, unknown>);
};

const getCarBookings = (car: Car): Rental[] => [
  ...(car.currentBooking ? [car.currentBooking] : []),
  ...(car.futureBookings ?? []),
];

const getDb = () => {
  const db = getFirestoreDatabaseOrNull();
  if (!db) {
    throw new Error('Firebase is not configured. Booking requests require cloud sync.');
  }
  return db;
};

export const bookingRequestApprovalService = {
  async approveRequest(requestId: string): Promise<string> {
    const db = getDb();
    const userId = getCurrentFirebaseUser()?.uid;
    let rentalId = '';

    await executeWithFreshFirebaseSession(() =>
      runTransaction(db, async transaction => {
        const requestRef = doc(db, FIRESTORE_COLLECTION_NAMES.BOOKING_REQUESTS, requestId);
        const requestSnapshot = await transaction.get(requestRef);
        if (!requestSnapshot.exists()) {
          throw new Error('Booking request was not found.');
        }

        const request = {
          id: requestSnapshot.id,
          ...requestSnapshot.data(),
        } as BookingRequest;
        if (request.status !== 'PENDING') {
          throw new Error('This booking request has already been resolved.');
        }

        const carRef = doc(db, FIRESTORE_COLLECTION_NAMES.CARS, request.carId);
        const carSnapshot = await transaction.get(carRef);
        if (!carSnapshot.exists()) {
          throw new Error('Requested car was not found.');
        }
        const car = { id: carSnapshot.id, ...carSnapshot.data() } as Car;
        const carRentals = getCarBookings(car);
        const conflict = findBookingConflict(carRentals, {
          startDate: request.startDate,
          endDate: request.endDate,
        });
        if (conflict) {
          throw new Error('This car now has another booking for those dates.');
        }

        const preview = calculateRentalBillingPreview({
          startDate: request.startDate,
          endDate: request.endDate,
          frequency: request.billingFrequency,
          rateAmount: request.rateAmount,
          rentDueWeekday: request.rentDueWeekday,
          rentDueDayOfMonth: request.rentDueDayOfMonth,
        });
        if (preview.installments.length === 0) {
          throw new Error('Booking request has an invalid payment schedule.');
        }

        const timestamp = nowISO();
        const rentalRef = doc(collection(db, FIRESTORE_COLLECTION_NAMES.RENTALS));
        rentalId = rentalRef.id;
        const start = dayjs(request.startDate);
        const rental: Rental = {
          id: rentalRef.id,
          carId: request.carId,
          customerId: request.customerId,
          startDate: request.startDate,
          endDate: request.endDate,
          agreedPrice: preview.totalAmount,
          paymentStatus: 'PENDING',
          status: dayjs().isBefore(start, 'day') ? 'UPCOMING' : 'ACTIVE',
          billingFrequency: request.billingFrequency,
          rateAmount: request.rateAmount,
          collectFirstPaymentOnAssignment: false,
          rentDueWeekday: request.rentDueWeekday,
          rentDueDayOfMonth: request.rentDueDayOfMonth,
          createdAt: timestamp,
          updatedAt: timestamp,
        };

        const paymentDocs: Array<{ ref: DocumentReference; payment: PaymentRecord }> =
          preview.installments.map(installment => {
            const paymentRef = doc(collection(db, FIRESTORE_COLLECTION_NAMES.PAYMENTS));
            return {
              ref: paymentRef,
              payment: {
                id: paymentRef.id,
                rentalId: rental.id,
                customerId: request.customerId,
                carId: request.carId,
                amount: installment.amount,
                status: 'PENDING',
                dueDate: installment.dueDate,
                installmentIndex: installment.index,
                label: installment.label,
                periodStart: installment.periodStart,
                periodEnd: installment.periodEnd,
                createdAt: timestamp,
                updatedAt: timestamp,
              },
            };
          });

        const updatedCarRentals = [...carRentals, rental];
        setWithoutId(transaction, rentalRef, rental);
        paymentDocs.forEach(({ ref, payment }) => setWithoutId(transaction, ref, payment));
        transaction.update(
          carRef,
          sanitizeForFirestore({
            status: deriveCarStatus(car, updatedCarRentals),
            currentBooking: resolveCurrentBookingForCar(request.carId, updatedCarRentals),
            futureBookings: resolveFutureBookingsForCar(request.carId, updatedCarRentals),
            updatedAt: timestamp,
          }) as Record<string, unknown>,
        );
        transaction.update(requestRef, {
          status: 'APPROVED',
          rentalId: rental.id,
          resolvedBy: userId,
          resolvedAt: timestamp,
          updatedAt: timestamp,
        });
      }),
    );

    return rentalId;
  },

  async declineRequest(requestId: string): Promise<void> {
    const db = getDb();
    const userId = getCurrentFirebaseUser()?.uid;
    const timestamp = nowISO();

    await executeWithFreshFirebaseSession(() =>
      runTransaction(db, async transaction => {
        const requestRef = doc(db, FIRESTORE_COLLECTION_NAMES.BOOKING_REQUESTS, requestId);
        const requestSnapshot = await transaction.get(requestRef);
        if (!requestSnapshot.exists()) {
          throw new Error('Booking request was not found.');
        }

        const request = requestSnapshot.data() as BookingRequest;
        if (request.status !== 'PENDING') {
          throw new Error('This booking request has already been resolved.');
        }

        transaction.update(requestRef, {
          status: 'DECLINED',
          resolvedBy: userId,
          resolvedAt: timestamp,
          updatedAt: timestamp,
        });
      }),
    );
  },
};
