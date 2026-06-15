import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

/** Shared dayjs strict-parse formats for OCR date tokens (AU-style documents). */
export const OCR_DATE_FORMATS: string[] = [
  'D/M/YYYY',
  'DD/MM/YYYY',
  'D-MM-YYYY',
  'DD-MM-YYYY',
  'D.M.YYYY',
  'DD.MM.YYYY',
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

const normalizeOcrMonthCase = (value: string): string =>
  value.replace(
    /\b(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|SEPT|OCT|NOV|DEC)\b/g,
    month => month.charAt(0) + month.slice(1).toLowerCase(),
  );

/** Parse a single OCR date token (e.g. `12/03/2024` or `12 Mar 2024`). */
export const parseOcrDateToken = (raw: string): Date | undefined => {
  const parsed = dayjs(normalizeOcrMonthCase(raw), OCR_DATE_FORMATS, true);
  return parsed.isValid() ? parsed.startOf('day').toDate() : undefined;
};
