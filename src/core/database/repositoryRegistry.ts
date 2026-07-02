/**
 * Central registry for repository implementations.
 * Offline-first wrappers read/write AsyncStorage locally and sync to Firestore when online.
 */
import type { IAccidentRepository } from '@features/accidents/repository/IAccidentRepository';
import type { IBookingRequestRepository } from '@features/bookingRequests/repository/IBookingRequestRepository';
import type { ICarRepository } from '@features/cars/repository/ICarRepository';
import type { ICustomerRepository } from '@features/customers/repository/ICustomerRepository';
import type { IFineRepository } from '@features/fines/repository/IFineRepository';
import type { IPaymentRepository } from '@features/payments/repository/IPaymentRepository';
import type { IRentalRepository } from '@features/rentals/repository/IRentalRepository';
import type { IDeletionAuditLogRepository } from '@features/security/repository/IDeletionAuditLogRepository';
import {
  offlineFirstAccidentRepository,
  offlineFirstBookingRequestRepository,
  offlineFirstCarRepository,
  offlineFirstCustomerRepository,
  offlineFirstFineRepository,
  offlineFirstPaymentRepository,
  offlineFirstRentalRepository,
  offlineFirstDeletionAuditLogRepository,
} from './offlineFirstRepositories';

export const repositories = {
  cars: offlineFirstCarRepository as ICarRepository,
  customers: offlineFirstCustomerRepository as ICustomerRepository,
  rentals: offlineFirstRentalRepository as IRentalRepository,
  fines: offlineFirstFineRepository as IFineRepository,
  accidents: offlineFirstAccidentRepository as IAccidentRepository,
  payments: offlineFirstPaymentRepository as IPaymentRepository,
  deletionAuditLogs:
    offlineFirstDeletionAuditLogRepository as IDeletionAuditLogRepository,
  bookingRequests:
    offlineFirstBookingRequestRepository as IBookingRequestRepository,
};
