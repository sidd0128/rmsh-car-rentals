import type { CarEarningsSection, RentalEarningRow } from './buildCarEarningsSections';

export type EarningsListItem =
  | {
      kind: 'car-header';
      key: string;
      section: CarEarningsSection;
      expanded: boolean;
    }
  | {
      kind: 'hire';
      key: string;
      row: RentalEarningRow;
      carId: string;
    };

interface BuildEarningsListItemsParams {
  sections: CarEarningsSection[];
  expandedCarId?: string;
  /** When true, every car section with hires is expanded (used during search). */
  expandAll: boolean;
}

/**
 * Flattens car sections into a virtualized list: header row + hire rows only when expanded.
 */
export const buildEarningsListItems = ({
  sections,
  expandedCarId,
  expandAll,
}: BuildEarningsListItemsParams): EarningsListItem[] => {
  const items: EarningsListItem[] = [];

  for (const section of sections) {
    const expanded = expandAll || expandedCarId === section.carId;

    items.push({
      kind: 'car-header',
      key: `car-${section.carId}`,
      section,
      expanded,
    });

    if (!expanded) {
      continue;
    }

    for (const row of section.rentals) {
      items.push({
        kind: 'hire',
        key: row.rentalId,
        row,
        carId: section.carId,
      });
    }
  }

  return items;
};

export const countTotalHires = (sections: CarEarningsSection[]): number =>
  sections.reduce((sum, section) => sum + section.hireCount, 0);

export const countVisibleHires = (sections: CarEarningsSection[]): number =>
  sections.reduce((sum, section) => sum + section.rentals.length, 0);
