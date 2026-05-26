import type { CarEarningsSection } from './buildCarEarningsSections';

const matchesQuery = (section: CarEarningsSection, query: string): CarEarningsSection | null => {
  const carNameMatch = section.carName.toLowerCase().includes(query);

  const rentals = section.rentals.filter(
    row =>
      carNameMatch ||
      row.customerName.toLowerCase().includes(query) ||
      row.periodLabel.toLowerCase().includes(query),
  );

  if (rentals.length === 0) {
    return null;
  }

  const totalPaid = rentals.reduce((sum, row) => sum + row.paidAmount, 0);
  const totalAgreed = rentals.reduce((sum, row) => sum + row.agreedPrice, 0);

  return {
    ...section,
    rentals,
    hireCount: rentals.length,
    totalPaid,
    totalAgreed,
    totalPending: Math.max(0, totalAgreed - totalPaid),
  };
};

/** Filters hires by customer name, period text, or car name; recomputes totals for matches only. */
export const filterCarEarningsSections = (
  sections: CarEarningsSection[],
  rawQuery: string,
): CarEarningsSection[] => {
  const query = rawQuery.trim().toLowerCase();
  if (!query) {
    return sections;
  }

  return sections
    .map(section => matchesQuery(section, query))
    .filter((section): section is CarEarningsSection => section !== null);
};
