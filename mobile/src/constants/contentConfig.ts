import type { ComponentProps } from 'react';
import type { ImageSourcePropType } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { hupiPagesLogo, hupiSplashLogo } from './brandAssets';
import { colors } from './colors';
import { DEFAULT_PROFILE_IMAGES } from './defaultProfileImages';
import { ONBOARDING_SLIDES } from './onboardingSlides';
import type { ServiceId } from './services';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export type VisualImageSource = ImageSourcePropType;

export type ContentSlot = {
  id: string;
  key: string;
  type: 'splash' | 'branding' | 'onboarding' | 'banner' | 'service-icon' | 'promo' | 'avatar';
  title: string;
  description?: string;
  imageUrl?: string;
  route?: string;
  isActive: boolean;
  order: number;
  updatedAt: string;
};

export type VisualAsset = {
  source?: VisualImageSource;
  fallbackIcon?: IoniconName;
  fallbackText?: string;
  backgroundColor?: string;
};

export type OnboardingSlideConfig = {
  id: string;
  title: string;
  description: string;
  image?: VisualImageSource;
  fallbackIcon: IoniconName;
  backgroundColor: string;
  isActive: boolean;
  order: number;
};

export type VisualBannerConfig = {
  id: string;
  title: string;
  subtitle: string;
  image?: VisualImageSource;
  ctaText: string;
  targetRoute: string;
  isActive: boolean;
  order: number;
  eyebrow?: string;
  icon?: IoniconName;
  accent?: string;
  backgroundColor?: string;
  foregroundColor?: string;
};

export type PromoImageConfig = {
  id: string;
  title: string;
  image?: VisualImageSource;
  section: 'home' | 'marketplace' | 'profile' | 'support';
  isActive: boolean;
  order: number;
};

export type ServiceVisualIconConfig = VisualAsset & {
  label: string;
  fallbackIcon: IoniconName;
};

export type VisualContentConfig = {
  splash: {
    logo: VisualImageSource;
    backgroundColor: string;
    footerText: string;
    soundEnabled: boolean;
  };
  appBranding: {
    internalLogo: VisualImageSource;
    menuLogo: VisualImageSource;
    defaultUserAvatar: VisualAsset;
    defaultProviderAvatar: VisualAsset;
    defaultPetAvatar: VisualAsset;
  };
  onboarding: OnboardingSlideConfig[];
  homeBanners: VisualBannerConfig[];
  marketplaceBanners: VisualBannerConfig[];
  serviceIcons: Record<'walk' | 'nanny' | 'boarding' | 'daycare' | 'grooming' | 'training', ServiceVisualIconConfig>;
  promoImages: PromoImageConfig[];
};

