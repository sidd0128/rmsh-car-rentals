import { validationMessages } from '../messages';

export type ValidatorResult = true | string;
export type Validator<T = string> = (value: T) => ValidatorResult;

export const requiredField =
  (label: string): Validator =>
  (value: string) =>
    value?.trim()?.length ? true : validationMessages.required(label);

export const minLength =
  (label: string, min: number): Validator =>
  (value: string) =>
    value?.trim().length >= min
      ? true
      : validationMessages.minLength(label, min);

export const positiveNumber =
  (label: string): Validator =>
  (value: string) => {
    const num = Number(value);
    return !Number.isNaN(num) && num > 0
      ? true
      : validationMessages.positiveNumber(label);
  };

export const minNumber =
  (label: string, min: number): Validator =>
  (value: string) => {
    const num = Number(value);
    return !Number.isNaN(num) && num >= min
      ? true
      : validationMessages.minValue(label, min);
  };

export const composeValidators =
  (...validators: Validator[]): Validator =>
  (value: string) => {
    for (const validator of validators) {
      const result = validator(value);
      if (result !== true) {
        return result;
      }
    }
    return true;
  };

export const validateField = (value: string, validators: Validator[]): string | undefined => {
  for (const validator of validators) {
    const result = validator(value);
    if (result !== true) {
      return result;
    }
  }
  return undefined;
};
