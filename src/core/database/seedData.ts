import dayjs from 'dayjs';
import { SEED_VERSION } from '../constants/app';
import { createId } from '../helpers/id';
import { todayISO } from '../helpers/date';
import { storageService } from '../storage/storageService';
import { STORAGE_KEYS } from '../storage/storageKeys';
import { repositories } from './repositoryRegistry';
import type {
  Car,
  Customer,
  Fine,
  AccidentRecord,
  PaymentRecord,
  Rental,
} from '../types/domain';

const placeholderImage = (label: string) =>
  `https://via.placeholder.com/400x240/1E3A5F/FFFFFF?text=${encodeURIComponent(label)}`;

const buildSeedData = () => {
  const now = todayISO();
  const customer1Id = createId();
  const customer2Id = createId();
  const car1Id = createId();
  const car2Id = createId();
  const car3Id = createId();
  const rental1Id = createId();
  const rental2Id = createId();

  const customers: Customer[] = [
    {
      id: customer1Id,
      name: 'Erik Lindström',
      age: 34,
      phone: '+46 70 123 4567',
      address: 'Sveavägen 12, Stockholm',
      photo: placeholderImage('Erik'),
      drivingLicenseImages: [placeholderImage('License+Front')],
      documents: [placeholderImage('Passport')],
      totalSpent: 12400,
      totalRentals: 3,
      fineHistory: [],
      accidentHistory: [],
      isBlacklisted: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: customer2Id,
      name: 'Anna Berg',
      age: 28,
      phone: '+46 73 987 6543',
      address: 'Kungsgatan 5, Göteborg',
      drivingLicenseImages: [placeholderImage('License')],
      documents: [],
      totalSpent: 5600,
      totalRentals: 2,
      fineHistory: [],
      accidentHistory: [],
      isBlacklisted: false,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const rental1: Rental = {
    id: rental1Id,
    carId: car1Id,
    customerId: customer1Id,
    startDate: dayjs().subtract(2, 'day').toISOString(),
    endDate: dayjs().add(5, 'day').toISOString(),
    agreedPrice: 4200,
    paymentStatus: 'PENDING',
    status: 'ACTIVE',
    notes: 'Airport pickup',
    createdAt: now,
    updatedAt: now,
  };

  const rental2: Rental = {
    id: rental2Id,
    carId: car2Id,
    customerId: customer2Id,
    startDate: dayjs().add(3, 'day').toISOString(),
    endDate: dayjs().add(10, 'day').toISOString(),
    agreedPrice: 5600,
    paymentStatus: 'DONE',
    status: 'UPCOMING',
    createdAt: now,
    updatedAt: now,
  };

  const cars: Car[] = [
    {
      id: car1Id,
      name: 'Volvo XC60',
      brand: 'Volvo',
      model: 'XC60',
      year: 2022,
      color: 'Black',
      numberPlate: 'ABC 123',
      images: [
        placeholderImage('Volvo+1'),
        placeholderImage('Volvo+2'),
        placeholderImage('Volvo+3'),
      ],
      status: 'ON_RENT',
      priceConfigurations: [
        { id: createId(), label: 'Standard', dailyRate: 600, weeklyRate: 3500 },
      ],
      currentBooking: rental1,
      futureBookings: [],
      totalEarnings: 18400,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: car2Id,
      name: 'Tesla Model 3',
      brand: 'Tesla',
      model: 'Model 3',
      year: 2023,
      color: 'White',
      numberPlate: 'XYZ 789',
      images: [placeholderImage('Tesla+1'), placeholderImage('Tesla+2')],
      status: 'UPCOMING_BOOKING',
      priceConfigurations: [
        { id: createId(), label: 'Premium', dailyRate: 800, weeklyRate: 4800 },
      ],
      futureBookings: [rental2],
      totalEarnings: 22000,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: car3Id,
      name: 'BMW 320i',
      brand: 'BMW',
      model: '320i',
      year: 2021,
      color: 'Blue',
      numberPlate: 'DEF 456',
      images: [placeholderImage('BMW')],
      status: 'AVAILABLE',
      priceConfigurations: [
        { id: createId(), label: 'Economy', dailyRate: 450 },
      ],
      futureBookings: [],
      totalEarnings: 9800,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const rentals: Rental[] = [rental1, rental2];

  const payments: PaymentRecord[] = [
    {
      id: createId(),
      rentalId: rental2Id,
      customerId: customer2Id,
      carId: car2Id,
      amount: 5600,
      status: 'DONE',
      paidAt: now,
      createdAt: now,
    },
    {
      id: createId(),
      rentalId: rental1Id,
      customerId: customer1Id,
      carId: car1Id,
      amount: 4200,
      status: 'PENDING',
      createdAt: now,
    },
  ];

  const fines: Fine[] = [
    {
      id: createId(),
      customerId: customer1Id,
      carId: car1Id,
      amount: 1500,
      reason: 'Parking violation',
      fineDate: dayjs().subtract(30, 'day').toISOString(),
      paidStatus: true,
      proofImages: [placeholderImage('Fine+Proof')],
      createdAt: now,
    },
  ];

  const accidents: AccidentRecord[] = [];

  return { cars, customers, rentals, payments, fines, accidents };
};

export const seedDatabaseIfNeeded = async (): Promise<void> => {
  const version = await storageService.getItem<string>(STORAGE_KEYS.SEED_VERSION);
  if (version === SEED_VERSION) {
    return;
  }

  const existing = await repositories.cars.getCars();
  if (existing.length > 0) {
    await storageService.setItem(STORAGE_KEYS.SEED_VERSION, SEED_VERSION);
    return;
  }

  const data = buildSeedData();

  await Promise.all([
    storageService.setItem(STORAGE_KEYS.CARS, data.cars),
    storageService.setItem(STORAGE_KEYS.CUSTOMERS, data.customers),
    storageService.setItem(STORAGE_KEYS.RENTALS, data.rentals),
    storageService.setItem(STORAGE_KEYS.PAYMENTS, data.payments),
    storageService.setItem(STORAGE_KEYS.FINES, data.fines),
    storageService.setItem(STORAGE_KEYS.ACCIDENTS, data.accidents),
    storageService.setItem(STORAGE_KEYS.SEED_VERSION, SEED_VERSION),
  ]);
};
