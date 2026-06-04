import {
  extractFineDocumentAutofill,
  resolveRentalForFineDate,
} from '../fineDocumentAutofillService';
import dayjs from 'dayjs';
import type { Car, Customer, Rental } from '@core/types/domain';

const customers: Customer[] = [
  {
    id: 'customer-1',
    name: 'Sam Driver',
    age: 32,
    phone: '0400000000',
    address: 'Sydney',
    drivingLicenseImages: [],
    documents: [],
    totalSpent: 0,
    totalRentals: 0,
    fineHistory: [],
    accidentHistory: [],
    isBlacklisted: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'customer-2',
    name: 'Alex Later',
    age: 40,
    phone: '0400000001',
    address: 'Melbourne',
    drivingLicenseImages: [],
    documents: [],
    totalSpent: 0,
    totalRentals: 0,
    fineHistory: [],
    accidentHistory: [],
    isBlacklisted: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

const cars: Car[] = [
  {
    id: 'car-1',
    name: 'Corolla',
    brand: 'Toyota',
    model: 'Corolla',
    year: 2022,
    color: 'White',
    numberPlate: 'ABC 123',
    images: [],
    status: 'ON_RENT',
    priceConfigurations: [],
    futureBookings: [],
    totalEarnings: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

const rentals: Rental[] = [
  {
    id: 'rental-1',
    carId: 'car-1',
    customerId: 'customer-1',
    startDate: '2026-03-01T00:00:00.000Z',
    endDate: '2026-03-15T23:59:59.000Z',
    agreedPrice: 700,
    paymentStatus: 'PENDING',
    status: 'COMPLETED',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'rental-2',
    carId: 'car-1',
    customerId: 'customer-2',
    startDate: '2026-03-16T00:00:00.000Z',
    endDate: '2026-03-30T23:59:59.000Z',
    agreedPrice: 700,
    paymentStatus: 'PENDING',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

describe('fineDocumentAutofillService', () => {
  it('extracts amount, offence date, plate, and date-based rental assignment', () => {
    const result = extractFineDocumentAutofill({
      ocrText: [
        'Penalty Notice',
        'Vehicle registration: ABC-123',
        'Date of offence: 12/03/2026',
        'Amount due $302.75',
        'Speed camera detected offence',
      ].join('\n'),
      cars,
      customers,
      rentals,
    });

    expect(result.amount).toBe(302.75);
    expect(dayjs(result.fineDate).format('YYYY-MM-DD')).toBe('2026-03-12');
    expect(result.numberPlate).toBe('ABC 123');
    expect(result.customerId).toBe('customer-1');
    expect(result.carId).toBe('car-1');
    expect(result.reason).toBe('Speed camera detected offence');
  });

  it('resolves the later customer when the fine date falls in a later rental window', () => {
    const result = resolveRentalForFineDate({
      fineDate: new Date('2026-03-20T10:30:00.000Z'),
      cars,
      customers,
      rentals,
      numberPlate: 'ABC123',
    });

    expect(result).toEqual({ customerId: 'customer-2', carId: 'car-1' });
  });

  it('prefers the labelled fine amount over larger warning amounts on NSW notices', () => {
    const result = extractFineDocumentAutofill({
      ocrText: [
        'Fine Reminder Notice',
        'Offence date:',
        '13 FEB 2026',
        'Fine notice number:',
        '6133355241',
        'Fine amount:',
        '$1,230.00',
        'Date due:',
        '14 MAY 2026',
        'If you do not nominate the driver, you will have to pay the full fine amount of $1,230.00 and face a further fine of more than $1400.',
        'What will happen if I do not nominate the driver by the due date?',
        'Courts may issue fines up to $22000.',
      ].join('\n'),
      cars,
      customers,
      rentals,
    });

    expect(result.amount).toBe(1230);
  });
});
