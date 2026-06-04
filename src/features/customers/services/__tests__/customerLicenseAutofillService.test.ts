import dayjs from 'dayjs';
import { extractCustomerLicenseAutofill } from '../customerLicenseAutofillService';

describe('customerLicenseAutofillService', () => {
  it('extracts name, age, and multi-line address from labelled licence text', () => {
    const result = extractCustomerLicenseAutofill({
      referenceDate: new Date('2026-06-04T00:00:00.000Z'),
      ocrText: [
        'NSW Driver Licence',
        'Surname',
        'SINGH',
        'Given name(s)',
        'AMANDEEP',
        'Date of Birth',
        '12 Feb 1994',
        'Address',
        '18 Market Street',
        'Parramatta NSW 2150',
        'Licence No 12345678',
      ].join('\n'),
    });

    expect(result.name).toBe('AMANDEEP SINGH');
    expect(result.age).toBe(32);
    expect(dayjs(result.dateOfBirth).format('YYYY-MM-DD')).toBe('1994-02-12');
    expect(result.address).toBe('18 Market Street, Parramatta NSW 2150');
  });

  it('extracts inline name, dob, and address values', () => {
    const result = extractCustomerLicenseAutofill({
      referenceDate: new Date('2026-06-04T00:00:00.000Z'),
      ocrText: [
        'Driver Licence',
        'Name: Priya Sharma',
        'DOB: 03/09/1998',
        'Address: 7 Queen Road Melbourne VIC 3000',
        'Expiry: 03/09/2029',
      ].join('\n'),
    });

    expect(result.name).toBe('Priya Sharma');
    expect(result.age).toBe(27);
    expect(result.address).toBe('7 Queen Road Melbourne VIC 3000');
  });

  it('extracts NSW front-card values without explicit name or address labels', () => {
    const result = extractCustomerLicenseAutofill({
      referenceDate: new Date('2026-06-04T00:00:00.000Z'),
      ocrText: [
        'Driver Licence',
        'New South Wales, Australia',
        'Siddharth KHINDRI',
        'Card Number',
        '2 060 770 476',
        '66 PIERCE ST',
        'LISAROW NSW 2250',
        'Licence No.',
        '25721814',
        'Licence Class',
        'C',
        'Conditions',
        'Q',
        'Date of Birth',
        '28 MAR 1991',
        'Expiry Date',
        '11 MAR 2028',
      ].join('\n'),
    });

    expect(result.name).toBe('Siddharth KHINDRI');
    expect(result.age).toBe(35);
    expect(dayjs(result.dateOfBirth).format('YYYY-MM-DD')).toBe('1991-03-28');
    expect(result.address).toBe('66 PIERCE ST, LISAROW NSW 2250');
    expect(result.licenseNumber).toBe('25721814');
  });

  it('extracts NSW digital licence values when address is not visible', () => {
    const result = extractCustomerLicenseAutofill({
      referenceDate: new Date('2026-06-04T00:00:00.000Z'),
      ocrText: [
        'NSW Driver Licence',
        'NSW',
        'Refreshed',
        '04 Jun 2026',
        '11:03 pm',
        'Siddharth KHINDRI',
        'Licence number',
        '25721814',
        'Expiry',
        '11 Mar 2028',
        'Date of birth',
        '28 Mar 1991',
        'Class',
        'C',
        'Conditions',
        'None',
      ].join('\n'),
    });

    expect(result.name).toBe('Siddharth KHINDRI');
    expect(result.age).toBe(35);
    expect(dayjs(result.dateOfBirth).format('YYYY-MM-DD')).toBe('1991-03-28');
    expect(result.licenseNumber).toBe('25721814');
    expect(result.address).toBeUndefined();
  });
});
