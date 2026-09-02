import type { ImageSourcePropType } from 'react-native';

export type NativeOnboardingSlide = {
  backgroundColor: string;
  id: '1' | '2' | '3';
  image: ImageSourcePropType;
  title: string;
};

export const ONBOARDING_RECOMMENDED_ART_SIZE = {
  width: 1290,
  height: 2796,
} as const;

/**
 * Static requires are intentional: Metro must discover and bundle each asset
 * for Expo Go, iOS and Android without evaluating a dynamic path.
 */
export const ONBOARDING_SLIDES: readonly NativeOnboardingSlide[] = [
  {
    id: '1',
    image: require('../../assets/banners/1.png'),
    title: 'Encuentra proveedores de servicios verificados',
    backgroundColor: '#ef5335',
  },
  {
    id: '2',
    image: require('../../assets/banners/2.png'),
    title: 'Paga cómodamente con transferencia o tarjeta',
    backgroundColor: '#ef5335',
  },
  {
    id: '3',
    image: require('../../assets/banners/3.png'),
    title: 'Coordina el cuidado de tu mascota desde Hupi',
    backgroundColor: '#ef5335',
  },
];
