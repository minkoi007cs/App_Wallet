import { useColorScheme as useRNColorScheme } from 'react-native';
import { Colors, ThemeColors } from '@/constants/theme';

export function useTheme(): {
  colorScheme: 'light' | 'dark';
  colors: ThemeColors;
  isDark: boolean;
} {
  const systemScheme = useRNColorScheme();
  const colorScheme = systemScheme === 'light' ? 'light' : 'dark';
  const colors = Colors[colorScheme];

  return {
    colorScheme,
    colors,
    isDark: colorScheme === 'dark',
  };
}