export const visualContentConfig: VisualContentConfig = {
  splash: {
    logo: hupiSplashLogo,
    backgroundColor: colors.primary,
    footerText: '© hupi.pet. Todos los derechos reservados.',
    soundEnabled: true,
  },
  appBranding: {
    internalLogo: hupiPagesLogo,
    menuLogo: hupiPagesLogo,
    defaultUserAvatar: {
      source: DEFAULT_PROFILE_IMAGES.owner,
      fallbackText: 'HU',
      backgroundColor: colors.secondarySoft,
    },
    defaultProviderAvatar: {
      source: DEFAULT_PROFILE_IMAGES.provider,
      fallbackText: 'HP',
      backgroundColor: colors.secondary,
    },
    defaultPetAvatar: {
      source: DEFAULT_PROFILE_IMAGES.pet,
      fallbackIcon: 'paw-outline' as IoniconName,
      fallbackText: '🐾',
      backgroundColor: colors.soft,
    },
  },
  onboarding: [
    {
      id: 'onboarding-trusted-care',
      title: 'Encuentra paseadores confiables',
      description: 'Agenda paseos seguros para tu mascota y coordina todo dentro de Hupi.',
      image: ONBOARDING_SLIDES[0].image,
      fallbackIcon: 'walk-outline' as IoniconName,
      backgroundColor: '#ef5335',
      isActive: true,
      order: 1,
    },
    {
      id: 'onboarding-pet-history',
      title: 'Todo el historial de tu mascota',
      description: 'Guarda paseos, actividades y datos importantes para conocer mejor a tu mascota.',
      image: ONBOARDING_SLIDES[1].image,
      fallbackIcon: 'reader-outline' as IoniconName,
      backgroundColor: '#ef5335',
      isActive: true,
      order: 2,
    },
    {
      id: 'onboarding-marketplace',
      title: 'Paseos y productos pet en un solo lugar',
      description: 'Hupi empieza con paseos confiables, tiendas oficiales y soporte centralizado.',
      image: ONBOARDING_SLIDES[2].image,
      fallbackIcon: 'bag-handle-outline' as IoniconName,
      backgroundColor: '#ef5335',
      isActive: true,
      order: 3,
    },
  ],
  homeBanners: [
    {
      id: 'home-banner-walk-today',
      title: 'Agenda su paseo hoy',
      subtitle: 'Paseadores cerca de ti.',
      ctaText: 'Reservar ahora',
      targetRoute: '/services/walk',
      isActive: true,
      order: 1,
      eyebrow: 'PLAN PARA HOY',
      icon: 'paw' as IoniconName,
      backgroundColor: colors.primary,
      foregroundColor: colors.white,
      accent: 'rgba(255,255,255,0.18)',
    },
    {
      id: 'home-banner-verified-care',
      title: 'Paseadores verificados',
      subtitle: 'Rutinas claras y coordinación protegida.',
      ctaText: 'Buscar paseadores',
      targetRoute: '/services/walk',
      isActive: true,
      order: 2,
      eyebrow: 'TRANQUILIDAD HUPI',
      icon: 'shield-checkmark' as IoniconName,
      backgroundColor: colors.secondary,
      foregroundColor: colors.white,
      accent: 'rgba(255,255,255,0.16)',
    },
    {
      id: 'home-banner-all-in-one',
      title: 'Marketplace pet Hupi',
      subtitle: 'Productos para paseos, bienestar y rutina.',
      ctaText: 'Comprar ahora',
      targetRoute: '/marketplace',
      isActive: true,
      order: 3,
      eyebrow: 'TODO EN UN LUGAR',
      icon: 'home' as IoniconName,
      backgroundColor: colors.soft,
      foregroundColor: colors.text,
      accent: colors.secondarySoft,
    },
  ],
  marketplaceBanners: [
    {
      id: 'market-banner-1',
      title: 'Ofertas para tu peludo',
      subtitle: 'Snacks, juguetes y accesorios seleccionados con beneficios activos.',
      ctaText: 'Ver ofertas',
      targetRoute: '/marketplace',
      isActive: true,
      order: 1,
      eyebrow: 'OFERTAS',
      accent: '🦴',
      backgroundColor: colors.primary,
      foregroundColor: colors.white,
    },
    {
      id: 'market-banner-2',
      title: 'Productos recomendados por Hupi',
      subtitle: 'Selección curada para bienestar diario y compras recurrentes.',
      ctaText: 'Explorar',
      targetRoute: '/marketplace',
      isActive: true,
      order: 2,
      eyebrow: 'HUPI PICKS',
      accent: '🐾',
      backgroundColor: colors.secondary,
      foregroundColor: colors.white,
    },
    {
      id: 'market-banner-3',
      title: 'Envíos y beneficios especiales',
      subtitle: 'Compra en modo prueba con tracking visual y soporte centralizado Hupi.',
      ctaText: 'Ver beneficios',
      targetRoute: '/marketplace',
      isActive: true,
      order: 3,
      eyebrow: 'BENEFICIOS',
      accent: '🚚',
      backgroundColor: colors.text,
      foregroundColor: colors.white,
    },
  ],
  serviceIcons: {
    walk: { label: 'Paseos', fallbackIcon: 'paw-outline' as IoniconName, backgroundColor: colors.secondarySoft },
    nanny: { label: 'Niñera', fallbackIcon: 'home-outline' as IoniconName, backgroundColor: colors.secondarySoft },
    boarding: { label: 'Hospedaje', fallbackIcon: 'moon-outline' as IoniconName, backgroundColor: colors.secondarySoft },
    daycare: { label: 'Guardería', fallbackIcon: 'sunny-outline' as IoniconName, backgroundColor: colors.secondarySoft },
    grooming: { label: 'Peluquería / Grooming', fallbackIcon: 'cut-outline' as IoniconName, backgroundColor: colors.secondarySoft },
    training: { label: 'Adiestramiento', fallbackIcon: 'school-outline' as IoniconName, backgroundColor: colors.secondarySoft },
  },
  promoImages: [
    {
      id: 'promo-home-trust',
      title: 'Proveedores verificados Hupi',
      section: 'home',
      isActive: true,
      order: 1,
    },
    {
      id: 'promo-marketplace-support',
      title: 'Soporte centralizado Marketplace',
      section: 'marketplace',
      isActive: true,
      order: 2,
    },
  ],
};

export const contentSlots: ContentSlot[] = [
  ...visualContentConfig.onboarding.map((slide) => ({
    id: slide.id,
    key: `mobile.onboarding.${slide.id}`,
    type: 'onboarding' as const,
    title: slide.title,
    description: slide.description,
    isActive: slide.isActive,
    order: slide.order,
    updatedAt: '2026-07-15T00:00:00.000Z',
  })),
  ...visualContentConfig.homeBanners.map((banner) => ({
    id: banner.id,
    key: `mobile.home.banner.${banner.id}`,
    type: 'banner' as const,
    title: banner.title,
    description: banner.subtitle,
    route: banner.targetRoute,
    isActive: banner.isActive,
    order: banner.order,
    updatedAt: '2026-07-15T00:00:00.000Z',
  })),
  ...visualContentConfig.marketplaceBanners.map((banner) => ({
    id: banner.id,
    key: `mobile.marketplace.banner.${banner.id}`,
    type: 'banner' as const,
    title: banner.title,
    description: banner.subtitle,
    route: banner.targetRoute,
    isActive: banner.isActive,
    order: banner.order,
    updatedAt: '2026-07-15T00:00:00.000Z',
  })),
];

export function getActiveOrderedContent<T extends { isActive: boolean; order: number }>(items: readonly T[]) {
  return items
    .filter((item) => item.isActive)
    .slice()
    .sort((a, b) => a.order - b.order);
}

export function getServiceIconConfig(serviceId: ServiceId) {
  const serviceKey = serviceId === 'sitter' ? 'nanny' : serviceId;

  if (serviceKey in visualContentConfig.serviceIcons) {
    return visualContentConfig.serviceIcons[serviceKey as keyof typeof visualContentConfig.serviceIcons];
  }

  return undefined;
}
