import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { hupiFontAssets } from '@/constants/typography';
import { visualContentConfig } from '@/constants/contentConfig';
import { shouldAlwaysResetDevelopmentFlow } from '@/config/environment';
import {
  getLocalAccountSnapshot,
  initializeLocalAccountRepository,
  prepareLocalStartupForQaSession,
} from '@/data/localAccountRepository';
import { initializeLocalProviderRepository } from '@/data/localProviderRepository';
import { primeRemoteData } from '@/data/remoteOverlay';
import { initializeI18n } from '@/i18n';
import { LocalizedPromptHost } from '@/i18n/components';
import {
  logStartupMilestone,
  STARTUP_SAFETY_TIMEOUT_MS,
  withStartupTimeout,
} from '@/startup/bootstrap';
import { StartupProvider, useStartup } from '@/startup/StartupProvider';
import { StartupRecoveryScreen } from '@/startup/StartupRecoveryScreen';
import { StartupRouteGuard } from '@/startup/StartupRouteGuard';
import { StartupVisualSplash } from '@/startup/StartupVisualSplash';
import {
  loadAppearancePreference,
  ThemeProvider,
  useTheme,
} from '@/theme/ThemeProvider';
import type { AppearancePreference } from '@/theme/appearance';
import { initializeMockWalkOperations } from '@/constants/mockBookings';
import { configureGlobalTypography } from '@/utils/configureTypography';

void SplashScreen.preventAutoHideAsync().catch((error) => {
  if (__DEV__) {
    console.warn('[startup] No se pudo mantener visible el splash nativo.', error);
  }
});

