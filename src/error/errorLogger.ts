export interface ErrorLogContext {
  componentStack?: string;
  source?: string;
}

export const logError = (error: unknown, context: ErrorLogContext = {}): void => {
  if (__DEV__) {
    console.error('[RMSHRentals]', context, error);
  }
};
