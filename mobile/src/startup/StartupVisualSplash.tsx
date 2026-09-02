import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '../../node_modules/react-i18next';

import { visualContentConfig } from '@/constants/contentConfig';
import { AppText } from '@/i18n/components';
import { playHupiBrandSound } from '@/utils/hupiSound';
import { useStartup } from './StartupProvider';

export const VISUAL_SPLASH_DURATION_MS = 3_000;
const SPLASH_FADE_OUT_MS = 220;

export function StartupVisualSplash() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const {
    completeVisualSplash,
    visualSplashRun,
    visualSplashVisible,
  } = useStartup();
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visualSplashVisible) return undefined;

    if (__DEV__) {
      console.info('[startup] visual splash', {
        platform: Platform.OS,
        splashStarted: true,
      });
    }
    opacity.setValue(1);
    if (visualContentConfig.splash.soundEnabled) {
      void playHupiBrandSound();
    }

    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        duration: SPLASH_FADE_OUT_MS,
        easing: Easing.in(Easing.cubic),
        toValue: 0,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          if (__DEV__) {
            console.info('[startup] visual splash', {
              platform: Platform.OS,
              splashFinished: true,
            });
          }
          completeVisualSplash();
        }
      });
    }, VISUAL_SPLASH_DURATION_MS - SPLASH_FADE_OUT_MS);

    return () => {
      clearTimeout(timer);
      opacity.stopAnimation();
    };
  }, [
    completeVisualSplash,
    opacity,
    visualSplashRun,
    visualSplashVisible,
  ]);

  if (!visualSplashVisible) return null;

  return (
    <View
      accessibilityLabel={t('startup.visualSplashLabel')}
      accessibilityRole="progressbar"
      style={[
        styles.overlay,
        { backgroundColor: visualContentConfig.splash.backgroundColor },
      ]}
    >
      <Animated.View style={{ opacity }}>
        <Image
          accessibilityIgnoresInvertColors
          resizeMode="contain"
          source={visualContentConfig.splash.logo}
          style={styles.logo}
        />
      </Animated.View>
      <AppText
        style={[styles.footer, { bottom: Math.max(insets.bottom, 22) }]}
        variant="caption"
      >
        {t('startup.brandFooter')}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1_000,
  },
  logo: {
    height: 122,
    width: 238,
  },
  footer: {
    color: '#f9f9e2',
    left: 24,
    opacity: 0.82,
    position: 'absolute',
    right: 24,
    textAlign: 'center',
  },
});
