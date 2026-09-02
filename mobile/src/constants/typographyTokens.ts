export const fonts = {
  light: 'Fredoka_300Light',
  regular: 'Fredoka_400Regular',
  medium: 'Fredoka_500Medium',
  semiBold: 'Fredoka_600SemiBold',
  bold: 'Fredoka_700Bold',
} as const;

export const typography = {
  display: {
    fontFamily: fonts.bold,
    fontSize: 36,
    lineHeight: 44,
  },
  h1: {
    fontFamily: fonts.bold,
    fontSize: 32,
    lineHeight: 40,
  },
  h2: {
    fontFamily: fonts.semiBold,
    fontSize: 28,
    lineHeight: 36,
  },
  h3: {
    fontFamily: fonts.semiBold,
    fontSize: 21,
    lineHeight: 27,
  },
  pageTitle: {
    fontFamily: fonts.bold,
    fontSize: 30,
    lineHeight: 42,
  },
  pageSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 22,
  },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    lineHeight: 25,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 22,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
  },
  bodyMedium: {
    fontFamily: fonts.medium,
    fontSize: 16,
    lineHeight: 22,
  },
  small: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  caption: {
    fontFamily: fonts.light,
    fontSize: 12,
    lineHeight: 16,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 19,
  },
  button: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    lineHeight: 21,
  },
  overline: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.1,
  },
  // Alias de compatibilidad para estilos existentes.
  heroTitle: {
    fontFamily: fonts.bold,
    fontSize: 36,
    lineHeight: 42,
  },
  sectionTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 21,
    lineHeight: 27,
  },
  eyebrow: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.1,
  },
} as const;

export type TypographyVariant = keyof typeof typography;

export const allowedFredokaFamilies = new Set<string>(Object.values(fonts));

export function resolveFredokaFamily(
  fontWeight?: string | number,
  requestedFamily?: string,
) {
  const numericWeight = typeof fontWeight === 'number'
    ? fontWeight
    : Number.parseInt(String(fontWeight ?? ''), 10);

  if (fontWeight === 'bold' || numericWeight >= 700) return fonts.bold;
  if (numericWeight >= 600) return fonts.semiBold;
  if (numericWeight >= 500) return fonts.medium;
  if (numericWeight > 0 && numericWeight <= 300) return fonts.light;
  if (requestedFamily && allowedFredokaFamilies.has(requestedFamily)) return requestedFamily;
  return fonts.regular;
}
