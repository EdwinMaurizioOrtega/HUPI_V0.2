import {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { Platform } from 'react-native';
import { useTranslation } from '../../node_modules/react-i18next';

import { isCustomerProfileComplete } from '@/domain/profile';
import {
  isDevelopmentEnvironment,
  shouldAlwaysResetDevelopmentFlow,
} from '@/config/environment';
import {
  resolveStartupDestination,
  type StartupDestination,
  type StartupState,
} from '@/domain/startup';
import { useLocalAccount } from '@/hooks/useLocalAccount';
import { getCurrentLanguage } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import {
  completeLocalOnboarding,
  completeLocalOnboardingForCurrentSession,
  resetLocalStartupForDevelopment,
} from '@/data/localAccountRepository';

type StartupContextValue = {
  completeOnboarding: () => void;
  completeVisualSplash: () => void;
  destination: StartupDestination;
  qaOnboardingEnabled: boolean;
  resetWelcomeFlow: () => void;
  state: StartupState;
  visualSplashRun: number;
  visualSplashVisible: boolean;
};

const StartupContext = createContext<StartupContextValue | null>(null);

export function StartupProvider({ children }: PropsWithChildren) {
  const account = useLocalAccount();
  const { i18n } = useTranslation();
  const { appearance } = useTheme();
  const qaOnboardingEnabled = shouldAlwaysResetDevelopmentFlow();
  // Una única superficie Hupi cubre el handoff del splash nativo en todas las
  // plataformas. La ruta de onboarding se prepara detrás de esta capa.
  const [visualSplashVisible, setVisualSplashVisible] = useState(true);
  const [visualSplashRun, setVisualSplashRun] = useState(0);
  const completeVisualSplash = useCallback(() => setVisualSplashVisible(false), []);
  const completeOnboarding = useCallback(() => {
    if (qaOnboardingEnabled) {
      completeLocalOnboardingForCurrentSession();
      return;
    }
    completeLocalOnboarding();
  }, [qaOnboardingEnabled]);
  const resetWelcomeFlow = useCallback(() => {
    if (!isDevelopmentEnvironment()) return;
    setVisualSplashRun((current) => current + 1);
    setVisualSplashVisible(true);
    resetLocalStartupForDevelopment();
  }, []);
  const state = useMemo<StartupState>(() => ({
    ready: account.ready,
    hasCompletedOnboarding: account.onboardingCompleted,
    hasAuthenticatedSession: account.session.loggedIn,
    hasVerifiedPhone: account.session.phoneVerified,
    hasCompletedProfile: account.profileCompleted && isCustomerProfileComplete(account.profile),
    selectedLanguage: getCurrentLanguage(),
    selectedAppearance: appearance,
  }), [account, appearance, i18n.resolvedLanguage]);

  const value = useMemo<StartupContextValue>(() => ({
    completeOnboarding,
    completeVisualSplash,
    destination: resolveStartupDestination(state),
    qaOnboardingEnabled,
    resetWelcomeFlow,
    state,
    visualSplashRun,
    visualSplashVisible,
  }), [
    completeOnboarding,
    completeVisualSplash,
    qaOnboardingEnabled,
    resetWelcomeFlow,
    state,
    visualSplashRun,
    visualSplashVisible,
  ]);

  useEffect(() => {
    if (Platform.OS !== 'web' || !isDevelopmentEnvironment()) return undefined;

    const qaGlobal = globalThis as typeof globalThis & {
      hupiQa?: { resetWelcomeFlow: () => void };
    };
    qaGlobal.hupiQa = { resetWelcomeFlow };
    if (__DEV__) {
      console.info('[qa] Reset disponible: hupiQa.resetWelcomeFlow()');
    }
    return () => {
      delete qaGlobal.hupiQa;
    };
  }, [resetWelcomeFlow]);

  return <StartupContext.Provider value={value}>{children}</StartupContext.Provider>;
}

export function useStartup() {
  const context = useContext(StartupContext);
  if (!context) throw new Error('useStartup must be used inside StartupProvider.');
  return context;
}
