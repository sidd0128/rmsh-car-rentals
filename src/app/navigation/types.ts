import type { NavigatorScreenParams } from '@react-navigation/native';

export type CarsStackParamList = {
  CarsList: undefined;
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
};

export type SettingsStackParamList = {
  SettingsHome: undefined;
  FinesList: undefined;
  FineForm: { fineId?: string };
  AccidentsList: undefined;
  AccidentForm: { accidentId?: string };
};

export type BottomTabParamList = {
  DashboardTab: NavigatorScreenParams<DashboardStackParamList>;
  CarsTab: NavigatorScreenParams<CarsStackParamList>;
  CustomersTab: NavigatorScreenParams<CustomersStackParamList>;
  RentalsTab: NavigatorScreenParams<RentalsStackParamList>;
  SettingsTab: NavigatorScreenParams<SettingsStackParamList>;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<BottomTabParamList>;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
