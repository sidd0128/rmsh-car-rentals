export const colors = {
  primary: '#1E3A5F',
  primaryDark: '#152A45',
  primaryLight: '#2E5A8F',
  secondary: '#0EA5E9',
  accent: '#F59E0B',

  background: '#F4F6F9',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',

  text: '#0F172A',
  textSecondary: '#64748B',
  textInverse: '#FFFFFF',
  textMuted: '#94A3B8',

  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  divider: '#E2E8F0',

  success: '#10B981',
  successBg: '#D1FAE5',
  warning: '#F59E0B',
  warningBg: '#FEF3C7',
  error: '#EF4444',
  errorBg: '#FEE2E2',
  info: '#3B82F6',
  infoBg: '#DBEAFE',

  statusAvailable: '#10B981',
  statusOnRent: '#3B82F6',
  statusUpcoming: '#F59E0B',
  statusPending: '#F59E0B',
  statusDone: '#10B981',

  overlay: 'rgba(15, 23, 42, 0.6)',
  imageViewerBg: '#000000',
  shadow: '#0F172A',
  transparent: 'transparent',
} as const;

export type AppColors = typeof colors;
