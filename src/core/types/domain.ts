/**
 * Domain entity types shared across features, repositories, Firestore, and stores.
 */
import type { MediaUri } from './media';

export type CarStatus = 'AVAILABLE' | 'ON_RENT' | 'UPCOMING_BOOKING';
export type RentalStatus = 'ACTIVE' | 'COMPLETED' | 'UPCOMING';
export type PaymentStatus = 'PENDING' | 'DONE' | 'NOT_PAID';
/** How recurring rent is charged for a rental contract. */
export type BillingFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface PriceConfiguration {
  id: string;
  label: string;
  dailyRate: number;
  weeklyRate?: number;
  monthlyRate?: number;
}

export interface Rental {
  id: string;
  carId: string;
  customerId: string;
  startDate: string;
  endDate: string;
  /** Total contract value (sum of all installments). */
  agreedPrice: number;
  paymentStatus: PaymentStatus;
  status: RentalStatus;
  /** Recurring billing; omitted on legacy rentals (single payment). */
  billingFrequency?: BillingFrequency;
  /** Per-day / per-week / per-month rate at assignment. */
  rateAmount?: number;
  /** First installment collected on assignment day when true. */
  collectFirstPaymentOnAssignment?: boolean;
  /** 0–6 (Sun–Sat) rent due weekday when billingFrequency is WEEKLY. */
  rentDueWeekday?: number;
  /** 1–28 rent due day of month when billingFrequency is MONTHLY. */
  rentDueDayOfMonth?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Car {
  id: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  numberPlate: string;
  regoExpiryDate?: string;
  purchaseDate?: string;
  images: MediaUri[];
  status: CarStatus;
  priceConfigurations: PriceConfiguration[];
  currentBooking?: Rental;
  futureBookings: Rental[];
  totalEarnings: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  age: number;
  phone: string;
  email?: string;
  address: string;
  licenseNumber?: string;
  photo?: MediaUri;
  drivingLicenseImages: MediaUri[];
  documents: MediaUri[];
  totalSpent: number;
  totalRentals: number;
  fineHistory: string[];
  accidentHistory: string[];
  isBlacklisted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Fine {
  id: string;
  customerId: string;
  carId: string;
  amount: number;
  reason: string;
  fineDate: string;
  paidStatus: boolean;
  proofImages: MediaUri[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AccidentRecord {
  id: string;
  customerId: string;
  carId: string;
  accidentDate: string;
  description: string;
  damageCost: number;
  proofImages: MediaUri[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  id: string;
  rentalId: string;
  customerId: string;
  carId: string;
  amount: number;
  status: PaymentStatus;
  /** When this installment is due (start of period). */
  dueDate?: string;
  installmentIndex?: number;
  /** e.g. "Week 2", "Day 3" */
  label?: string;
  periodStart?: string;
  periodEnd?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateCarPayload = Omit<
  Car,
  'id' | 'totalEarnings' | 'currentBooking' | 'futureBookings' | 'createdAt' | 'updatedAt'
>;

export type CreateCustomerPayload = Omit<
  Customer,
  'id' | 'totalSpent' | 'totalRentals' | 'fineHistory' | 'accidentHistory' | 'createdAt' | 'updatedAt'
>;

export type CreateRentalPayload = Omit<Rental, 'id' | 'createdAt' | 'updatedAt'>;

export type CreateFinePayload = Omit<Fine, 'id' | 'createdAt' | 'updatedAt'>;

export type CreateAccidentPayload = Omit<AccidentRecord, 'id' | 'createdAt' | 'updatedAt'>;
