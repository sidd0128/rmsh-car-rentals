import type { MediaUri } from './media';

export type CarStatus = 'AVAILABLE' | 'ON_RENT' | 'UPCOMING_BOOKING';
export type RentalStatus = 'ACTIVE' | 'COMPLETED' | 'UPCOMING';
export type PaymentStatus = 'PENDING' | 'DONE';

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
  agreedPrice: number;
  paymentStatus: PaymentStatus;
  status: RentalStatus;
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
  address: string;
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
}

export interface PaymentRecord {
  id: string;
  rentalId: string;
  customerId: string;
  carId: string;
  amount: number;
  status: PaymentStatus;
  paidAt?: string;
  createdAt: string;
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

export type CreateFinePayload = Omit<Fine, 'id' | 'createdAt'>;

export type CreateAccidentPayload = Omit<AccidentRecord, 'id' | 'createdAt'>;
