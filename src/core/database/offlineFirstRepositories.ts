/**
 * Offline-first repository wrappers registered in `repositoryRegistry.ts`.
 * Reads: AsyncStorage only. Writes: local first, then Firestore (or outbox when offline).
 */
import { FIRESTORE_COLLECTION_NAMES } from '@core/firebase/constants/firestoreCollectionNames';
import type { IAccidentRepository } from '@features/accidents/repository/IAccidentRepository';
import { asyncStorageAccidentRepository } from '@features/accidents/repository/asyncStorageAccidentRepository';
import { asyncStorageBookingRequestRepository } from '@features/bookingRequests/repository/asyncStorageBookingRequestRepository';
import type { ICarRepository } from '@features/cars/repository/ICarRepository';
import { asyncStorageCarRepository } from '@features/cars/repository/asyncStorageCarRepository';
import type { ICustomerRepository } from '@features/customers/repository/ICustomerRepository';
import { asyncStorageCustomerRepository } from '@features/customers/repository/asyncStorageCustomerRepository';
import type { IFineRepository } from '@features/fines/repository/IFineRepository';
import { asyncStorageFineRepository } from '@features/fines/repository/asyncStorageFineRepository';
import type { IPaymentRepository } from '@features/payments/repository/IPaymentRepository';
import { asyncStoragePaymentRepository } from '@features/payments/repository/asyncStoragePaymentRepository';
import type { IRentalRepository } from '@features/rentals/repository/IRentalRepository';
import { asyncStorageRentalRepository } from '@features/rentals/repository/asyncStorageRentalRepository';
import type {
  Car,
  CreateAccidentPayload,
  CreateCarPayload,
  CreateCustomerPayload,
  CreateFinePayload,
  CreateRentalPayload,
  Customer,
  Fine,
  PaymentRecord,
  Rental,
} from '@core/types/domain';
import { saveEntityWithCloudSync } from './offlineFirstRepositoryHelpers';
import { cloudEntityWriteService } from '@core/sync/services/cloudEntityWriteService';

class OfflineFirstCarRepository implements ICarRepository {
  getCars = () => asyncStorageCarRepository.getCars();
  getCarById = (id: string) => asyncStorageCarRepository.getCarById(id);
  addCar = (payload: CreateCarPayload) =>
    saveEntityWithCloudSync(
      FIRESTORE_COLLECTION_NAMES.CARS,
      () => asyncStorageCarRepository.addCar(payload),
      car => asyncStorageCarRepository.updateCar(car),
    );
  updateCar = async (car: Car) => {
    const previousCar = await asyncStorageCarRepository.getCarById(car.id);
    await asyncStorageCarRepository.updateCar(car);
    await saveEntityWithCloudSync(
      FIRESTORE_COLLECTION_NAMES.CARS,
      async () => car,
      syncedCar => asyncStorageCarRepository.updateCar(syncedCar),
      previousCar,
    );
  };
  deleteCar = async (id: string) => {
    await asyncStorageCarRepository.deleteCar(id);
    await cloudEntityWriteService.deleteEntity(FIRESTORE_COLLECTION_NAMES.CARS, id);
  };
}

class OfflineFirstCustomerRepository implements ICustomerRepository {
  getCustomers = () => asyncStorageCustomerRepository.getCustomers();
  getCustomerById = (id: string) =>
    asyncStorageCustomerRepository.getCustomerById(id);
  addCustomer = (payload: CreateCustomerPayload) =>
    saveEntityWithCloudSync(
      FIRESTORE_COLLECTION_NAMES.CUSTOMERS,
      () => asyncStorageCustomerRepository.addCustomer(payload),
      customer => asyncStorageCustomerRepository.updateCustomer(customer),
    );
  updateCustomer = async (customer: Customer) => {
    const previousCustomer =
      await asyncStorageCustomerRepository.getCustomerById(customer.id);
    await asyncStorageCustomerRepository.updateCustomer(customer);
    await saveEntityWithCloudSync(
      FIRESTORE_COLLECTION_NAMES.CUSTOMERS,
      async () => customer,
      syncedCustomer =>
        asyncStorageCustomerRepository.updateCustomer(syncedCustomer),
      previousCustomer,
    );
  };
}

class OfflineFirstRentalRepository implements IRentalRepository {
  getRentals = () => asyncStorageRentalRepository.getRentals();
  getRentalById = (id: string) =>
    asyncStorageRentalRepository.getRentalById(id);
  getRentalsByCarId = (carId: string) =>
    asyncStorageRentalRepository.getRentalsByCarId(carId);
  addRental = (payload: CreateRentalPayload) =>
    saveEntityWithCloudSync(FIRESTORE_COLLECTION_NAMES.RENTALS, () =>
      asyncStorageRentalRepository.addRental(payload),
    );
  updateRental = async (rental: Rental) => {
    await asyncStorageRentalRepository.updateRental(rental);
    await saveEntityWithCloudSync(
      FIRESTORE_COLLECTION_NAMES.RENTALS,
      async () => rental,
    );
  };
}

class OfflineFirstFineRepository implements IFineRepository {
  getFines = () => asyncStorageFineRepository.getFines();
  addFine = (payload: CreateFinePayload) =>
    saveEntityWithCloudSync(
      FIRESTORE_COLLECTION_NAMES.FINES,
      () => asyncStorageFineRepository.addFine(payload),
      fine => asyncStorageFineRepository.updateFine(fine),
    );
  updateFine = async (fine: Fine) => {
    const previousFine = (await asyncStorageFineRepository.getFines()).find(
      f => f.id === fine.id,
    );
    await asyncStorageFineRepository.updateFine(fine);
    await saveEntityWithCloudSync(
      FIRESTORE_COLLECTION_NAMES.FINES,
      async () => fine,
      syncedFine => asyncStorageFineRepository.updateFine(syncedFine),
      previousFine,
    );
  };
}

class OfflineFirstAccidentRepository implements IAccidentRepository {
  getAccidents = () => asyncStorageAccidentRepository.getAccidents();
  addAccident = (payload: CreateAccidentPayload) =>
    saveEntityWithCloudSync(
      FIRESTORE_COLLECTION_NAMES.ACCIDENTS,
      () => asyncStorageAccidentRepository.addAccident(payload),
      accident => asyncStorageAccidentRepository.save(accident),
    );
}

class OfflineFirstPaymentRepository implements IPaymentRepository {
  getPayments = () => asyncStoragePaymentRepository.getPayments();
  addPayment = (
    payment: Omit<PaymentRecord, 'id' | 'createdAt' | 'updatedAt'>,
  ) =>
    saveEntityWithCloudSync(FIRESTORE_COLLECTION_NAMES.PAYMENTS, () =>
      asyncStoragePaymentRepository.addPayment(payment),
    );
  updatePayment = async (payment: PaymentRecord) => {
    await asyncStoragePaymentRepository.updatePayment(payment);
    await saveEntityWithCloudSync(
      FIRESTORE_COLLECTION_NAMES.PAYMENTS,
      async () => payment,
    );
  };
}

export const offlineFirstCarRepository = new OfflineFirstCarRepository();
export const offlineFirstCustomerRepository =
  new OfflineFirstCustomerRepository();
export const offlineFirstRentalRepository = new OfflineFirstRentalRepository();
export const offlineFirstFineRepository = new OfflineFirstFineRepository();
export const offlineFirstAccidentRepository =
  new OfflineFirstAccidentRepository();
export const offlineFirstPaymentRepository =
  new OfflineFirstPaymentRepository();
export const offlineFirstBookingRequestRepository =
  asyncStorageBookingRequestRepository;
