import dayjs from 'dayjs';
import {
  calculateRentalBillingPreview,
  countRentalDays,
  resolveInstallmentDueDate,
} from '../rentalBillingService';

describe('rentalBillingService', () => {
  it('counts inclusive rental days', () => {
    expect(
      countRentalDays('2026-05-01T00:00:00.000Z', '2026-05-07T00:00:00.000Z'),
    ).toBe(7);
    expect(
      countRentalDays('2026-05-07T00:00:00.000Z', '2026-05-01T00:00:00.000Z'),
    ).toBe(0);
  });

  it('builds daily installments', () => {
    const preview = calculateRentalBillingPreview({
      startDate: '2026-05-01',
      endDate: '2026-05-03',
      frequency: 'DAILY',
      rateAmount: 50,
    });
    expect(preview.installments).toHaveLength(3);
    expect(preview.totalAmount).toBe(150);
    expect(preview.installments[0].amount).toBe(50);
  });

  it('builds weekly installments with partial final week as full week', () => {
    const preview = calculateRentalBillingPreview({
      startDate: '2026-05-01',
      endDate: '2026-05-10',
      frequency: 'WEEKLY',
      rateAmount: 300,
    });
    expect(preview.installments).toHaveLength(2);
    expect(preview.totalAmount).toBe(600);
    expect(preview.installments[1].label).toContain('Week 2');
  });

  it('builds monthly installments for multi-month span', () => {
    const preview = calculateRentalBillingPreview({
      startDate: '2026-01-01',
      endDate: '2026-02-15',
      frequency: 'MONTHLY',
      rateAmount: 1200,
    });
    expect(preview.installments.length).toBeGreaterThanOrEqual(2);
    expect(preview.totalAmount).toBe(preview.installments.length * 1200);
  });

  it('resolveInstallmentDueDate finds Friday in a Mon–Sun week', () => {
    const start = dayjs('2026-05-04T12:00:00').startOf('day');
    const end = start.add(6, 'day');
    const due = resolveInstallmentDueDate(start, end, 'WEEKLY', 5);
    expect(due.format('YYYY-MM-DD')).toBe('2026-05-08');
    expect(due.day()).toBe(5);
  });

  it('uses rent due weekday inside each weekly period', () => {
    const preview = calculateRentalBillingPreview({
      startDate: '2026-05-04',
      endDate: '2026-05-10',
      frequency: 'WEEKLY',
      rateAmount: 200,
      rentDueWeekday: 5,
    });
    expect(preview.installments).toHaveLength(1);
    expect(preview.installments[0].dueDate).toBe('2026-05-08');
  });

  it('uses nearest prior Friday for a partial final week', () => {
    const preview = calculateRentalBillingPreview({
      startDate: '2026-05-04',
      endDate: '2026-05-20',
      frequency: 'WEEKLY',
      rateAmount: 200,
      rentDueWeekday: 5,
    });
    const last = preview.installments[preview.installments.length - 1];
    expect(dayjs(last.dueDate).day()).toBe(5);
    expect(last.dueDate).toBe('2026-05-15');
  });

  it('uses rent due day of month for monthly periods', () => {
    const start = dayjs('2026-01-10');
    const end = dayjs('2026-02-20');
    const due = resolveInstallmentDueDate(start, end, 'MONTHLY', undefined, 15);
    expect(due.date()).toBe(15);
  });

  it('returns empty preview for invalid dates or zero rate', () => {
    expect(
      calculateRentalBillingPreview({
        startDate: '2026-05-10',
        endDate: '2026-05-01',
        frequency: 'DAILY',
        rateAmount: 100,
      }).installments,
    ).toHaveLength(0);
    expect(
      calculateRentalBillingPreview({
        startDate: '2026-05-01',
        endDate: '2026-05-05',
        frequency: 'DAILY',
        rateAmount: 0,
      }).totalAmount,
    ).toBe(0);
  });
});
