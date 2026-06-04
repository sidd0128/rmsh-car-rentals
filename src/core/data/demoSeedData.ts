import dayjs from 'dayjs';
import { OPEN_ENDED_RENTAL_END_ISO } from '@core/constants/rental';
import { createId } from '@core/helpers/id';
import { calculateRentalBillingPreview } from '@core/services/rentalBillingService';
import type {
  AccidentRecord,
  Car,
  Customer,
  Fine,
  PaymentRecord,
  Rental,
} from '@core/types/domain';

/** Stable ids — reloading demo replaces the same records. */
export const DEMO_SEED_IDS = {
  cars: {
    corolla: 'demo-car-corolla',
    civic: 'demo-car-civic',
    mazda: 'demo-car-mazda',
    hrv: 'demo-car-hrv',
    camry: 'demo-car-camry',
  },
  customers: {
    siddharth: 'demo-customer-siddharth',
    amelia: 'demo-customer-amelia',
    james: 'demo-customer-james',
    priya: 'demo-customer-priya',
    marco: 'demo-customer-marco',
    lisa: 'demo-customer-lisa',
    blacklisted: 'demo-customer-blacklisted',
  },
} as const;

const iso = (y: number, m: number, d: number, h: number, min: number): string =>
  dayjs().year(y).month(m - 1).date(d).hour(h).minute(min).second(0).millisecond(0).toISOString();

const relIso = (offsetDays: number, h: number, min: number): string =>
  dayjs().add(offsetDays, 'day').hour(h).minute(min).second(0).millisecond(0).toISOString();

const nowIso = (): string => new Date().toISOString();

const baseCustomer = (
  id: string,
  name: string,
  phone: string,
  extra?: Partial<Customer>,
): Customer => ({
  id,
  name,
  age: 32,
  phone,
  address: '42 Demo Street, Sydney NSW',
  licenseNumber: `LIC-${id.slice(-4).toUpperCase()}`,
  drivingLicenseImages: [],
  documents: [],
  totalSpent: 0,
  totalRentals: 0,
  fineHistory: [],
  accidentHistory: [],
  isBlacklisted: false,
  createdAt: nowIso(),
  updatedAt: nowIso(),
  ...extra,
});

const baseCar = (
  id: string,
  name: string,
  numberPlate: string,
  brand: string,
  model: string,
  color = 'White',
): Car => ({
  id,
  name,
  brand,
  model,
  year: 2022,
  color,
  numberPlate,
  images: [],
  status: 'AVAILABLE',
  priceConfigurations: [
    {
      id: createId(),
      label: 'Standard',
      dailyRate: 85,
      weeklyRate: 520,
      monthlyRate: 1800,
    },
  ],
  futureBookings: [],
  totalEarnings: 0,
  createdAt: nowIso(),
  updatedAt: nowIso(),
});

const rental = (
  id: string,
  carId: string,
  customerId: string,
  startDate: string,
  endDate: string,
  status: Rental['status'] = 'COMPLETED',
  paymentStatus: Rental['paymentStatus'] = 'DONE',
): Rental => ({
  id,
  carId,
  customerId,
  startDate,
  endDate,
  agreedPrice: 520,
  paymentStatus,
  status,
  billingFrequency: 'WEEKLY',
  rateAmount: 520,
  rentDueWeekday: 1,
  createdAt: startDate,
  updatedAt: startDate,
});

export interface FullDemoSeedBundle {
  cars: Car[];
  customers: Customer[];
  rentals: Rental[];
  fines: Fine[];
  accidents: AccidentRecord[];
  payments: PaymentRecord[];
}

