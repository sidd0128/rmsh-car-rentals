export interface ParsedApiError {
  message: string;
  code?: string;
}

export const parseApiError = (error: unknown): ParsedApiError => {
  if (error instanceof Error) {
    return { message: error.message };
  }

  if (typeof error === 'object' && error !== null) {
    const maybeCode = 'code' in error ? String(error.code) : undefined;
    const maybeMessage = 'message' in error ? String(error.message) : undefined;
    return {
      code: maybeCode,
      message: maybeMessage || 'Something went wrong.',
    };
  }

  return { message: 'Something went wrong.' };
};
