import type { NavigatorScreenParams } from '@react-navigation/native';
import type { CarFilter } from '@features/cars/store/useCarFilterStore';

export type CarsStackParamList = {
  CarsList: { filter?: CarFilter } | undefined;
  CarDetails: { carId: string };
  CarForm: { carId?: string };
};

export type CustomersStackParamList = {
  CustomersList: undefined;
  CustomerProfile: { customerId: string };
  CustomerForm: { customerId?: string };
};

export type RentalsStackParamList = {
  RentalsList: undefined;
  RentalDetails: { rentalId: string };
};

export type DashboardStackParamList = {
  DashboardHome: undefined;
  EarningsBreakdown: undefined;
  UpcomingEarnings: undefined;
};

export type SettingsStackParamList = {
  SettingsHome: undefined;
  FinesList: undefined;
  FineForm: { fineId?: string };
  AccidentsList: undefined;
  AccidentForm: undefined;
};

export type BottomTabParamList = {
  DashboardTab: NavigatorScreenParams<DashboardStackParamList>;
  CarsTab: NavigatorScreenParams<CarsStackParamList>;
  CustomersTab: NavigatorScreenParams<CustomersStackParamList>;
  RentalsTab: NavigatorScreenParams<RentalsStackParamList>;
  SettingsTab: NavigatorScreenParams<SettingsStackParamList>;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  MainTabs: NavigatorScreenParams<BottomTabParamList>;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
