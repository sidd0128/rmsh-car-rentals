import { parseApiError } from './apiErrorParser';
import { logError } from './errorLogger';

export const handleError = (error: unknown, source: string): string => {
  const parsed = parseApiError(error);
  logError(error, { source });
  return parsed.message;
};