type DependencyState =
  | { phase: 'initializing' }
  | { appearance: AppearancePreference; phase: 'ready' }
  | { error: unknown; phase: 'error' };

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(hupiFontAssets);
  const [attempt, setAttempt] = useState(0);
  const [attemptStartedAt, setAttemptStartedAt] = useState(() => Date.now());
  const [dependencies, setDependencies] = useState<DependencyState>({ phase: 'initializing' });
  const [destinationReady, setDestinationReady] = useState(false);
  const [rootViewReady, setRootViewReady] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const fontsLoggedRef = useRef(false);
  const qaStartupPreparedRef = useRef(false);
  const splashHiddenRef = useRef(false);
  const fontsSettled = fontsLoaded || Boolean(fontError);
  const dependenciesReady = dependencies.phase === 'ready';
  const startupFailed = timedOut || dependencies.phase === 'error';
  const bootstrapReady = fontsSettled && dependenciesReady && !timedOut;

  useEffect(() => {
    if (fontsSettled) {
      configureGlobalTypography();
    }
    if (fontsSettled && !fontsLoggedRef.current) {
      fontsLoggedRef.current = true;
      logStartupMilestone('fontsLoaded', fontsLoaded);
    }
    if (fontError && __DEV__) {
      console.warn(
        '[fonts] Fredoka no pudo cargarse; se usará el fallback técnico de la plataforma.',
        fontError,
      );
    }
  }, [fontError, fontsLoaded, fontsSettled]);

  useEffect(() => {
    let active = true;
    setDependencies({ phase: 'initializing' });

    // No bloquea el arranque: los datos remotos llegan y refrescan las pantallas.
    primeRemoteData();

    Promise.allSettled([
      initializeI18n(),
      initializeLocalAccountRepository(),
      initializeLocalProviderRepository(),
      initializeMockWalkOperations(),
      loadAppearancePreference(),
    ]).then(([languageResult, accountResult, providerResult, walkResult, appearanceResult]) => {
      if (!active) return;
      if (languageResult.status === 'rejected') {
        throw languageResult.reason;
      }

      if (accountResult.status === 'rejected' && __DEV__) {
        console.warn('[startup] Se usará el estado local seguro.', accountResult.reason);
      }
      if (providerResult.status === 'rejected' && __DEV__) {
        console.warn('[startup] Se usará el proveedor local seguro.', providerResult.reason);
      }
      if (walkResult.status === 'rejected' && __DEV__) {
        console.warn('[startup] Se usarán los paseos mock seguros.', walkResult.reason);
      }
      if (appearanceResult.status === 'rejected' && __DEV__) {
        console.warn('[startup] Se usará la apariencia system.', appearanceResult.reason);
      }

      if (
        accountResult.status === 'fulfilled'
        && shouldAlwaysResetDevelopmentFlow()
        && !qaStartupPreparedRef.current
      ) {
        qaStartupPreparedRef.current = true;
        prepareLocalStartupForQaSession();
        if (__DEV__) {
          console.info('[startup] native QA mode', {
            platform: Platform.OS,
            __DEV__,
            qaOnboardingEnabled: true,
          });
        }
      }

      const account = getLocalAccountSnapshot();
      const appearance = appearanceResult.status === 'fulfilled'
        ? appearanceResult.value
        : 'system';

      logStartupMilestone('preferencesHydrated', true);
      logStartupMilestone('onboardingResolved', account.ready);
      logStartupMilestone('sessionResolved', account.ready);
      logStartupMilestone('profileResolved', account.ready);
      setDependencies({ appearance, phase: 'ready' });
    }).catch((error) => {
      if (!active) return;
      if (__DEV__) {
        console.warn('[startup] Falló la inicialización de Hupi.', error);
      }
      setDependencies({ error, phase: 'error' });
    });

    return () => {
      active = false;
    };
  }, [attempt]);

  useEffect(() => {
    if (bootstrapReady || startupFailed) return undefined;
    const elapsed = Date.now() - attemptStartedAt;
    const remaining = Math.max(0, STARTUP_SAFETY_TIMEOUT_MS - elapsed);
    const timeout = setTimeout(() => {
      if (__DEV__) {
        console.warn(`[startup] La inicialización superó ${STARTUP_SAFETY_TIMEOUT_MS}ms.`);
      }
      setTimedOut(true);
    }, remaining);
    return () => clearTimeout(timeout);
  }, [attemptStartedAt, bootstrapReady, startupFailed]);

  useEffect(() => {
    if (
      !rootViewReady
      || (!bootstrapReady && !startupFailed)
      || (!startupFailed && !destinationReady)
      || splashHiddenRef.current
    ) {
      return undefined;
    }
    splashHiddenRef.current = true;
    void withStartupTimeout(
      SplashScreen.hideAsync(),
      2_000,
      'Native splash hide timed out.',
    )
      .catch((error) => {
        if (__DEV__) {
          console.warn('[startup] No se pudo ocultar el splash nativo.', error);
        }
        SplashScreen.hide();
      })
      .finally(() => {
        logStartupMilestone('splashHidden', true);
      });
    return undefined;
  }, [bootstrapReady, destinationReady, rootViewReady, startupFailed]);

  const retry = useCallback(() => {
    setAttemptStartedAt(Date.now());
    setDestinationReady(false);
    setTimedOut(false);
    setDependencies({ phase: 'initializing' });
    setAttempt((current) => current + 1);
  }, []);

  const appearance = dependencies.phase === 'ready'
    ? dependencies.appearance
    : 'system';
  const handleDestinationReady = useCallback(() => setDestinationReady(true), []);

  return (
    <View onLayout={() => setRootViewReady(true)} style={styles.root}>
      {bootstrapReady || startupFailed ? (
        <SafeAreaProvider>
          <ThemeProvider initialAppearance={appearance}>
            {startupFailed ? (
              <StartupRecoveryScreen onRetry={retry} />
            ) : bootstrapReady ? (
              <StartupProvider>
                <ThemedApplication onDestinationReady={handleDestinationReady} />
              </StartupProvider>
            ) : null}
          </ThemeProvider>
        </SafeAreaProvider>
      ) : null}
    </View>
  );
}

function ThemedApplication({ onDestinationReady }: { onDestinationReady: () => void }) {
  const { resolvedTheme, tokens } = useTheme();
  const { visualSplashVisible } = useStartup();
  const startupBackground = visualContentConfig.splash.backgroundColor;
  const statusBarStyle = visualSplashVisible
    ? 'dark'
    : resolvedTheme === 'dark' ? 'light' : 'dark';

  return (
    <>
      <StatusBar
        backgroundColor={visualSplashVisible ? startupBackground : tokens.background}
        style={statusBarStyle}
      />
      <LocalizedPromptHost />
      <View
        style={[
          styles.application,
          Platform.OS === 'web' && styles.webApplication,
          { backgroundColor: tokens.background },
        ]}
      >
        <StartupRouteGuard onDestinationReady={onDestinationReady}>
          <Stack
            screenOptions={{
              animation: 'slide_from_right',
              contentStyle: { backgroundColor: tokens.background },
              headerShown: false,
            }}
          >
            <Stack.Screen name="index" options={{ animation: 'fade' }} />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(onboarding)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="provider" />
          </Stack>
        </StartupRouteGuard>
        <StartupVisualSplash />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: visualContentConfig.splash.backgroundColor,
    flex: 1,
  },
  application: { flex: 1, width: '100%' },
  webApplication: {
    alignSelf: 'center',
    maxWidth: 600,
    overflow: 'hidden',
    shadowColor: '#1f1725',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
  },
});
