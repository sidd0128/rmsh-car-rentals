import { useModalStore } from '@zustand/useModalStore';

export interface ErrorLogContext {
  componentStack?: string;
  source?: string;
}

const stringifyError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String(error.message);
  }

  return String(error);
};

export const logError = (error: unknown, context: ErrorLogContext = {}): void => {
  if (__DEV__) {
    console.error('[RMSHRentals]', context, error);
  }

  const source = context.source ? `\n\nSource: ${context.source}` : '';
  useModalStore.getState().showAlert({
    title: 'Error',
    message: `${stringifyError(error)}${source}`,
    okText: 'OK',
  });
};
