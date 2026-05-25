export const validationMessages = {
  required: (label: string) => `${label} is required`,
  minLength: (label: string, min: number) => `${label} must be at least ${min} characters`,
  maxLength: (label: string, max: number) => `${label} must be at most ${max} characters`,
  email: 'Enter a valid email address',
  phone: 'Enter a valid phone number',
  positiveNumber: (label: string) => `${label} must be greater than 0`,
  minValue: (label: string, min: number) => `${label} must be at least ${min}`,
  maxValue: (label: string, max: number) => `${label} must be at most ${max}`,
  dateRange: 'End date must be after start date',
  numberPlate: 'Enter a valid number plate',
};
