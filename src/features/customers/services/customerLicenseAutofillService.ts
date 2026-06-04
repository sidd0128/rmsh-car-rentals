import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

export interface CustomerLicenseExtraction {
  text: string;
  name?: string;
  age?: number;
  dateOfBirth?: Date;
  address?: string;
  licenseNumber?: string;
}

interface AutofillInput {
  ocrText: string;
  referenceDate?: Date;
}

const dateFormats = [
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

const ignoredNameValues = new Set([
  'address',
  'australia',
  'card number',
  'date of birth',
  'dob',
  'driver licence',
  'driver license',
  'expiry',
  'expiry date',
  'none',
  'refreshed',
  'licence',
  'licence class',
  'licence no',
  'license',
  'license class',
  'license no',
  'name',
  'new south wales australia',
]);

const labelPatterns = {
  address: /^(address|residential address|addr)\b/i,
  dateOfBirth: /^(date of birth|birth date|dob|d\.o\.b\.?)\b/i,
  expiry: /^(expiry|expires|expiry date|valid to)\b/i,
  givenName: /^(given name\(s\)|given names|given name|first names|first name)(?:\b|$)/i,
  licence:
    /^(licence no\.?|license no\.?|licence number|license number|licence class|license class|card number|licence|license|class)(?:\b|$)/i,
  name: /^(name|licence holder|license holder|driver name|cardholder)\b/i,
  state: /^(nsw|vic|qld|sa|wa|tas|act|nt)\b/i,
  surname: /^(surname|family name|last name)\b/i,
};

const licenseNumberLabel = /^(licence no\.?|license no\.?|licence number|license number)(?:\b|$)/i;
const licenseDetailLabel = /^(licence no\.?|license no\.?|licence number|license number|licence class|license class)(?:\b|$)/i;

const normalizeLine = (line: string): string =>
  line.replace(/\s+/g, ' ').replace(/^[|:;\-.\s]+|[|:;\-.\s]+$/g, '').trim();

const normalizeName = (value: string): string =>
  normalizeLine(value)
    .replace(/\b(MR|MRS|MS|MISS|DR)\b\.?/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

const compactLabel = (line: string): string => line.replace(/[^a-z]/gi, '').toLowerCase();

const normalizeMonthCase = (value: string): string =>
  value.replace(
    /\b(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|SEPT|OCT|NOV|DEC)\b/g,
    month => month.charAt(0) + month.slice(1).toLowerCase(),
  );

const isLikelyLabel = (line: string): boolean => {
  const normalized = normalizeLine(line);
  return Object.values(labelPatterns).some(pattern => pattern.test(normalized));
};

const isLikelyNameValue = (line: string): boolean => {
  const value = normalizeName(line);
  if (!value || value.length < 3) {
    return false;
  }
  if (ignoredNameValues.has(value.toLowerCase())) {
    return false;
  }
  if (/\d/.test(value)) {
    return false;
  }
  return /^[a-z][a-z' -]+$/i.test(value);
};

const isHeaderLine = (line: string): boolean => {
  const normalized = compactLabel(line);
  return (
    normalized === 'nswdriverlicence' ||
    normalized === 'driverlicence' ||
    normalized === 'driverlicense' ||
    normalized === 'newsouthwalesaustralia' ||
    normalized === 'newsouthwales' ||
    normalized === 'australia'
  );
};

const valueAfterLabel = (line: string, label: RegExp): string | undefined => {
  const match = line.match(label);
  if (!match) {
    return undefined;
  }

  return normalizeLine(line.slice(match[0].length));
};

const nextValueLine = (lines: string[], startIndex: number): string | undefined => {
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line) {
      continue;
    }
    if (isLikelyLabel(line)) {
      return undefined;
    }
    return line;
  }
  return undefined;
};

const parseDate = (value: string): Date | undefined => {
  const dateMatch =
    value.match(/\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b/) ??
    value.match(/\b(\d{1,2}[.]\d{1,2}[.]\d{2,4})\b/) ??
    value.match(
      /\b(\d{1,2}\s+(?:Jan|January|Feb|February|Mar|March|Apr|April|May|Jun|June|Jul|July|Aug|August|Sep|Sept|September|Oct|October|Nov|November|Dec|December)\s+\d{2,4})\b/i,
    );

  if (!dateMatch) {
    return undefined;
  }

  const parsed = dayjs(normalizeMonthCase(dateMatch[1]), dateFormats, true);
  return parsed.isValid() ? parsed.startOf('day').toDate() : undefined;
};

const parseDateOfBirth = (lines: string[]): Date | undefined => {
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (labelPatterns.dateOfBirth.test(line)) {
      const inlineValue = valueAfterLabel(line, labelPatterns.dateOfBirth);
      const value = inlineValue || lines.slice(index + 1).find(Boolean);
      if (value) {
        const parsed = parseDate(value);
        if (parsed) {
          return parsed;
        }
      }
    }
  }

  return undefined;
};

const calculateAge = (dateOfBirth: Date, referenceDate: Date): number | undefined => {
  const age = dayjs(referenceDate).diff(dayjs(dateOfBirth), 'year');
  return age >= 0 && age <= 120 ? age : undefined;
};

