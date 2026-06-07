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

export type AppColorKey = keyof typeof colors;
export type AppColors = Record<AppColorKey, string>;

export const darkColors: AppColors = {
  primary: '#7DB7F0',
  primaryDark: '#4A90D9',
  primaryLight: '#B7D8F8',
  secondary: '#38BDF8',
  accent: '#FBBF24',

  background: '#0B1220',
  surface: '#111827',
  surfaceElevated: '#1F2937',

  text: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textInverse: '#0F172A',
  textMuted: '#94A3B8',

  border: '#334155',
  borderLight: '#1E293B',
  divider: '#334155',

  success: '#34D399',
  successBg: '#064E3B',
  warning: '#FBBF24',
  warningBg: '#78350F',
  error: '#F87171',
  errorBg: '#7F1D1D',
  info: '#60A5FA',
  infoBg: '#1E3A8A',

  statusAvailable: '#34D399',
  statusOnRent: '#60A5FA',
  statusUpcoming: '#FBBF24',
  statusPending: '#FBBF24',
  statusDone: '#34D399',

  overlay: 'rgba(2, 6, 23, 0.72)',
  imageViewerBg: '#000000',
  shadow: '#000000',
  transparent: 'transparent',
};
