import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import type { Car, Customer, Rental } from '@core/types/domain';

dayjs.extend(customParseFormat);

export interface FineDocumentExtraction {
  text: string;
  amount?: number;
  fineDate?: Date;
  carId?: string;
  customerId?: string;
  numberPlate?: string;
  reason?: string;
}

interface AutofillInput {
  ocrText: string;
  cars: Car[];
  customers: Customer[];
  rentals: Rental[];
}

interface RentalMatchInput {
  fineDate: Date;
  cars: Car[];
  customers: Customer[];
  rentals: Rental[];
  numberPlate?: string;
}

const amountContextWords = [
  'amount',
  'amount due',
  'balance',
  'charge',
  'cost',
  'fine',
  'fee',
  'infringement',
  'penalty',
  'total',
  'toll',
];

const strongAmountContextWords = [
  'amount due',
  'balance due',
  'fine amount',
  'infringement amount',
  'notice amount',
  'penalty amount',
  'total amount',
  'total due',
  'toll amount',
];

const warningAmountContextWords = [
  'additional fine',
  'courts may issue',
  'face a further fine',
  'further fine',
  'maximum',
  'more than',
  'separate fine',
  'up to',
];

const dateContextWords = [
  'date of offence',
  'offence date',
  'offense date',
  'trip date',
  'travel date',
  'incident date',
  'contravention date',
  'date/time',
  'date',
];

const reasonKeywords = [
  'speed',
  'red light',
  'parking',
  'toll',
  'toll notice',
  'infringement',
  'penalty notice',
  'camera detected',
  'bus lane',
];

const normalizeLookup = (value: string): string =>
  value.replace(/[^a-z0-9]/gi, '').toUpperCase();

const containsWord = (line: string, words: string[]): boolean => {
  const normalized = line.toLowerCase();
  return words.some(word => normalized.includes(word));
};

const parseAmount = (text: string): number | undefined => {
  const lines = text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);
  const candidates: Array<{ amount: number; score: number; lineIndex: number }> = [];

  lines.forEach((line, index) => {
    const context = [lines[index - 1], line, lines[index + 1]]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    const hasAmountContext = containsWord(context, amountContextWords);
    const hasStrongAmountContext = containsWord(context, strongAmountContextWords);
    const hasWarningAmountContext = containsWord(context, warningAmountContextWords);
    const score =
      (hasAmountContext ? 2 : 0) +
      (hasStrongAmountContext ? 8 : 0) -
      (hasWarningAmountContext ? 6 : 0);
    const currencyMatches = line.matchAll(/(?:AUD|A\$|\$)\s*([0-9][0-9,]*(?:\.\d{2})?)/gi);
    for (const match of currencyMatches) {
      candidates.push({
        amount: Number(match[1].replace(/,/g, '')),
        score: score + 2,
        lineIndex: index,
      });
    }

    if (score > 0) {
      const bareMatches = line.matchAll(/\b([0-9]{1,5}(?:\.\d{2})?)\b/g);
      for (const match of bareMatches) {
        const amount = Number(match[1]);
        if (amount >= 1) {
          candidates.push({ amount, score, lineIndex: index });
        }
      }
    }
  });

  return candidates
    .filter(candidate => Number.isFinite(candidate.amount))
    .sort((a, b) => b.score - a.score || a.lineIndex - b.lineIndex || b.amount - a.amount)[0]
    ?.amount;
};

