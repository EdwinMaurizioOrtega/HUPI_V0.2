module.exports = ({ config }) => {
  const appEnv = process.env.APP_ENV === 'development' ? 'development' : 'production';
  const devAlwaysResetFlow = appEnv === 'development'
    && process.env.DEV_ALWAYS_RESET_FLOW !== 'false';

  return {
    ...config,
    extra: {
      ...config.extra,
      appEnv,
      devAlwaysResetFlow,
      apiBaseUrl: process.env.EXPO_PUBLIC_API_URL ?? '',
    },
    splash: {
      backgroundColor: '#e45336',
      image: './assets/brand/logo_hupi.png',
      resizeMode: 'contain',
    },
  locales: {
    es: './src/i18n/native/es.json',
    en: './src/i18n/native/en.json',
  },
  androidStatusBar: {
    ...config.androidStatusBar,
    backgroundColor: '#e45336',
    barStyle: 'dark-content',
  },
  ios: {
    ...config.ios,
    infoPlist: {
      ...config.ios?.infoPlist,
      CFBundleAllowMixedLocalizations: true,
      NSLocationWhenInUseUsageDescription: 'Hupi usa tu ubicación para encontrar paseadores cerca de ti y confirmar el punto de servicio.',
      UIStatusBarStyle: 'UIStatusBarStyleDarkContent',
    },
  },
  plugins: [
    ...(config.plugins ?? []),
    [
      'expo-splash-screen',
      {
        backgroundColor: '#e45336',
        image: './assets/brand/logo_hupi.png',
        imageWidth: 220,
        resizeMode: 'contain',
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission: 'Hupi usa tu ubicación para encontrar paseadores cerca de ti y confirmar el punto de servicio.',
      },
    ],
    [
      'expo-image-picker',
      {
        cameraPermission: 'Hupi usa la cámara para permitirte tomar una foto de perfil.',
        photosPermission: 'Hupi accede a tus fotos para permitirte elegir una foto de perfil.',
      },
    ],
    [
      'expo-localization',
      {
        supportedLocales: {
          ios: ['es', 'en'],
          android: ['es', 'en'],
        },
      },
    ],
    ],
  };
};
