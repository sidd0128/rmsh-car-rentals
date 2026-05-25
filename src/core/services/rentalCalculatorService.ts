import dayjs from 'dayjs';
import type { PriceConfiguration } from '../types/domain';

export const calculateRentalPrice = (
  startDate: string,
  endDate: string,
  dailyRate: number,
): number => {
  const days = Math.max(1, dayjs(endDate).diff(dayjs(startDate), 'day') + 1);
  return days * dailyRate;
};

export const getDefaultDailyRate = (configs: PriceConfiguration[]): number =>
  configs[0]?.dailyRate ?? 0;

export const rentalCalculatorService = {
  calculateRentalPrice,
  getDefaultDailyRate,
};