const parseName = (lines: string[]): string | undefined => {
  let surname: string | undefined;
  let givenName: string | undefined;

  lines.forEach((line, index) => {
    if (labelPatterns.surname.test(line)) {
      const value = valueAfterLabel(line, labelPatterns.surname) || nextValueLine(lines, index);
      if (value && isLikelyNameValue(value)) {
        surname = normalizeName(value);
      }
    }

    if (labelPatterns.givenName.test(line)) {
      const value = valueAfterLabel(line, labelPatterns.givenName) || nextValueLine(lines, index);
      if (value && isLikelyNameValue(value)) {
        givenName = normalizeName(value);
      }
    }
  });

  if (givenName && surname) {
    return `${givenName} ${surname}`;
  }

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!labelPatterns.name.test(line)) {
      continue;
    }

    const inlineValue = valueAfterLabel(line, labelPatterns.name);
    const value = inlineValue || nextValueLine(lines, index);
    if (value && isLikelyNameValue(value)) {
      return normalizeName(value);
    }
  }

  const licenceNumberIndex = lines.findIndex(line => licenseNumberLabel.test(line));
  const standaloneNameBeforeLicence =
    licenceNumberIndex > 0
      ? lines
          .slice(0, licenceNumberIndex)
          .reverse()
          .find(line => isLikelyNameValue(line) && !isHeaderLine(line) && !parseDate(line))
      : undefined;
  if (standaloneNameBeforeLicence) {
    return normalizeName(standaloneNameBeforeLicence);
  }

  const standaloneName = lines.find(
    line => isLikelyNameValue(line) && !isHeaderLine(line) && !parseDate(line),
  );
  if (standaloneName) {
    return normalizeName(standaloneName);
  }

  return undefined;
};

const isAddressLine = (line: string): boolean => {
  if (!line || isLikelyLabel(line)) {
    return false;
  }
  if (labelPatterns.state.test(line) && line.length <= 4) {
    return false;
  }
  const hasStateAndPostcode = /\b(NSW|VIC|QLD|SA|WA|TAS|ACT|NT)\b\s+\d{4}\b/i.test(line);
  const hasStreetWord =
    /\d/.test(line) &&
    /\b(ST|STREET|RD|ROAD|AVE|AVENUE|DR|DRIVE|CRES|CRESCENT|CT|COURT|PL|PLACE|LN|LANE|HWY|HIGHWAY|PDE|PARADE|TCE|TERRACE|WAY)\b/i.test(
      line,
    );
  return hasStateAndPostcode || hasStreetWord;
};

const parseAddress = (lines: string[]): string | undefined => {
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!labelPatterns.address.test(line)) {
      continue;
    }

    const inlineValue = valueAfterLabel(line, labelPatterns.address);
    const addressLines = inlineValue ? [inlineValue] : [];

    for (let cursor = index + 1; cursor < lines.length && addressLines.length < 4; cursor += 1) {
      const next = lines[cursor];
      if (!next || isLikelyLabel(next) || labelPatterns.expiry.test(next) || labelPatterns.licence.test(next)) {
        break;
      }
      if (isAddressLine(next) || addressLines.length > 0) {
        addressLines.push(next);
      }
    }

    const address = addressLines.map(normalizeLine).filter(Boolean).join(', ');
    if (address.length >= 6) {
      return address;
    }
  }

  const addressCandidates = lines
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => isAddressLine(line) && !parseDate(line));
  const licenceIndex = lines.findIndex(line => licenseDetailLabel.test(line));
  const candidatesBeforeLicence =
    licenceIndex >= 0
      ? addressCandidates.filter(({ index }) => index < licenceIndex)
      : [];
  const lastAddressLine = candidatesBeforeLicence[candidatesBeforeLicence.length - 1];
  const previousAddressLine = lastAddressLine
    ? candidatesBeforeLicence.find(({ index }) => index === lastAddressLine.index - 1)
    : undefined;
  const addressBeforeLicence = lastAddressLine
    ? [previousAddressLine?.line, lastAddressLine.line].filter(Boolean).join(', ')
    : undefined;

  return addressBeforeLicence || addressCandidates[0]?.line;
};

const parseLicenseNumber = (lines: string[]): string | undefined => {
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!licenseNumberLabel.test(line)) {
      continue;
    }

    const inlineValue = valueAfterLabel(line, licenseNumberLabel);
    const value = inlineValue || nextValueLine(lines, index);
    const match = value?.match(/\b\d[\d\s]{4,}\d\b/);
    if (match) {
      return match[0].replace(/\s+/g, '');
    }
  }

  return undefined;
};

const preprocessLines = (text: string): string[] =>
  text
    .split(/\r?\n/)
    .map(normalizeLine)
    .filter(Boolean);

export const extractCustomerLicenseAutofill = ({
  ocrText,
  referenceDate = new Date(),
}: AutofillInput): CustomerLicenseExtraction => {
  const lines = preprocessLines(ocrText);
  const dateOfBirth = parseDateOfBirth(lines);
  const age = dateOfBirth ? calculateAge(dateOfBirth, referenceDate) : undefined;

  return {
    text: ocrText,
    name: parseName(lines),
    age,
    dateOfBirth,
    address: parseAddress(lines),
    licenseNumber: parseLicenseNumber(lines),
  };
};
