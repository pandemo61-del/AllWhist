// ─────────────────────────────────────────────
//  THÈME — AllWhist
// ─────────────────────────────────────────────

export const Colors = {
  // Fond principal (Clair)
  bg:          '#ffffff',
  bgCard:      '#f0f4f7',
  bgSurface:   '#ffffff',
  bgInput:     '#f8f9fa',

  // Accent principal
  primary:     '#1D9E75',
  primaryDark: '#146e52',
  primaryLight:'#5DCAA5',

  // Cartes (Couleurs vibrantes de l'image)
  cardRed:     '#ff0000', // Coeur / Carreau (Vibrant)
  cardBlue:    '#0088ff', // Pique / Trèfle (Vibrant)
  cardBlack:   '#1a1a1a',

  // Texte (Sombre)
  textPrimary:   '#1a1a1a',
  textSecondary: '#455a64',
  textMuted:     '#78909c',
  textOnPrimary: '#ffffff',

  // Bordures
  border:        '#e0e0e0',
  borderLight:   '#eceff1',

  // Feedbacks
  success:  '#1D9E75',
  error:    '#E24B4A',
  warning:  '#EF9F27',
  info:     '#378ADD',

  // Niveaux de difficulté
  debutant:     '#1D9E75',
  intermediaire:'#EF9F27',
  expert:       '#E24B4A',
} as const;

export const Spacing = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  24,
  xxl: 32,
  xxxl:48,
} as const;

export const Radius = {
  sm:  6,
  md:  10,
  lg:  14,
  xl:  20,
  xxl: 28,
  full: 999,
} as const;

export const FontSize = {
  xs:   11,
  sm:   13,
  md:   15,
  lg:   17,
  xl:   22,
  xxl:  28,
  xxxl: 36,
  card: 20,      // valeur sur carte
  cardSym: 16,   // symbole sur carte
  cardLg: 48,    // grand symbole central
} as const;

export const FontWeight = {
  regular: '400' as const,
  medium:  '500' as const,
  semibold:'600' as const,
  bold:    '700' as const,
  black:   '900' as const,
};

// ─── Dimensions des cartes ─────────────────────

export const CardSize = {
  // Carte en main (taille augmentée pour confort)
  hand: {
    width:  64,
    height: 90,
    radius: 8,
  },
  // Carte jouée sur la table (bien plus grande)
  table: {
    width:  88,
    height: 124,
    radius: 12,
  },
  // Carte dos (adversaires)
  back: {
    width:  40,
    height: 56,
    radius: 5,
  },
  // Petite carte pour l'historique
  mini: {
    width:  34,
    height: 48,
    radius: 4,
  },
  // Carte dos horizontale (côtés)
  backH: {
    width:  56,
    height: 40,
    radius: 5,
  },
} as const;

// ─── Ombres ────────────────────────────────────

export const Shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
  },
  panel: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
} as const;
