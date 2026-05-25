import { composeValidators, positiveNumber, requiredField } from '@core/validation/validators';

export const carFormRules = {
  name: composeValidators(requiredField('Car name')),
  brand: composeValidators(requiredField('Brand')),
  model: composeValidators(requiredField('Model')),
  year: composeValidators(requiredField('Year'), positiveNumber('Year')),
  color: composeValidators(requiredField('Color')),
  numberPlate: composeValidators(requiredField('Number plate')),
  dailyRate: composeValidators(requiredField('Daily rate'), positiveNumber('Daily rate')),
};
