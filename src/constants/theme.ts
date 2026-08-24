import { Platform } from 'react-native';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceSubtle: string;
  border: string;
  borderStrong: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  brand: string;
  brandHover: string;
  statusHealthy: string;
  statusHealthyBg: string;
  statusWarning: string;
  statusWarningBg: string;
  statusCritical: string;
  statusCriticalBg: string;
  accent: string;
  tabBar: string;
  tabBarBorder: string;
  tabActive: string;
  tabInactive: string;
  // Backward compatibility properties for template defaults
  text: string;
  backgroundElement: string;
  backgroundSelected: string;
}

export const Colors: { light: ThemeColors; dark: ThemeColors } = {
  light: {
    background: '#FFFFFF',
    surface: '#F4F4F5',
    surfaceSubtle: '#FAFAFA',
    border: '#E4E4E7',
    borderStrong: '#D4D4D8',
    textPrimary: '#09090B',
    textSecondary: '#71717A',
    textMuted: '#A1A1AA',
    brand: '#4F46E5',
    brandHover: '#4338CA',
    statusHealthy: '#10B981',
    statusHealthyBg: '#ECFDF5',
    statusWarning: '#F59E0B',
    statusWarningBg: '#FFFBEB',
    statusCritical: '#EF4444',
    statusCriticalBg: '#FEF2F2',
    accent: '#0EA5E9',
    tabBar: '#FFFFFF',
    tabBarBorder: '#E4E4E7',
    tabActive: '#09090B',
    tabInactive: '#71717A',
    text: '#09090B',
    backgroundElement: '#F4F4F5',
    backgroundSelected: '#E4E4E7',
  },
  dark: {
    background: '#09090B',
    surface: '#18181B',
    surfaceSubtle: '#27272A',
    border: '#27272A',
    borderStrong: '#3F3F46',
    textPrimary: '#FAFAFA',
    textSecondary: '#A1A1AA',
    textMuted: '#71717A',
    brand: '#6366F1',
    brandHover: '#818CF8',
    statusHealthy: '#10B981',
    statusHealthyBg: '#064E3B',
    statusWarning: '#F59E0B',
    statusWarningBg: '#78350F',
    statusCritical: '#EF4444',
    statusCriticalBg: '#7F1D1D',
    accent: '#38BDF8',
    tabBar: '#09090B',
    tabBarBorder: '#27272A',
    tabActive: '#FAFAFA',
    tabInactive: '#71717A',
    text: '#FAFAFA',
    backgroundElement: '#18181B',
    backgroundSelected: '#27272A',
  },
};

export type ThemeColor = keyof ThemeColors;

export const Fonts = Platform.select({
  ios: {
    sans: 'System',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'Menlo',
  },
  android: {
    sans: 'Roboto',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  default: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    serif: 'serif',
    rounded: 'normal',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },
});

export const Typography = {
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  lineHeight: {
    xs: 16,
    sm: 20,
    base: 24,
    lg: 28,
    xl: 28,
    '2xl': 32,
    '3xl': 36,
    '4xl': 40,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  fontFamily: Fonts,
};

export const Spacing = {
  0: 0,
  half: 2,
  one: 4,
  1: 4,
  two: 8,
  2: 8,
  three: 12,
  3: 12,
  four: 16,
  4: 16,
  five: 20,
  5: 20,
  six: 24,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
};

export const Radius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const Layout = {
  maxContentWidth: 1024,
  maxFormWidth: 540,
};
