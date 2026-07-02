export const STORAGE_KEYS = {
  CARS: '@rmsh/cars',
  CUSTOMERS: '@rmsh/customers',
  RENTALS: '@rmsh/rentals',
  FINES: '@rmsh/fines',
  ACCIDENTS: '@rmsh/accidents',
  PAYMENTS: '@rmsh/payments',
  BOOKING_REQUESTS: '@rmsh/booking_requests',
  DELETION_AUDIT_LOGS: '@rmsh/deletion_audit_logs',
  APP_SETTINGS: '@rmsh/app_settings',
  /** Pending Firestore writes while offline */
  SYNC_OUTBOX: '@rmsh/sync_outbox',
  /** Last successful cloud sync timestamp */
  SYNC_METADATA: '@rmsh/sync_metadata',
  PUSH_NOTIFICATIONS_ENABLED: '@rmsh/push_notifications_enabled',
  PUSH_NOTIFICATION_TOKEN: '@rmsh/push_notification_token',
  THEME_MODE: '@rmsh/theme_mode',
  LANGUAGE: '@rmsh/language',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
