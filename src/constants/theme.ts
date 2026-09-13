// ─────────────────────────────────────────────
//  THÈME — AllWhist (Version Finale Stabilisée)
// ─────────────────────────────────────────────

import { normalize } from '../utils/normalize';

export const Colors = {
  bg: '#ffffff',
  bgCard: '#f0f4f7',
  bgSurface: '#ffffff',
  bgInput: '#f8f9fa',
  primary: '#1D9E75',
  primaryDark: '#146e52',
  primaryLight: '#5DCAA5',
  cardRed: '#ff0000',
  cardBlue: '#0088ff',
  cardBlack: '#1a1a1a',
  textPrimary: '#1a1a1a',
  textSecondary: '#455a64',
  textMuted: '#78909c',
  textOnPrimary: '#ffffff',
  border: '#e0e0e0',
  borderLight: '#eceff1',
  success: '#1D9E75',
  error: '#E24B4A',
  warning: '#EF9F27',
  info: '#378ADD',
  cardRedVibrant: '#ff0000',
  debutant: '#1D9E75',
  intermediaire: '#378ADD',
  expert: '#E24B4A',
} as const;

export const Spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32,
} as const;

export const Radius = {
  sm: 4, md: 8, lg: 12, xl: 20, full: 999,
} as const;

export const FontSize = {
  xs: normalize(12),
  sm: normalize(14),
  md: normalize(16),
  lg: normalize(18),
  xl: normalize(22),
  xxl: normalize(30),
};

export const FontWeight = {
  regular: '400' as const,
  medium:  '500' as const,
  semibold:'600' as const,
  bold:    '700' as const,
  black:   '900' as const,
};

export const CardSize = {
  hand:  { width: normalize(52), height: normalize(74), radius: 6 },
  table: { width: normalize(90), height: normalize(128), radius: 10 },
  mini:  { width: normalize(32), height: normalize(44), radius: 3 },
  back:  { width: normalize(40), height: normalize(56), radius: 4 },
};

export const Shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  panel: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
};

export { normalize };