const buildCorollaHistoryRentals = (
  y: number,
  carId: string,
  customerIds: (typeof DEMO_SEED_IDS)['customers'],
): Rental[] => [
  rental('demo-r-2025-nov-1', carId, customerIds.james, iso(y - 1, 11, 3, 9, 0), iso(y - 1, 11, 18, 20, 0)),
  rental(
    'demo-r-2025-nov-2',
    carId,
    customerIds.amelia,
    iso(y - 1, 11, 22, 10, 0),
    iso(y - 1, 11, 30, 18, 0),
  ),
  rental(
    'demo-r-2025-dec',
    carId,
    customerIds.siddharth,
    iso(y - 1, 12, 5, 8, 0),
    iso(y - 1, 12, 28, 22, 0),
  ),
  rental('demo-r-2026-jan-1', carId, customerIds.siddharth, iso(y, 1, 1, 10, 0), iso(y, 1, 28, 22, 0)),
  rental('demo-r-2026-jan-2', carId, customerIds.amelia, iso(y, 1, 31, 8, 0), iso(y, 2, 2, 12, 0)),
  rental('demo-r-2026-feb-1', carId, customerIds.james, iso(y, 2, 3, 9, 0), iso(y, 2, 12, 18, 0)),
  rental('demo-r-2026-feb-2', carId, customerIds.priya, iso(y, 2, 18, 10, 0), iso(y, 2, 27, 21, 0)),
  rental('demo-r-2026-mar', carId, customerIds.marco, iso(y, 3, 1, 8, 30), iso(y, 3, 25, 19, 0)),
  rental('demo-r-2026-apr-1', carId, customerIds.siddharth, iso(y, 4, 1, 10, 0), iso(y, 4, 14, 18, 0)),
  rental('demo-r-2026-apr-2', carId, customerIds.amelia, iso(y, 4, 14, 19, 0), iso(y, 4, 30, 20, 0)),
  rental(
    'demo-r-2026-may-active',
    carId,
    customerIds.siddharth,
    iso(y, 5, 5, 9, 0),
    iso(y, 5, 26, 23, 59),
    'ACTIVE',
    'PENDING',
  ),
];

const buildPaymentsForRentals = (rentals: Rental[]): PaymentRecord[] => {
  const payments: PaymentRecord[] = [];
  for (const r of rentals) {
    if (r.status === 'UPCOMING' || r.endDate === OPEN_ENDED_RENTAL_END_ISO) {
      continue;
    }
    const preview = calculateRentalBillingPreview({
      startDate: r.startDate,
      endDate: r.endDate,
      frequency: r.billingFrequency ?? 'WEEKLY',
      rateAmount: r.rateAmount ?? 520,
      rentDueWeekday: r.rentDueWeekday,
    });
    preview.installments.forEach((inst, index) => {
      const isPaid =
        r.paymentStatus === 'DONE' ||
        (r.status === 'COMPLETED' && index === 0) ||
        (r.status === 'ACTIVE' && index === 0);
      const isMissed = r.paymentStatus === 'NOT_PAID' && index === preview.installments.length - 1;
      payments.push({
        id: `demo-pay-${r.id}-${index}`,
        rentalId: r.id,
        customerId: r.customerId,
        carId: r.carId,
        amount: inst.amount,
        status: isMissed ? 'NOT_PAID' : isPaid ? 'DONE' : 'PENDING',
        dueDate: inst.dueDate,
        installmentIndex: inst.index,
        label: inst.label,
        periodStart: inst.periodStart,
        periodEnd: inst.periodEnd,
        paidAt: isPaid ? inst.periodStart : undefined,
        createdAt: r.createdAt,
        updatedAt: r.createdAt,
      });
    });
  }
  return payments;
};

/**
 * Full local demo dataset: fleet states, history, fines, accidents, and payments.
 */