const parseDateCandidates = (text: string): Array<{ date: Date; score: number }> => {
  const lines = text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);
  const candidates: Array<{ date: Date; score: number }> = [];
  const numericDate = /\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b/g;
  const wordDate = /\b(\d{1,2}\s+(?:Jan|January|Feb|February|Mar|March|Apr|April|May|Jun|June|Jul|July|Aug|August|Sep|Sept|September|Oct|October|Nov|November|Dec|December)\s+\d{2,4})\b/gi;
  const formats = [
    'D/M/YYYY',
    'DD/MM/YYYY',
    'D-MM-YYYY',
    'DD-MM-YYYY',
    'D/M/YY',
    'DD/MM/YY',
    'D-MM-YY',
    'DD-MM-YY',
    'D MMM YYYY',
    'DD MMM YYYY',
    'D MMMM YYYY',
    'DD MMMM YYYY',
    'D MMM YY',
    'DD MMM YY',
    'D MMMM YY',
    'DD MMMM YY',
  ];

  lines.forEach((line, index) => {
    const context = [lines[index - 1], line, lines[index + 1]]
      .filter(Boolean)
      .join(' ');
    const score = containsWord(context, dateContextWords) ? 2 : 0;
    const matches = [...line.matchAll(numericDate), ...line.matchAll(wordDate)];

    matches.forEach(match => {
      const raw = match[1];
      const parsed = dayjs(raw, formats, true);
      if (parsed.isValid()) {
        candidates.push({
          date: parsed.startOf('day').toDate(),
          score,
        });
      }
    });
  });

  return candidates.sort(
    (a, b) => b.score - a.score || dayjs(b.date).valueOf() - dayjs(a.date).valueOf(),
  );
};

const parseFineDate = (text: string): Date | undefined => parseDateCandidates(text)[0]?.date;

const detectNumberPlate = (text: string, cars: Car[]): string | undefined => {
  const normalizedText = normalizeLookup(text);

  return cars.find(car => {
    const plate = normalizeLookup(car.numberPlate);
    return plate.length >= 3 && normalizedText.includes(plate);
  })?.numberPlate;
};

const detectReason = (text: string): string | undefined => {
  const lines = text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);

  return lines
    .map(line => {
      const normalized = line.toLowerCase();
      const score = reasonKeywords.reduce(
        (total, keyword) => total + (normalized.includes(keyword) ? keyword.length : 0),
        0,
      );
      return { line, score };
    })
    .filter(candidate => candidate.score > 0)
    .sort((a, b) => b.score - a.score)[0]?.line;
};

const isFineDateWithinRental = (fineDate: Date, rental: Rental): boolean => {
  const target = dayjs(fineDate).startOf('day').valueOf();
  const start = dayjs(rental.startDate).startOf('day').valueOf();
  const end = dayjs(rental.endDate).endOf('day').valueOf();
  return target >= start && target <= end;
};

export const resolveRentalForFineDate = ({
  fineDate,
  cars,
  customers,
  rentals,
  numberPlate,
}: RentalMatchInput): Pick<FineDocumentExtraction, 'carId' | 'customerId'> => {
  const normalizedPlate = numberPlate ? normalizeLookup(numberPlate) : undefined;
  const carByPlate = normalizedPlate
    ? cars.find(car => normalizeLookup(car.numberPlate) === normalizedPlate)
    : undefined;

  const matchingRentals = rentals.filter(rental => {
    const hasEntities =
      cars.some(car => car.id === rental.carId) &&
      customers.some(customer => customer.id === rental.customerId);
    const matchesPlate = carByPlate ? rental.carId === carByPlate.id : true;
    return hasEntities && matchesPlate && isFineDateWithinRental(fineDate, rental);
  });

  const bestRental = matchingRentals.sort((a, b) => {
    const aStatusScore = a.status === 'ACTIVE' ? 1 : 0;
    const bStatusScore = b.status === 'ACTIVE' ? 1 : 0;
    return bStatusScore - aStatusScore || dayjs(b.startDate).valueOf() - dayjs(a.startDate).valueOf();
  })[0];

  return {
    carId: bestRental?.carId,
    customerId: bestRental?.customerId,
  };
};

export const extractFineDocumentAutofill = ({
  ocrText,
  cars,
  customers,
  rentals,
}: AutofillInput): FineDocumentExtraction => {
  const amount = parseAmount(ocrText);
  const fineDate = parseFineDate(ocrText);
  const numberPlate = detectNumberPlate(ocrText, cars);
  const rentalMatch = fineDate
    ? resolveRentalForFineDate({ fineDate, cars, customers, rentals, numberPlate })
    : {};

  return {
    text: ocrText,
    amount,
    fineDate,
    numberPlate,
    reason: detectReason(ocrText),
    ...rentalMatch,
  };
};
