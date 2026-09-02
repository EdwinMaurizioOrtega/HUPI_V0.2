import { colors } from './colors';
import { fonts, typography } from './typography';

export const theme = {
  colors,
  fonts,
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },
  radius: {
    sm: 10,
    md: 16,
    lg: 22,
    pill: 999,
  },
  shadow: {
    shadowColor: '#3f2d25',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  typography: {
    display: typography.display.fontSize,
    heroTitle: typography.heroTitle.fontSize,
    title: typography.title.fontSize,
    sectionTitle: typography.sectionTitle.fontSize,
    heading: typography.sectionTitle.fontSize,
    subheading: typography.subtitle.fontSize,
    body: typography.body.fontSize,
    bodyMedium: typography.bodyMedium.fontSize,
    small: typography.small.fontSize,
    caption: typography.caption.fontSize,
    button: typography.button.fontSize,
  },
} as const;