export const buildFullDemoSeed = (): FullDemoSeedBundle => {
  const { cars: carIds, customers: customerIds } = DEMO_SEED_IDS;
  const y = dayjs().year();

  const customers: Customer[] = [
    baseCustomer(customerIds.siddharth, 'Siddharth Kumar', '0400 111 222'),
    baseCustomer(customerIds.amelia, 'Amelia Chen', '0400 333 444'),
    baseCustomer(customerIds.james, 'James Wilson', '0400 555 666'),
    baseCustomer(customerIds.priya, 'Priya Sharma', '0400 777 888'),
    baseCustomer(customerIds.marco, 'Marco Rossi', '0400 999 000'),
    baseCustomer(customerIds.lisa, 'Lisa Nguyen', '0400 222 333'),
    baseCustomer(customerIds.blacklisted, 'Alex Blocked', '0400 000 001', {
      isBlacklisted: true,
      age: 29,
    }),
  ];

  const cars: Car[] = [
    baseCar(carIds.corolla, 'Corolla', 'FNB 21 K', 'Toyota', 'Corolla', 'Silver'),
    baseCar(carIds.civic, 'Civic', 'ABC 12 Z', 'Honda', 'Civic', 'Blue'),
    baseCar(carIds.mazda, 'Mazda 3', 'XYZ 99 M', 'Mazda', '3', 'Red'),
    baseCar(carIds.hrv, 'HR-V', 'RET 55 H', 'Honda', 'HR-V', 'Grey'),
    baseCar(carIds.camry, 'Camry', 'UPC 01 C', 'Toyota', 'Camry', 'Black'),
  ];

  const rentals: Rental[] = [
    ...buildCorollaHistoryRentals(y, carIds.corolla, customerIds),
    rental('demo-r-civic-feb', carIds.civic, customerIds.james, iso(y, 2, 10, 11, 0), iso(y, 2, 24, 17, 0)),
    rental('demo-r-civic-apr', carIds.civic, customerIds.priya, iso(y, 4, 8, 8, 0), iso(y, 4, 22, 16, 0)),
    rental(
      'demo-r-civic-active',
      carIds.civic,
      customerIds.lisa,
      relIso(-10, 9, 0),
      relIso(4, 18, 0),
      'ACTIVE',
      'PENDING',
    ),
    rental(
      'demo-r-hrv-returning',
      carIds.hrv,
      customerIds.marco,
      relIso(-12, 8, 0),
      relIso(2, 20, 0),
      'ACTIVE',
      'PENDING',
    ),
    rental(
      'demo-r-camry-upcoming',
      carIds.camry,
      customerIds.amelia,
      relIso(5, 10, 0),
      relIso(19, 18, 0),
      'UPCOMING',
      'PENDING',
    ),
    rental(
      'demo-r-mazda-open',
      carIds.mazda,
      customerIds.james,
      relIso(-3, 14, 0),
      OPEN_ENDED_RENTAL_END_ISO,
      'ACTIVE',
      'PENDING',
    ),
    rental(
      'demo-r-mazda-past',
      carIds.mazda,
      customerIds.priya,
      iso(y, 1, 10, 9, 0),
      iso(y, 1, 20, 17, 0),
      'COMPLETED',
      'NOT_PAID',
    ),
  ];

  const fines: Fine[] = [
    {
      id: 'demo-fine-1',
      customerId: customerIds.siddharth,
      carId: carIds.corolla,
      amount: 120,
      reason: 'Speeding — motorway',
      fineDate: iso(y, 4, 12, 0, 0),
      paidStatus: false,
      proofImages: [],
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: 'demo-fine-2',
      customerId: customerIds.james,
      carId: carIds.civic,
      amount: 85,
      reason: 'Parking — clearway',
      fineDate: relIso(-20, 0, 0),
      paidStatus: true,
      proofImages: [],
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: 'demo-fine-3',
      customerId: customerIds.priya,
      carId: carIds.corolla,
      amount: 200,
      reason: 'Toll evasion',
      fineDate: iso(y, 2, 8, 0, 0),
      paidStatus: false,
      proofImages: [],
      notes: 'Customer notified by SMS',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
  ];

  const accidents: AccidentRecord[] = [
    {
      id: 'demo-accident-1',
      customerId: customerIds.marco,
      carId: carIds.corolla,
      accidentDate: iso(y, 3, 14, 16, 30),
      description: 'Minor bumper scrape in car park',
      damageCost: 450,
      proofImages: [],
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: 'demo-accident-2',
      customerId: customerIds.lisa,
      carId: carIds.civic,
      accidentDate: relIso(-30, 11, 0),
      description: 'Side mirror clipped — repaired',
      damageCost: 320,
      proofImages: [],
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
  ];

  const payments = buildPaymentsForRentals(rentals);

  return { cars, customers, rentals, fines, accidents, payments };
};
